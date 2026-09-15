{{
  config(
    materialized='incremental',
    unique_key='event_id',
    partition_by={'field': 'timestamp', 'data_type': 'timestamp', 'granularity': 'day'},
    cluster_by=['vehicle_id']
  )
}}

SELECT
  t.event_id,
  t.vehicle_id,
  v.vehicle_type,
  t.timestamp,
  t.latitude,
  t.longitude,
  t.speed_kmh,
  t.fuel_level_pct,
  t.engine_temperature_c,
  t.is_speeding,
  t.engine_overheating
FROM {{ source('silver', 'iot_telemetry') }} t
LEFT JOIN {{ source('silver', 'vehicles') }} v USING (vehicle_id)

{% if is_incremental() %}
WHERE t.timestamp > (SELECT MAX(timestamp) FROM {{ this }})
{% endif %}
