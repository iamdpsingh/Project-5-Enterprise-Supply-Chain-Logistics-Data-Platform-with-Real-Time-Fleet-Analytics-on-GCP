# Technology Decisions

This document outlines the rationale behind the chosen technology stack for the Enterprise Supply Chain & Logistics Data Platform.

## 1. Storage & Databases
- **Cloud Storage**: Chosen as the foundational Data Lake for its durability, low cost, and ability to handle unstructured data (PDFs/Images).
- **BigQuery**: Chosen as the core Data Warehouse due to its serverless architecture, petabyte-scale performance, and built-in ML capabilities.
- **Firestore**: Chosen for the operational state database because BigQuery is not optimized for high-frequency point updates or low-latency operational lookups (like current vehicle location).

## 2. Processing & Transformation
- **PySpark**: Selected for complex, large-scale batch processing. Spark excels at heavy joins and aggregations across disparate historical datasets.
- **Dataflow (Apache Beam)**: Chosen as the unified framework for streaming (and optionally batch). It handles late-arriving data, windowing, and watermarks out-of-the-box natively on GCP.
- **dbt**: Selected for in-warehouse transformations (Silver to Gold). It introduces software engineering best practices (version control, testing, modularity) to SQL.

## 3. Orchestration
- **Cloud Composer (Airflow)**: Industry standard for data orchestration. It provides dependency management, retries, and extensive operators for GCP services.

## 4. Streaming Infrastructure
- **Pub/Sub**: Native GCP messaging queue chosen for its serverless scalability and guaranteed at-least-once delivery.
- **Cloud Run & Docker**: Used to host the Fleet Simulator. Containerization ensures environmental consistency and Cloud Run allows it to run serverlessly.

## 5. Serving & ML Layer
- **Custom Web App**: Instead of using off-the-shelf BI tools like Looker Studio or Streamlit, the platform utilizes a custom-built full-stack application (e.g., React for frontend, Node.js/Python for backend API) to provide maximum flexibility, DevOps integration, and a premium user experience for the Supply Chain Control Tower.
- **BigQuery ML**: Selected for shipment delay prediction to bring the compute to the data, avoiding the need to extract large datasets into a separate ML environment.

## 6. Infrastructure as Code & CI/CD
- **Terraform**: Declarative IaC tool used to ensure infrastructure is reproducible and version-controlled.
- **GitHub Actions**: Chosen for CI/CD due to native integration with the repository.

## 7. Data Quality & Governance
- **Data Quality Framework**: Custom checks implemented in PySpark and dbt tests to enforce schema, nulls, and business rules.
- **Dataplex (Optional/Future)**: For automated metadata harvesting and data classification.
- **Secret Manager & IAM**: Standard GCP security practices to enforce least privilege and avoid hardcoded credentials.
