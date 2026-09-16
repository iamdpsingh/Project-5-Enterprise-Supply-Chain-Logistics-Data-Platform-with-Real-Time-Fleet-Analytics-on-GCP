# Enterprise Supply Chain & Logistics Data Platform

**Real-Time Fleet Analytics on Google Cloud Platform**

An end-to-end enterprise data platform for a global logistics company that ingests, processes, and serves structured, semi-structured, and unstructured data through batch and real-time pipelines — powering a Supply Chain Control Tower with predictive analytics.

---

## Architecture Overview

```text
DATA SOURCES ──── CLOUD STORAGE (Data Lake) ──── PySpark / Dataflow ──── BIGQUERY
    │                                                                    (Bronze → Silver → Gold)
    │                                                                         │
    ├── Structured (CSV)                                                    dbt + BigQuery ML
    ├── Semi-Structured (JSON / XML)                                          │
    ├── Unstructured (Text Reports)                                     CUSTOM WEB APP
    │                                                                (Supply Chain Control Tower)
    │
    └── Fleet Simulator (Docker) ── Pub/Sub ── Dataflow (Streaming) ──── BigQuery + Firestore
```

> For the detailed architecture diagram and layer breakdown, see [architecture/04_architecture_design.md](architecture/04_architecture_design.md).

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Data Lake** | Cloud Storage | Raw / Processed / Rejected zones |
| **Batch Processing** | PySpark | Large-scale joins, dedup, aggregations |
| **Stream Processing** | Pub/Sub + Dataflow | Real-time IoT event processing |
| **Data Warehouse** | BigQuery | Medallion architecture (Bronze → Silver → Gold) |
| **Transformation** | dbt | SQL-based Silver → Gold with testing |
| **Orchestration** | Airflow / Cloud Composer | Daily batch pipeline scheduling |
| **Operational DB** | Firestore | Low-latency fleet state lookups |
| **ML** | BigQuery ML | Shipment delay prediction |
| **Dashboard** | Custom Web App | Full-stack Supply Chain Control Tower |
| **IaC** | Terraform | Reproducible GCP infrastructure |
| **CI/CD** | GitHub Actions | Lint → Test → Build → Deploy |
| **Containers** | Docker + Cloud Run | Fleet Simulator deployment |

> For the rationale behind each choice, see [docs/05_technology_decisions.md](docs/05_technology_decisions.md).

---

## Documentation

| Document | Description |
|---|---|
| [Business Scenario](docs/01_business_scenario.md) | Problem statement, objectives, and business domains |
| [Requirements](docs/02_requirements.md) | Functional and non-functional requirements |
| [KPIs](docs/03_kpis.md) | Key performance indicators tracked by the platform |
| [Architecture Design](architecture/04_architecture_design.md) | Full architecture diagram and layer descriptions |
| [Technology Decisions](docs/05_technology_decisions.md) | Rationale for every technology choice |

---

## Project Structure

```
├── architecture/          # Architecture documentation and diagrams
├── data/                  # Data generation scripts and schemas
│   └── data_generation.py # Generates ~2.8M synthetic records
├── ingestion/             # Batch ingestion (GCS upload, BigQuery load)
├── pyspark/               # PySpark transformations and quality helpers
├── dataflow/              # Apache Beam streaming pipeline
├── sql/                   # BigQuery DDL (Bronze, Silver, Gold, SCD)
├── dbt/                   # dbt models, schema tests, and profiles
├── airflow/               # Airflow DAGs for batch orchestration
├── fleet_simulator/       # IoT telemetry simulator + Dockerfile
├── ml/                    # BigQuery ML model definitions
├── quality/               # Data quality validation framework
├── terraform/             # Infrastructure as Code (GCP resources)
├── tests/                 # Automated test suite (pytest)
├── docs/                  # Business requirements and decision docs
└── .github/workflows/     # CI/CD pipeline configuration
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Google Cloud SDK (`gcloud`) authenticated
- Java 17 (for PySpark — `brew install --cask temurin@17`)

### Setup and Run

```bash
# Clone the repository
git clone https://github.com/iamdpsingh/Project-5-Enterprise-Supply-Chain-Logistics-Data-Platform-with-Real-Time-Fleet-Analytics-on-GCP.git
cd Project-5-Enterprise-Supply-Chain-Logistics-Data-Platform-with-Real-Time-Fleet-Analytics-on-GCP

# Create virtual environment
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Generate synthetic data (~2.8M records)
python data/data_generation.py

# Upload to GCS Data Lake
python ingestion/batch/upload_to_gcs.py

# Load into BigQuery Bronze layer
python ingestion/batch/load_to_bigquery.py

# Build Silver, Gold, and SCD layers
python sql/run_layers.py

# Run data quality checks
python quality/quality_checks.py

# Run test suite
pytest tests/ -v
```

---

## Data Scale

| Dataset | Volume |
|---|---|
| Orders | 500,000 |
| Order Items | 750,000 |
| Shipments | 500,000 |
| IoT Telemetry Events | 1,000,000 |
| Customers | 50,000 |
| Products | 10,000 |
| Vehicles | 2,000 |
| **Total** | **~2.8M records** |

---

## Key Capabilities

- **Medallion Architecture** — Bronze (raw) → Silver (clean, typed, partitioned) → Gold (star schema)
- **Dimensional Modeling** — 7 dimension tables + 3 fact tables with SCD Type 2 history tracking
- **Real-Time Streaming** — Fleet IoT telemetry via Pub/Sub → Dataflow → BigQuery
- **Predictive Analytics** — Shipment delay prediction using BigQuery ML (logistic regression)
- **Data Quality** — Automated validation (nulls, ranges, duplicates, business rules) with quarantine
- **Infrastructure as Code** — Complete GCP resource provisioning via Terraform
- **CI/CD** — Automated lint, test, Docker build, and deploy via GitHub Actions

---

## License

This project is for educational and portfolio purposes.
