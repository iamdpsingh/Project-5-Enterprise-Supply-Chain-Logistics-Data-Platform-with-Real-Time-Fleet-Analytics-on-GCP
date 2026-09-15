# Architecture Design

The platform follows a modern lambda/kappa hybrid architecture on GCP, handling both batch and real-time streaming data, with a medallion data lakehouse pattern.

## Diagram

```text
                         ENTERPRISE DATA SOURCES
                                  │
          ┌───────────────────────┼────────────────────────┐
          │                       │                        │
          ▼                       ▼                        ▼
    STRUCTURED               SEMI-STRUCTURED          UNSTRUCTURED
 (PostgreSQL, CSV)         (JSON, XML, IoT APIs)      (PDF, Images, Text)
          │                       │                        │
          └───────────────────────┼────────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │  CLOUD STORAGE  │
                         │   DATA LAKE     │
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                 BATCH                      STREAMING
                    │                           │
                    ▼                           ▼
                PySpark                     Pub/Sub
                    │                           │
                    ▼                           ▼
                Dataflow                    Dataflow
                    │                           │
                    └─────────────┬─────────────┘
                                  ▼
                         ┌────────────────┐
                         │    BIGQUERY    │
                         │                │
                         │ Bronze (Raw)   │
                         │ Silver (Clean) │
                         │ Gold (Model)   │
                         └───────┬────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
                  ▼              ▼              ▼
                dbt          BigQuery ML    Analytics
                  │              │              │
                  └──────────────┼──────────────┘
                                 ▼
                         CUSTOM WEB APP
                      (React / Node.js API)
                                 │
                                 ▼
                    SUPPLY CHAIN CONTROL TOWER
```

## Layers

### 1. Ingestion Layer
- **Batch**: Structured and semi-structured data is loaded into Cloud Storage (Raw Zone).
- **Streaming**: A Python-based Fleet Simulator (running in Docker on Cloud Run) streams IoT telemetry directly to Pub/Sub.

### 2. Processing Layer
- **PySpark**: Processes large historical batches, performs complex joins, and writes Parquet data.
- **Dataflow (Apache Beam)**: 
  - Subscribes to Pub/Sub for real-time windowing and event-time processing.
  - Updates operational state in **Firestore** (e.g., active vehicle status).
  - Writes analytical events to BigQuery.

### 3. Storage Layer
- **Cloud Storage**: Acts as the Data Lake (raw, processed, rejected zones).
- **Firestore**: Operational NoSQL database for low-latency current state and alerts.
- **BigQuery**: Enterprise Data Warehouse utilizing a medallion structure:
  - **Bronze**: Raw data ingested with minimal schema enforcement.
  - **Silver**: Cleansed, deduplicated, and typed data.
  - **Gold**: Dimensional model (Fact/Dim tables) with SCD Type 2 history.

### 4. Transformation Layer
- **dbt**: Manages SQL-based transformations from Silver to Gold, including data testing and lineage.

### 5. Serving & ML Layer
- **Custom Web App**: A custom-built frontend (React/Next.js) and backend API (Node.js/Python) to serve the Supply Chain Control Tower dashboards.
- **BigQuery ML**: Trains a classification model to predict shipment delays based on feature tables.

### 6. Orchestration & DevOps
- **Airflow (Cloud Composer)**: Orchestrates the batch pipelines, invoking Spark, Dataflow, and dbt.
- **Terraform**: Manages infrastructure.
- **GitHub Actions**: CI/CD for deployments.
