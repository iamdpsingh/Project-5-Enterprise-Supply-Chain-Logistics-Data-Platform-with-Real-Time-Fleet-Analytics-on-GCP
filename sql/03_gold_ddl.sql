-- =====================================================
-- GOLD LAYER — Dimensional Model (Star Schema)
-- Fact & Dimension tables for analytics.
-- =====================================================

CREATE SCHEMA IF NOT EXISTS `supply-chain-logistics-508517.gold`
  OPTIONS (location = 'US');

-- ===================== DIMENSIONS =====================

-- dim_date (utility dimension)
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.dim_date` AS
SELECT
  d AS date_key,
  EXTRACT(YEAR FROM d)    AS year,
  EXTRACT(QUARTER FROM d) AS quarter,
  EXTRACT(MONTH FROM d)   AS month,
  FORMAT_DATE('%B', d)     AS month_name,
  EXTRACT(WEEK FROM d)    AS week,
  EXTRACT(DAYOFWEEK FROM d) AS day_of_week,
  FORMAT_DATE('%A', d)     AS day_name,
  CASE WHEN EXTRACT(DAYOFWEEK FROM d) IN (1, 7) THEN TRUE ELSE FALSE END AS is_weekend
FROM UNNEST(GENERATE_DATE_ARRAY('2022-01-01', '2027-12-31')) AS d;

-- dim_customer
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.dim_customer` AS
SELECT
  customer_id,
  customer_name,
  customer_type,
  country,
  registration_date,
  CURRENT_TIMESTAMP() AS effective_from,
  TIMESTAMP('9999-12-31') AS effective_to,
  TRUE AS is_current
FROM `supply-chain-logistics-508517.silver.customers`;

-- dim_product
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.dim_product` AS
SELECT
  product_id,
  product_name,
  category,
  unit_price,
  weight_kg
FROM `supply-chain-logistics-508517.silver.products`;

-- dim_supplier
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.dim_supplier` AS
SELECT
  supplier_id,
  supplier_name,
  rating,
  country
FROM `supply-chain-logistics-508517.silver.suppliers`;

-- dim_warehouse
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.dim_warehouse` AS
SELECT
  warehouse_id,
  location,
  capacity_sqft,
  manager_name
FROM `supply-chain-logistics-508517.silver.warehouses`;

-- dim_vehicle
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.dim_vehicle` AS
SELECT
  vehicle_id,
  vehicle_type,
  capacity_kg,
  year,
  status,
  CURRENT_TIMESTAMP() AS effective_from,
  TIMESTAMP('9999-12-31') AS effective_to,
  TRUE AS is_current
FROM `supply-chain-logistics-508517.silver.vehicles`;

-- dim_driver
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.dim_driver` AS
SELECT
  driver_id,
  driver_name,
  license_type,
  hire_date
FROM `supply-chain-logistics-508517.silver.drivers`;

-- ===================== FACTS =====================

-- fact_orders (partitioned by order_date)
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.fact_orders`
PARTITION BY DATE(order_date)
CLUSTER BY customer_id, status
AS
SELECT
  o.order_id,
  o.customer_id,
  o.order_date,
  o.status,
  o.total_amount,
  COUNT(oi.product_id) AS item_count,
  SUM(oi.quantity)     AS total_quantity
FROM `supply-chain-logistics-508517.silver.orders` o
LEFT JOIN `supply-chain-logistics-508517.silver.order_items` oi USING (order_id)
GROUP BY o.order_id, o.customer_id, o.order_date, o.status, o.total_amount;

-- fact_shipments (partitioned by dispatch_date)
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.fact_shipments`
PARTITION BY DATE(dispatch_date)
CLUSTER BY vehicle_id, warehouse_id
AS
SELECT
  s.shipment_id,
  s.order_id,
  s.vehicle_id,
  s.driver_id,
  s.warehouse_id,
  s.dispatch_date,
  s.expected_delivery_date,
  s.actual_delivery_date,
  s.delivery_delay_days,
  s.is_delayed,
  o.total_amount AS order_value
FROM `supply-chain-logistics-508517.silver.shipments` s
LEFT JOIN `supply-chain-logistics-508517.silver.orders` o USING (order_id);

-- fact_fleet_telemetry (partitioned by timestamp)
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.fact_fleet_telemetry`
PARTITION BY DATE(timestamp)
CLUSTER BY vehicle_id
AS
SELECT
  t.event_id,
  t.vehicle_id,
  t.timestamp,
  t.latitude,
  t.longitude,
  t.speed_kmh,
  t.fuel_level_pct,
  t.engine_temperature_c,
  t.is_speeding,
  t.engine_overheating,
  v.vehicle_type,
  v.capacity_kg
FROM `supply-chain-logistics-508517.silver.iot_telemetry` t
LEFT JOIN `supply-chain-logistics-508517.silver.vehicles` v USING (vehicle_id);
