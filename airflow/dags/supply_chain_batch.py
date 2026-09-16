"""
Airflow DAG for the daily supply chain batch pipeline.
Orchestrates: Ingest -> Bronze -> Silver -> dbt Gold -> dbt Tests -> SCD updates.
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator

PROJECT_ID = "supply-chain-logistics-508517"
BASE_PATH = "/opt/airflow/dags/supply_chain"

default_args = {
    "owner": "data-engineering",
    "depends_on_past": False,
    "email_on_failure": True,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "start_date": datetime(2024, 1, 1),
}

with DAG(
    dag_id="supply_chain_batch_pipeline",
    default_args=default_args,
    schedule_interval="@daily",
    catchup=False,
    tags=["supply-chain", "batch", "production"],
) as dag:

    # Ingest raw data from sources to GCS
    ingest = BashOperator(
        task_id="ingest_to_gcs",
        bash_command=f"python {BASE_PATH}/ingestion/batch/upload_to_gcs.py",
    )

    # Load GCS files into BigQuery Bronze layer
    load_bronze = BashOperator(
        task_id="load_to_bronze",
        bash_command=f"python {BASE_PATH}/ingestion/batch/load_to_bigquery.py",
    )

    # Build the Silver (cleaned + typed) layer
    build_silver = BigQueryInsertJobOperator(
        task_id="build_silver_layer",
        configuration={
            "query": {
                "query": open(f"{BASE_PATH}/sql/02_silver_ddl.sql").read(),
                "useLegacySql": False,
            }
        },
        project_id=PROJECT_ID,
    )

    # Run dbt models to build the Gold (analytics) layer
    run_dbt = BashOperator(
        task_id="run_dbt",
        bash_command=f"cd {BASE_PATH}/dbt && dbt run --profiles-dir .",
    )

    # Run dbt schema tests
    test_dbt = BashOperator(
        task_id="test_dbt",
        bash_command=f"cd {BASE_PATH}/dbt && dbt test --profiles-dir .",
    )

    # Apply SCD Type 2 dimension updates
    scd_update = BigQueryInsertJobOperator(
        task_id="scd_type2_update",
        configuration={
            "query": {
                "query": open(f"{BASE_PATH}/sql/04_scd_type2.sql").read(),
                "useLegacySql": False,
            }
        },
        project_id=PROJECT_ID,
    )

    ingest >> load_bronze >> build_silver >> run_dbt >> test_dbt >> scd_update
