"""
BigQuery Layer Builder — Executes SQL scripts sequentially to build
Silver and Gold layers from Bronze data.
"""
import os
from google.cloud import bigquery

PROJECT_ID = "supply-chain-logistics-508517"


def execute_sql_file(client: bigquery.Client, filepath: str):
    """Read and execute a SQL file, splitting on semicolons for multi-statement files."""
    with open(filepath, 'r') as f:
        sql_content = f.read()

    # Split into individual statements
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]

    filename = os.path.basename(filepath)
    print(f"\n{'='*60}")
    print(f"Executing: {filename} ({len(statements)} statements)")
    print(f"{'='*60}")

    for i, stmt in enumerate(statements, 1):
        # Skip comments-only blocks
        lines = [l for l in stmt.split('\n') if l.strip() and not l.strip().startswith('--')]
        if not lines:
            continue

        print(f"  [{i}/{len(statements)}] Running...")
        query_job = client.query(stmt)
        query_job.result()  # Wait for completion
        print(f"  [{i}/{len(statements)}] ✓ Done ({query_job.total_bytes_processed or 0} bytes processed)")


def main():
    client = bigquery.Client(project=PROJECT_ID)
    sql_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'sql')

    # Execute in order: Silver → Gold → SCD
    sql_files = [
        '02_silver_ddl.sql',
        '03_gold_ddl.sql',
        '04_scd_type2.sql',
    ]

    for sql_file in sql_files:
        filepath = os.path.join(sql_dir, sql_file)
        if os.path.exists(filepath):
            execute_sql_file(client, filepath)
        else:
            print(f"⚠ Skipping {sql_file} — file not found.")

    print("\n✅ All BigQuery layers built successfully.")


if __name__ == "__main__":
    main()
