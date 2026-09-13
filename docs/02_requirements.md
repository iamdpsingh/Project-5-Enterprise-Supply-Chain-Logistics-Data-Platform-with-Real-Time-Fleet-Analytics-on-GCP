# Requirements

## Functional Requirements

### 1. Data Ingestion
- Ingest **structured** data (PostgreSQL, CSV) via batch processing.
- Ingest **semi-structured** data (JSON, XML, API events) via both batch and streaming.
- Ingest **unstructured** data (PDFs, Images, Text) via Cloud Storage and metadata extraction.
- Support real-time ingestion of IoT telemetry from fleet vehicles.

### 2. Data Processing & Transformation
- Use PySpark for large-scale batch transformations, deduplication, and aggregations.
- Use Apache Beam/Dataflow for streaming event-time processing and windowing.
- Implement incremental processing (watermarks, MERGE) to avoid full dataset re-computation.
- Implement SCD Type 2 for tracking historical changes in dimensions (e.g., customer, vehicle).

### 3. Data Warehousing & Modeling
- Implement a medallion architecture in BigQuery (Bronze, Silver, Gold).
- Use dbt for SQL-based transformations, testing, and documentation between Silver and Gold layers.
- Implement a dimensional model (Fact and Dimension tables) in the Gold layer.

### 4. Real-Time Operational State
- Maintain the current state of the fleet and active deliveries in Firestore for low-latency operational access.
- Generate real-time alerts for speed violations, health anomalies, route deviations, and ETA breaches.

### 5. Advanced Analytics & ML
- Calculate real-time metrics for fleet utilization, fuel efficiency, and logistics performance.
- Implement a predictive model using BigQuery ML to forecast shipment delays based on historical data, weather, and traffic.

## Non-Functional Requirements

### 1. Data Quality & Governance
- Implement data quality checks (nulls, duplicates, schemas, business rules) during ingestion and processing.
- Isolate bad records into quarantine tables.
- Track data lineage and manage metadata using Dataplex and dbt.

### 2. Orchestration & Automation
- Orchestrate end-to-end pipelines using Airflow / Cloud Composer.
- Manage infrastructure using Terraform (IaC).
- Automate CI/CD pipelines using GitHub Actions for code linting, tests, Docker builds, and deployment.

### 3. Security & Access
- Apply Principle of Least Privilege using GCP IAM service accounts.
- Store credentials securely in Secret Manager.

### 4. Performance & Scalability
- Optimize BigQuery query performance using partitioning and clustering.
- Ensure the streaming pipeline scales dynamically to handle varying telemetry volumes using Dataflow.
- Containerize components (like the fleet simulator) using Docker and Cloud Run for scalability.
