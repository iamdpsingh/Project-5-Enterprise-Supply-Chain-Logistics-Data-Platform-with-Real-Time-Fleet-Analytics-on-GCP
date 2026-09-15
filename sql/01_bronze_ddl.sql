-- =====================================================
-- BRONZE LAYER — Raw ingested tables in BigQuery
-- Mirrors the raw CSV structure with minimal typing.
-- =====================================================

-- Dataset creation
CREATE SCHEMA IF NOT EXISTS `supply-chain-logistics-508517.bronze`
  OPTIONS (location = 'US');

-- Orders
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.bronze.orders` (
  order_id        STRING,
  customer_id     STRING,
  order_date      TIMESTAMP,
  status          STRING,
  total_amount    FLOAT64
);

-- Order Items
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.bronze.order_items` (
  order_id    STRING,
  product_id  STRING,
  quantity    INT64,
  unit_price  FLOAT64
);

-- Customers
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.bronze.customers` (
  customer_id       STRING,
  customer_name     STRING,
  customer_type     STRING,
  country           STRING,
  registration_date DATE
);

-- Products
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.bronze.products` (
  product_id    STRING,
  product_name  STRING,
  category      STRING,
  unit_price    FLOAT64,
  weight_kg     FLOAT64
);

-- Suppliers
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.bronze.suppliers` (
  supplier_id     STRING,
  supplier_name   STRING,
  rating          FLOAT64,
  country         STRING
);

-- Warehouses
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.bronze.warehouses` (
  warehouse_id    STRING,
  location        STRING,
  capacity_sqft   INT64,
  manager_name    STRING
);

-- Vehicles
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.bronze.vehicles` (
  vehicle_id      STRING,
  vehicle_type    STRING,
  capacity_kg     INT64,
  year            INT64,
  status          STRING
);

-- Drivers
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.bronze.drivers` (
  driver_id       STRING,
  driver_name     STRING,
  license_type    STRING,
  hire_date       DATE
);

-- Shipments
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.bronze.shipments` (
  shipment_id             STRING,
  order_id                STRING,
  vehicle_id              STRING,
  driver_id               STRING,
  warehouse_id            STRING,
  dispatch_date           TIMESTAMP,
  expected_delivery_date  TIMESTAMP,
  actual_delivery_date    TIMESTAMP
);

-- IoT Telemetry
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.bronze.iot_telemetry` (
  event_id              STRING,
  vehicle_id            STRING,
  timestamp             TIMESTAMP,
  latitude              FLOAT64,
  longitude             FLOAT64,
  speed_kmh             FLOAT64,
  fuel_level_pct        FLOAT64,
  engine_temperature_c  FLOAT64
);
