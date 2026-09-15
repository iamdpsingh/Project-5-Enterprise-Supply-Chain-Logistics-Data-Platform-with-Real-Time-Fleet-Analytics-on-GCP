# Enterprise Supply Chain & Logistics Data Platform

## Real-Time Fleet Analytics on GCP

An end-to-end enterprise data platform for a global logistics company that processes structured, semi-structured, and unstructured data in batch and real-time.

---

## Architecture

```text
DATA SOURCES → CLOUD STORAGE (Data Lake) → PySpark / Dataflow → BIGQUERY (Bronze → Silver → Gold) → dbt → CUSTOM WEB APP
                                                                                                        ↓
FLEET SIMULATOR → PUB/SUB → DATAFLOW (Streaming) → BIGQUERY + FIRESTORE (Operational) → DASHBOARD
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Data Lake** | Cloud Storage |
| **Batch Processing** | PySpark |
| **Stream Processing** | Pub/Sub + Dataflow (Apache Beam) |
| **Data Warehouse** | BigQuery (Bronze → Silver → Gold) |
| **Transformation** | dbt |
| **Orchestration** | Airflow / Cloud Composer |
| **Operational DB** | Firestore |
| **ML** | BigQuery ML |
| **Dashboard** | Custom Web App (React + Node.js) |
| **IaC** | Terraform |
| **CI/CD** | GitHub Actions |
| **Containerization** | Docker + Cloud Run |

## Project Structure

```
├── architecture/       # Architecture documentation
├── data/               # Synthetic data generation
├── ingestion/          # Batch & streaming ingestion scripts
├── pyspark/            # PySpark transformations
├── dataflow/           # Apache Beam streaming pipelines
├── sql/                # BigQuery DDL (Bronze, Silver, Gold, SCD)
├── dbt/                # dbt models, tests, and macros
├── airflow/            # Airflow DAGs
├── fleet_simulator/    # IoT telemetry simulator + Dockerfile
├── ml/                 # BigQuery ML models
├── quality/            # Data quality framework
├── terraform/          # Infrastructure as Code
├── tests/              # pytest test suite
├── dashboards/         # Custom web dashboard (React + Node.js)
├── docs/               # Business docs, KPIs, requirements
└── .github/workflows/  # CI/CD pipeline
```

## Quick Start

```bash
# 1. Setup
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Generate data
python data/data_generation.py

# 3. Upload to GCS
python ingestion/batch/upload_to_gcs.py

# 4. Load to BigQuery Bronze
python ingestion/batch/load_to_bigquery.py

# 5. Build Silver + Gold layers
python sql/run_layers.py

# 6. Run quality checks
python quality/quality_checks.py

# 7. Run tests
pytest tests/ -v
```

## Data Scale

- **500K orders** + **750K order items** + **500K shipments**
- **1M IoT telemetry events** (fleet GPS, speed, fuel, engine)
- **50K customers**, **10K products**, **2K vehicles**
- **Total: ~2.8M records**

## Key Features

- **Medallion Architecture**: Bronze → Silver → Gold in BigQuery
- **Star Schema**: Fact & Dimension tables with SCD Type 2
- **Real-Time Streaming**: Pub/Sub → Dataflow → BigQuery
- **ML Predictions**: Shipment delay prediction via BigQuery ML
- **Data Quality**: Automated checks (nulls, ranges, duplicates, business rules)
- **Custom Dashboard**: Full-stack Supply Chain Control Tower
- **Infrastructure as Code**: Terraform for all GCP resources
- **CI/CD**: GitHub Actions with lint, test, Docker build, deploy
