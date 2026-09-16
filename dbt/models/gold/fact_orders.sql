{{
  config(
    materialized='table',
    partition_by={'field': 'order_date', 'data_type': 'timestamp', 'granularity': 'day'},
    cluster_by=['customer_id', 'status']
  )
}}

SELECT
  o.order_id,
  o.customer_id,
  c.customer_name,
  c.customer_type,
  c.country AS customer_country,
  o.order_date,
  o.status,
  o.total_amount,
  COUNT(oi.product_id) AS item_count,
  SUM(oi.quantity) AS total_quantity
FROM {{ source('silver', 'orders') }} o
LEFT JOIN {{ source('silver', 'customers') }} c USING (customer_id)
LEFT JOIN {{ source('silver', 'order_items') }} oi USING (order_id)
GROUP BY ALL
