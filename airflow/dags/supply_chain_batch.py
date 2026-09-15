"""
Airflow DAG — Orchestrates the full batch pipeline.
Runs daily: Ingest → PySpark → BigQuery Load → Silver → Gold → dbt.
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
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

    # Step 1: Ingest raw data to GCS
    ingest = BashOperator(
        task_id="ingest_to_gcs",
        bash_command=f"python {BASE_PATH}/ingestion/batch/upload_to_gcs.py",
    )

    # Step 2: Load GCS → BigQuery Bronze
    load_bronze = BashOperator(
        task_id="load_to_bronze",
        bash_command=f"python {BASE_PATH}/ingestion/batch/load_to_bigquery.py",
    )

    # Step 3: Build Silver layer
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

    # Step 4: Run dbt transformations (Silver → Gold)
    run_dbt = BashOperator(
        task_id="run_dbt",
        bash_command=f"cd {BASE_PATH}/dbt && dbt run --profiles-dir .",
    )

    # Step 5: Run dbt tests
    test_dbt = BashOperator(
        task_id="test_dbt",
        bash_command=f"cd {BASE_PATH}/dbt && dbt test --profiles-dir .",
    )

    # Step 6: SCD Type 2 updates
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

    # DAG Dependencies
    ingest >> load_bronze >> build_silver >> run_dbt >> test_dbt >> scd_update
