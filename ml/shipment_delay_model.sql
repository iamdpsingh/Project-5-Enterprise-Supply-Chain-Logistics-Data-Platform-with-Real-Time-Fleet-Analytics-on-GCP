-- =====================================================
-- BIGQUERY ML — Shipment Delay Prediction
-- Logistic Regression model to predict delayed shipments.
-- =====================================================

-- Step 1: Create training dataset
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.ml_training_data` AS
SELECT
  s.shipment_id,
  s.delivery_delay_days,
  s.is_delayed AS label,
  v.vehicle_type,
  v.capacity_kg,
  v.year AS vehicle_year,
  w.capacity_sqft AS warehouse_capacity,
  o.total_amount AS order_value,
  EXTRACT(DAYOFWEEK FROM s.dispatch_date) AS dispatch_day_of_week,
  EXTRACT(HOUR FROM s.dispatch_date) AS dispatch_hour,
  TIMESTAMP_DIFF(s.expected_delivery_date, s.dispatch_date, DAY) AS planned_transit_days,
FROM `supply-chain-logistics-508517.silver.shipments` s
LEFT JOIN `supply-chain-logistics-508517.silver.vehicles` v USING (vehicle_id)
LEFT JOIN `supply-chain-logistics-508517.silver.warehouses` w USING (warehouse_id)
LEFT JOIN `supply-chain-logistics-508517.silver.orders` o USING (order_id)
WHERE s.actual_delivery_date IS NOT NULL;

-- Step 2: Train model
CREATE OR REPLACE MODEL `supply-chain-logistics-508517.gold.shipment_delay_model`
OPTIONS (
  model_type = 'LOGISTIC_REG',
  input_label_cols = ['label'],
  auto_class_weights = TRUE,
  max_iterations = 20,
  data_split_method = 'AUTO_SPLIT'
) AS
SELECT * EXCEPT (shipment_id, delivery_delay_days)
FROM `supply-chain-logistics-508517.gold.ml_training_data`;

-- Step 3: Evaluate model
SELECT *
FROM ML.EVALUATE(MODEL `supply-chain-logistics-508517.gold.shipment_delay_model`);

-- Step 4: Predict on new shipments
CREATE OR REPLACE TABLE `supply-chain-logistics-508517.gold.shipment_delay_predictions` AS
SELECT
  shipment_id,
  predicted_label AS predicted_delayed,
  predicted_label_probs
FROM ML.PREDICT(
  MODEL `supply-chain-logistics-508517.gold.shipment_delay_model`,
  (SELECT * EXCEPT (label, delivery_delay_days)
   FROM `supply-chain-logistics-508517.gold.ml_training_data`)
);
