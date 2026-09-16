"""
Loads data from GCS into BigQuery's Bronze (raw) layer.
Supports both CSV and NDJSON source formats with schema autodetection.
"""
import sys
import os
from google.cloud import bigquery

# Add project root to sys.path so we can import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from utils.logger import get_logger

logger = get_logger("load_to_bigquery")

PROJECT_ID = "supply-chain-logistics-508517"
BUCKET = f"enterprise-logistics-data-lake-{PROJECT_ID}"
BRONZE_DATASET = "bronze"

# GCS paths for each source table
TABLES = {
    "customers": "raw/structured/customers.csv",
    "products": "raw/structured/products.csv",
    "suppliers": "raw/structured/suppliers.csv",
    "warehouses": "raw/structured/warehouses.csv",
    "vehicles": "raw/structured/vehicles.csv",
    "drivers": "raw/structured/drivers.csv",
    "orders": "raw/structured/orders.csv",
    "order_items": "raw/structured/order_items.csv",
    "shipments": "raw/structured/shipments.csv",
    "iot_telemetry": "raw/semi_structured/iot_telemetry.json",
}


def load_table(client: bigquery.Client, table_name: str, gcs_path: str):
    """Load a single GCS file into BigQuery Bronze layer."""
    table_id = f"{PROJECT_ID}.{BRONZE_DATASET}.{table_name}"
    uri = f"gs://{BUCKET}/{gcs_path}"

    if gcs_path.endswith(".json"):
        source_format = bigquery.SourceFormat.NEWLINE_DELIMITED_JSON
    else:
        source_format = bigquery.SourceFormat.CSV

    job_config = bigquery.LoadJobConfig(
        source_format=source_format,
        autodetect=True,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )
    if source_format == bigquery.SourceFormat.CSV:
        job_config.skip_leading_rows = 1

    logger.info(f"Loading {uri} -> {table_id}...")
    load_job = client.load_table_from_uri(uri, table_id, job_config=job_config)
    load_job.result()

    table = client.get_table(table_id)
    logger.info(f"  OK  {table_name}: {table.num_rows} rows loaded.")


def main():
    client = bigquery.Client(project=PROJECT_ID)

    dataset_ref = bigquery.Dataset(f"{PROJECT_ID}.{BRONZE_DATASET}")
    dataset_ref.location = "US"
    client.create_dataset(dataset_ref, exists_ok=True)
    logger.info(f"Dataset {BRONZE_DATASET} ready.\n")

    for table_name, gcs_path in TABLES.items():
        load_table(client, table_name, gcs_path)

    logger.info("\nAll Bronze tables loaded into BigQuery.")


if __name__ == "__main__":
    main()
