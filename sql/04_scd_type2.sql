-- =====================================================
-- SCD TYPE 2 — Slowly Changing Dimension (Customer)
-- Tracks historical changes to customer records.
-- =====================================================

-- MERGE to handle updates (SCD Type 2)
MERGE INTO `supply-chain-logistics-508517.gold.dim_customer` AS target
USING (
  SELECT
    customer_id,
    customer_name,
    customer_type,
    country,
    registration_date
  FROM `supply-chain-logistics-508517.silver.customers`
) AS source
ON target.customer_id = source.customer_id AND target.is_current = TRUE

-- When matched and data has changed → expire old, insert new
WHEN MATCHED AND (
  target.customer_name != source.customer_name OR
  target.customer_type != source.customer_type OR
  target.country != source.country
) THEN UPDATE SET
  effective_to = CURRENT_TIMESTAMP(),
  is_current = FALSE

WHEN NOT MATCHED THEN INSERT (
  customer_id, customer_name, customer_type, country,
  registration_date, effective_from, effective_to, is_current
) VALUES (
  source.customer_id, source.customer_name, source.customer_type, source.country,
  source.registration_date, CURRENT_TIMESTAMP(), TIMESTAMP('9999-12-31'), TRUE
);

-- After the MERGE, insert the new current version for expired rows
INSERT INTO `supply-chain-logistics-508517.gold.dim_customer`
SELECT
  s.customer_id,
  s.customer_name,
  s.customer_type,
  s.country,
  s.registration_date,
  CURRENT_TIMESTAMP() AS effective_from,
  TIMESTAMP('9999-12-31') AS effective_to,
  TRUE AS is_current
FROM `supply-chain-logistics-508517.silver.customers` s
INNER JOIN `supply-chain-logistics-508517.gold.dim_customer` t
  ON s.customer_id = t.customer_id
WHERE t.is_current = FALSE
  AND NOT EXISTS (
    SELECT 1 FROM `supply-chain-logistics-508517.gold.dim_customer` t2
    WHERE t2.customer_id = s.customer_id AND t2.is_current = TRUE
  );
