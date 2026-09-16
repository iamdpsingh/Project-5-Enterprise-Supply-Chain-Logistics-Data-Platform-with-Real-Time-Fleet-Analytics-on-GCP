"""
Data quality checks against BigQuery Silver tables.
Validates nulls, ranges, duplicates, and business rules,
then prints a pass/fail report.
"""
from google.cloud import bigquery
from dataclasses import dataclass
from typing import List

PROJECT_ID = "supply-chain-logistics-508517"


@dataclass
class QualityCheck:
    name: str
    query: str
    threshold: int = 0


CHECKS: List[QualityCheck] = [
    QualityCheck(
        name="orders_no_nulls",
        query=(
            f"SELECT COUNT(*) AS failures FROM `{PROJECT_ID}.silver.orders`"
            " WHERE order_id IS NULL"
        ),
    ),
    QualityCheck(
        name="shipments_no_nulls",
        query=(
            f"SELECT COUNT(*) AS failures FROM `{PROJECT_ID}.silver.shipments`"
            " WHERE shipment_id IS NULL"
        ),
    ),
    QualityCheck(
        name="telemetry_valid_speed",
        query=(
            f"SELECT COUNT(*) AS failures FROM `{PROJECT_ID}.silver.iot_telemetry`"
            " WHERE speed_kmh < 0"
        ),
    ),
    QualityCheck(
        name="telemetry_valid_fuel",
        query=(
            f"SELECT COUNT(*) AS failures FROM `{PROJECT_ID}.silver.iot_telemetry`"
            " WHERE fuel_level_pct NOT BETWEEN 0 AND 100"
        ),
    ),
    QualityCheck(
        name="telemetry_valid_coords",
        query=(
            f"SELECT COUNT(*) AS failures FROM `{PROJECT_ID}.silver.iot_telemetry`"
            " WHERE latitude NOT BETWEEN -90 AND 90"
            " OR longitude NOT BETWEEN -180 AND 180"
        ),
    ),
    QualityCheck(
        name="orders_no_duplicates",
        query=(
            "SELECT COUNT(*) AS failures FROM"
            f" (SELECT order_id FROM `{PROJECT_ID}.silver.orders`"
            " GROUP BY order_id HAVING COUNT(*) > 1)"
        ),
    ),
    QualityCheck(
        name="shipments_delivery_after_dispatch",
        query=(
            f"SELECT COUNT(*) AS failures FROM `{PROJECT_ID}.silver.shipments`"
            " WHERE actual_delivery_date < dispatch_date"
        ),
    ),
]


def run_checks():
    client = bigquery.Client(project=PROJECT_ID)
    passed = 0
    failed = 0

    separator = "=" * 60
    print(separator)
    print("Data Quality Report")
    print(separator + "\n")

    for check in CHECKS:
        result = client.query(check.query).result()
        failures = list(result)[0].failures

        if failures <= check.threshold:
            passed += 1
            status = "PASS"
        else:
            failed += 1
            status = "FAIL"

        print(f"  {status}  {check.name} (failures: {failures})")

    print(f"\n{separator}")
    print(f"Results: {passed} passed, {failed} failed out of {len(CHECKS)} checks.")
    print(separator)


if __name__ == "__main__":
    run_checks()
