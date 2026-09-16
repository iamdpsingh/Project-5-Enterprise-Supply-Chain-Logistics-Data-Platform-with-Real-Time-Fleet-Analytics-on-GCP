terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "local" {}
}

variable "project_id" {
  default = "supply-chain-logistics-508517"
}

variable "region" {
  default = "us-central1"
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ==================== STORAGE ====================

resource "google_storage_bucket" "data_lake" {
  name                        = "enterprise-logistics-data-lake-${var.project_id}"
  location                    = "US"
  force_destroy               = true
  uniform_bucket_level_access = true

  lifecycle_rule {
    condition { age = 365 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
}

# ==================== BIGQUERY ====================

resource "google_bigquery_dataset" "bronze" {
  dataset_id = "bronze"
  location   = "US"
}

resource "google_bigquery_dataset" "silver" {
  dataset_id = "silver"
  location   = "US"
}

resource "google_bigquery_dataset" "gold" {
  dataset_id = "gold"
  location   = "US"
}

# ==================== PUB/SUB ====================

resource "google_pubsub_topic" "fleet_telemetry" {
  name = "fleet-telemetry"
}

resource "google_pubsub_subscription" "fleet_telemetry_sub" {
  name  = "fleet-telemetry-sub"
  topic = google_pubsub_topic.fleet_telemetry.id

  ack_deadline_seconds       = 20
  message_retention_duration = "604800s"
}

# ==================== SERVICE ACCOUNTS ====================

resource "google_service_account" "dataflow_sa" {
  account_id   = "dataflow-worker"
  display_name = "Dataflow Worker"
}

resource "google_service_account" "cloud_run_sa" {
  account_id   = "fleet-simulator"
  display_name = "Fleet Simulator"
}

resource "google_service_account" "composer_sa" {
  account_id   = "composer-worker"
  display_name = "Composer Worker"
}

# ==================== IAM ====================

resource "google_project_iam_member" "dataflow_bq" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.dataflow_sa.email}"
}

resource "google_project_iam_member" "dataflow_storage" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.dataflow_sa.email}"
}

resource "google_project_iam_member" "cloud_run_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "composer_bq" {
  project = var.project_id
  role    = "roles/bigquery.admin"
  member  = "serviceAccount:${google_service_account.composer_sa.email}"
}

# ==================== CLOUD RUN ====================

resource "google_cloud_run_v2_service" "fleet_simulator" {
  name     = "fleet-simulator"
  location = var.region

  template {
    service_account = google_service_account.cloud_run_sa.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/fleet-simulator/simulator:latest"

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "TOPIC_ID"
        value = google_pubsub_topic.fleet_telemetry.name
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }
}

# ==================== OUTPUTS ====================

output "bucket_name" {
  value = google_storage_bucket.data_lake.name
}

output "pubsub_topic" {
  value = google_pubsub_topic.fleet_telemetry.id
}

output "dataflow_sa_email" {
  value = google_service_account.dataflow_sa.email
}
