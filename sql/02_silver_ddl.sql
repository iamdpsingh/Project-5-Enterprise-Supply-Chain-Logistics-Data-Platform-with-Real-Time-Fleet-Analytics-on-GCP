-- =====================================================
-- SILVER LAYER — Cleaned, typed, deduplicated tables
-- Partitioned and clustered for performance.
-- =====================================================

CREATE SCHEMA IF NOT EXISTS `supply-chain-logistics-508517.silver`
  OPTIONS (location = 'US');

-- Orders (partitioned by order_date, clustered by status)
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.silver.orders`
PARTITION BY DATE(order_date)
CLUSTER BY status
AS
SELECT DISTINCT
  order_id,
  customer_id,
  order_date,
  UPPER(TRIM(status)) AS status,
  CAST(total_amount AS FLOAT64) AS total_amount
FROM `supply-chain-logistics-508517.bronze.orders`
WHERE order_id IS NOT NULL;

-- Order Items
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.silver.order_items`
CLUSTER BY order_id
AS
SELECT DISTINCT
  order_id,
  product_id,
  quantity,
  unit_price
FROM `supply-chain-logistics-508517.bronze.order_items`
WHERE order_id IS NOT NULL AND product_id IS NOT NULL;

-- Customers
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.silver.customers`
CLUSTER BY country
AS
SELECT DISTINCT
  customer_id,
  TRIM(customer_name) AS customer_name,
  customer_type,
  country,
  registration_date
FROM `supply-chain-logistics-508517.bronze.customers`
WHERE customer_id IS NOT NULL;

-- Products
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.silver.products`
CLUSTER BY category
AS
SELECT DISTINCT
  product_id,
  TRIM(product_name) AS product_name,
  category,
  unit_price,
  weight_kg
FROM `supply-chain-logistics-508517.bronze.products`
WHERE product_id IS NOT NULL;

-- Suppliers
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.silver.suppliers` AS
SELECT DISTINCT
  supplier_id,
  TRIM(supplier_name) AS supplier_name,
  rating,
  country
FROM `supply-chain-logistics-508517.bronze.suppliers`
WHERE supplier_id IS NOT NULL;

-- Warehouses
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.silver.warehouses` AS
SELECT DISTINCT *
FROM `supply-chain-logistics-508517.bronze.warehouses`
WHERE warehouse_id IS NOT NULL;

-- Vehicles
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.silver.vehicles`
CLUSTER BY vehicle_type
AS
SELECT DISTINCT
  vehicle_id,
  vehicle_type,
  capacity_kg,
  year,
  UPPER(TRIM(status)) AS status
FROM `supply-chain-logistics-508517.bronze.vehicles`
WHERE vehicle_id IS NOT NULL;

-- Drivers
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.silver.drivers` AS
SELECT DISTINCT *
FROM `supply-chain-logistics-508517.bronze.drivers`
WHERE driver_id IS NOT NULL;

-- Shipments (partitioned by dispatch_date, clustered by vehicle_id)
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.silver.shipments`
PARTITION BY DATE(dispatch_date)
CLUSTER BY vehicle_id, warehouse_id
AS
SELECT DISTINCT
  shipment_id,
  order_id,
  vehicle_id,
  driver_id,
  warehouse_id,
  dispatch_date,
  expected_delivery_date,
  actual_delivery_date,
  TIMESTAMP_DIFF(actual_delivery_date, expected_delivery_date, DAY) AS delivery_delay_days,
  CASE
    WHEN actual_delivery_date > expected_delivery_date THEN TRUE
    ELSE FALSE
  END AS is_delayed
FROM `supply-chain-logistics-508517.bronze.shipments`
WHERE shipment_id IS NOT NULL;

-- IoT Telemetry (partitioned by timestamp, clustered by vehicle_id)
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.silver.iot_telemetry`
PARTITION BY DATE(timestamp)
CLUSTER BY vehicle_id
AS
SELECT DISTINCT
  event_id,
  vehicle_id,
  timestamp,
  latitude,
  longitude,
  ROUND(speed_kmh, 2)            AS speed_kmh,
  ROUND(fuel_level_pct, 2)       AS fuel_level_pct,
  ROUND(engine_temperature_c, 2) AS engine_temperature_c,
  -- Quality flags
  CASE WHEN speed_kmh > 120 THEN TRUE ELSE FALSE END AS is_speeding,
  CASE WHEN engine_temperature_c > 105 THEN TRUE ELSE FALSE END AS engine_overheating
FROM `supply-chain-logistics-508517.bronze.iot_telemetry`
WHERE event_id IS NOT NULL
  AND latitude BETWEEN -90 AND 90
  AND longitude BETWEEN -180 AND 180
  AND speed_kmh >= 0
  AND fuel_level_pct BETWEEN 0 AND 100;
