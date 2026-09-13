import os
from google.cloud import storage
from google.api_core.exceptions import Conflict

PROJECT_ID = "supply-chain-logistics-508517"
BUCKET_NAME = f"enterprise-logistics-data-lake-{PROJECT_ID}"
LOCATION = "US"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'data')

def create_bucket_if_not_exists(storage_client):
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        if not bucket.exists():
            print(f"Creating bucket {BUCKET_NAME}...")
            # Create bucket
            bucket = storage_client.create_bucket(bucket, location=LOCATION)
            print(f"Bucket {bucket.name} created.")
        else:
            print(f"Bucket {BUCKET_NAME} already exists.")
        return bucket
    except Conflict:
        print(f"Bucket {BUCKET_NAME} already exists.")
        return storage_client.bucket(BUCKET_NAME)

def create_folders(bucket):
    # In GCS, folders are just prefixes. We can create empty blobs ending with '/' to represent folders.
    folders = [
        'raw/structured/',
        'raw/semi_structured/',
        'raw/unstructured/maintenance_reports/',
        'processed/',
        'rejected/',
        'archive/'
    ]
    for folder in folders:
        blob = bucket.blob(folder)
        if not blob.exists():
            blob.upload_from_string('')
            print(f"Created folder prefix: {folder}")

def upload_local_directory_to_gcs(bucket, local_path, gcs_prefix):
    for root, dirs, files in os.walk(local_path):
        for file in files:
            # Skip hidden files or schemas dir for now (schemas will be used in BQ)
            if file.startswith('.') or 'schemas' in root:
                continue
                
            local_file_path = os.path.join(root, file)
            # Calculate relative path from data/
            rel_path = os.path.relpath(local_file_path, DATA_DIR)
            gcs_blob_path = f"{gcs_prefix}{rel_path}"
            
            blob = bucket.blob(gcs_blob_path)
            if not blob.exists():
                print(f"Uploading {local_file_path} to gs://{BUCKET_NAME}/{gcs_blob_path}...")
                blob.upload_from_filename(local_file_path)
            else:
                print(f"Skipping {gcs_blob_path}, already exists.")

if __name__ == "__main__":
    print(f"Connecting to GCP Project: {PROJECT_ID}")
    try:
        client = storage.Client(project=PROJECT_ID)
    except Exception as e:
        print(f"Failed to initialize GCP Client. Ensure you are logged in via 'gcloud auth application-default login'. Error: {e}")
        exit(1)

    bucket = create_bucket_if_not_exists(client)
    
    print("Setting up Data Lake Zones...")
    create_folders(bucket)
    
    print("Uploading synthetic data to the raw/ zone...")
    upload_local_directory_to_gcs(bucket, DATA_DIR, 'raw/')
    
    print("Data Lake setup and upload complete!")
