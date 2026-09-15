"""
PySpark Configuration Utility.
Provides a reusable SparkSession builder for the project.
"""
from pyspark.sql import SparkSession


def get_spark(app_name: str = "SupplyChainPlatform") -> SparkSession:
    """Create or get a SparkSession with standard project config."""
    return (
        SparkSession.builder
        .appName(app_name)
        .config("spark.sql.parquet.compression.codec", "snappy")
        .config("spark.sql.shuffle.partitions", "8")
        .config("spark.driver.memory", "4g")
        .getOrCreate()
    )
