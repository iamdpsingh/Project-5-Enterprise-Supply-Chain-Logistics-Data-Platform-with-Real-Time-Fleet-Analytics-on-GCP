{{
  config(
    materialized='table',
    partition_by={'field': 'dispatch_date', 'data_type': 'timestamp', 'granularity': 'day'},
    cluster_by=['vehicle_id', 'warehouse_id']
  )
}}

SELECT
  s.shipment_id,
  s.order_id,
  s.vehicle_id,
  v.vehicle_type,
  s.driver_id,
  d.driver_name,
  s.warehouse_id,
  w.location AS warehouse_location,
  s.dispatch_date,
  s.expected_delivery_date,
  s.actual_delivery_date,
  s.delivery_delay_days,
  s.is_delayed,
  o.total_amount AS order_value
FROM {{ source('silver', 'shipments') }} s
LEFT JOIN {{ source('silver', 'vehicles') }} v USING (vehicle_id)
LEFT JOIN {{ source('silver', 'drivers') }} d USING (driver_id)
LEFT JOIN {{ source('silver', 'warehouses') }} w USING (warehouse_id)
LEFT JOIN {{ source('silver', 'orders') }} o USING (order_id)
