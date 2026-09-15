"""
PySpark Transformations — Phase 4
Reads raw CSV data, cleanses, joins, deduplicates, and writes Parquet to processed zone.
"""
import os
import sys
from pyspark.sql import functions as F
from pyspark.sql.types import TimestampType, FloatType, IntegerType

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spark_config import get_spark
from quality_checks import check_nulls, check_duplicates, split_valid_invalid

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(BASE, "data", "structured")
SEMI = os.path.join(BASE, "data", "semi_structured")
PROCESSED = os.path.join(BASE, "data", "processed")
REJECTED = os.path.join(BASE, "data", "rejected")

os.makedirs(PROCESSED, exist_ok=True)
os.makedirs(REJECTED, exist_ok=True)


def main():
    spark = get_spark("SupplyChain_Phase4")

    # ------------------------------------------------------------------
    # 1. LOAD RAW CSVs
    # ------------------------------------------------------------------
    tables = {
        "customers": ("customers.csv", ["customer_id"]),
        "products":  ("products.csv",  ["product_id"]),
        "suppliers": ("suppliers.csv",  ["supplier_id"]),
        "warehouses":("warehouses.csv", ["warehouse_id"]),
        "vehicles":  ("vehicles.csv",   ["vehicle_id"]),
        "drivers":   ("drivers.csv",    ["driver_id"]),
        "orders":    ("orders.csv",     ["order_id"]),
        "order_items":("order_items.csv",["order_id", "product_id"]),
        "shipments": ("shipments.csv",  ["shipment_id"]),
    }

    dfs = {}
    for name, (filename, keys) in tables.items():
        path = os.path.join(RAW, filename)
        print(f"Loading {name} from {path}...")
        df = spark.read.csv(path, header=True, inferSchema=True)

        # Deduplicate
        df = check_duplicates(df, keys)
        valid, dupes = split_valid_invalid(df, ["_is_duplicate"])

        if dupes.count() > 0:
            dupes.write.mode("overwrite").parquet(
                os.path.join(REJECTED, f"{name}_duplicates")
            )
            print(f"  ⚠ {name}: {dupes.count()} duplicates quarantined.")

        dfs[name] = valid
        print(f"  ✓ {name}: {valid.count()} clean rows.")

    # ------------------------------------------------------------------
    # 2. CLEANSE — Cast types & standardize
    # ------------------------------------------------------------------
    dfs["orders"] = (
        dfs["orders"]
        .withColumn("order_date", F.col("order_date").cast(TimestampType()))
        .withColumn("total_amount", F.col("total_amount").cast(FloatType()))
        .withColumn("status", F.upper(F.trim(F.col("status"))))
    )

    dfs["shipments"] = (
        dfs["shipments"]
        .withColumn("dispatch_date", F.col("dispatch_date").cast(TimestampType()))
        .withColumn("expected_delivery_date", F.col("expected_delivery_date").cast(TimestampType()))
        .withColumn("actual_delivery_date", F.col("actual_delivery_date").cast(TimestampType()))
    )

    # ------------------------------------------------------------------
    # 3. JOINS — Enriched order-shipment dataset
    # ------------------------------------------------------------------
    enriched_orders = (
        dfs["orders"]
        .join(dfs["customers"], "customer_id", "left")
        .join(
            dfs["shipments"].select(
                "shipment_id", "order_id", "vehicle_id", "driver_id",
                "warehouse_id", "dispatch_date",
                "expected_delivery_date", "actual_delivery_date"
            ),
            "order_id", "left"
        )
        .withColumn(
            "delivery_delay_days",
            F.datediff(F.col("actual_delivery_date"), F.col("expected_delivery_date"))
        )
        .withColumn(
            "is_delayed",
            F.when(F.col("delivery_delay_days") > 0, True).otherwise(False)
        )
    )

    enriched_shipments = (
        dfs["shipments"]
        .join(dfs["vehicles"], "vehicle_id", "left")
        .join(dfs["drivers"], "driver_id", "left")
        .join(dfs["warehouses"], "warehouse_id", "left")
        .withColumn(
            "transit_days",
            F.datediff(F.col("actual_delivery_date"), F.col("dispatch_date"))
        )
    )

    # ------------------------------------------------------------------
    # 4. AGGREGATIONS
    # ------------------------------------------------------------------
    order_summary = (
        dfs["orders"]
        .groupBy("status")
        .agg(
            F.count("order_id").alias("order_count"),
            F.sum("total_amount").alias("total_revenue"),
            F.avg("total_amount").alias("avg_order_value"),
        )
    )

    # ------------------------------------------------------------------
    # 5. WRITE PARQUET (to processed zone)
    # ------------------------------------------------------------------
    outputs = {
        "customers":          dfs["customers"],
        "products":           dfs["products"],
        "suppliers":          dfs["suppliers"],
        "warehouses":         dfs["warehouses"],
        "vehicles":           dfs["vehicles"],
        "drivers":            dfs["drivers"],
        "orders":             dfs["orders"],
        "order_items":        dfs["order_items"],
        "shipments":          dfs["shipments"],
        "enriched_orders":    enriched_orders,
        "enriched_shipments": enriched_shipments,
        "order_summary":      order_summary,
    }

    for name, df in outputs.items():
        out_path = os.path.join(PROCESSED, name)
        print(f"Writing {name} → {out_path}")
        df.write.mode("overwrite").parquet(out_path)

    # ------------------------------------------------------------------
    # 6. IoT TELEMETRY (JSON → Parquet)
    # ------------------------------------------------------------------
    print("Processing IoT telemetry JSON...")
    telemetry = (
        spark.read.json(os.path.join(SEMI, "iot_telemetry.json"))
        .withColumn("timestamp", F.col("timestamp").cast(TimestampType()))
        .withColumn("speed_kmh", F.col("speed_kmh").cast(FloatType()))
        .withColumn("fuel_level_pct", F.col("fuel_level_pct").cast(FloatType()))
        .withColumn("engine_temperature_c", F.col("engine_temperature_c").cast(FloatType()))
    )
    telemetry.write.mode("overwrite").parquet(os.path.join(PROCESSED, "iot_telemetry"))
    print(f"  ✓ IoT telemetry: {telemetry.count()} events processed.")

    print("\n✅ Phase 4 complete — all data processed to Parquet.")
    spark.stop()


if __name__ == "__main__":
    main()
