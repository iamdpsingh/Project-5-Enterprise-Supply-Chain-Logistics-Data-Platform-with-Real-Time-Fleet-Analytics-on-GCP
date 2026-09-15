"""
Data Quality helpers for PySpark pipelines.
Separates valid/invalid rows and writes rejects to quarantine.
"""
from pyspark.sql import DataFrame
from pyspark.sql import functions as F
from typing import Dict, List, Tuple, Optional


def check_nulls(df: DataFrame, columns: List[str]) -> DataFrame:
    """Flag rows where any of the specified columns are null."""
    condition = F.lit(False)
    for col in columns:
        condition = condition | F.col(col).isNull()
    return df.withColumn("_has_nulls", condition)


def check_range(df: DataFrame, column: str, low: float, high: float) -> DataFrame:
    """Flag rows where a column value is outside [low, high]."""
    return df.withColumn(
        f"_out_of_range_{column}",
        ~F.col(column).between(low, high)
    )


def check_duplicates(df: DataFrame, key_columns: List[str]) -> DataFrame:
    """Flag duplicate rows based on key columns."""
    from pyspark.sql.window import Window
    w = Window.partitionBy(*key_columns).orderBy(F.lit(1))
    return df.withColumn("_is_duplicate", F.row_number().over(w) > 1)


def split_valid_invalid(
    df: DataFrame,
    flag_columns: List[str]
) -> Tuple[DataFrame, DataFrame]:
    """Split a DataFrame into valid and invalid based on boolean flag columns."""
    invalid_condition = F.lit(False)
    for col in flag_columns:
        invalid_condition = invalid_condition | F.col(col)

    valid = df.filter(~invalid_condition).drop(*flag_columns)
    invalid = df.filter(invalid_condition)
    return valid, invalid
