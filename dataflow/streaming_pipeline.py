"""
Dataflow Streaming Pipeline — Reads from Pub/Sub, processes fleet telemetry,
and writes to BigQuery in real-time using Apache Beam.
"""
import argparse
import json
import logging
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions, StandardOptions
from apache_beam.io.gcp.bigquery import WriteToBigQuery


# BigQuery schema for telemetry
BQ_SCHEMA = {
    "fields": [
        {"name": "event_id", "type": "STRING"},
        {"name": "vehicle_id", "type": "STRING"},
        {"name": "timestamp", "type": "TIMESTAMP"},
        {"name": "latitude", "type": "FLOAT"},
        {"name": "longitude", "type": "FLOAT"},
        {"name": "speed_kmh", "type": "FLOAT"},
        {"name": "fuel_level_pct", "type": "FLOAT"},
        {"name": "engine_temperature_c", "type": "FLOAT"},
        {"name": "is_speeding", "type": "BOOLEAN"},
        {"name": "engine_overheating", "type": "BOOLEAN"},
    ]
}


class ParseAndEnrich(beam.DoFn):
    """Parse JSON and add quality flags."""
    def process(self, element):
        record = json.loads(element.decode("utf-8"))
        record["is_speeding"] = record.get("speed_kmh", 0) > 120
        record["engine_overheating"] = record.get("engine_temperature_c", 0) > 105
        yield record


class FilterInvalid(beam.DoFn):
    """Filter out records failing basic quality checks."""
    def process(self, record):
        lat = record.get("latitude", 0)
        lon = record.get("longitude", 0)
        speed = record.get("speed_kmh", -1)
        fuel = record.get("fuel_level_pct", -1)

        if (-90 <= lat <= 90 and -180 <= lon <= 180
                and speed >= 0 and 0 <= fuel <= 100):
            yield beam.pvalue.TaggedOutput("valid", record)
        else:
            yield beam.pvalue.TaggedOutput("invalid", record)


def run(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_subscription", required=True)
    parser.add_argument("--output_table", required=True)
    parser.add_argument("--rejected_table", default=None)
    known_args, pipeline_args = parser.parse_known_args(argv)

    options = PipelineOptions(pipeline_args)
    options.view_as(StandardOptions).streaming = True

    with beam.Pipeline(options=options) as p:
        # Read from Pub/Sub
        messages = (
            p
            | "ReadPubSub" >> beam.io.ReadFromPubSub(
                subscription=known_args.input_subscription
            )
            | "ParseJSON" >> beam.ParDo(ParseAndEnrich())
        )

        # Split valid / invalid
        tagged = (
            messages
            | "ValidateRecords" >> beam.ParDo(FilterInvalid()).with_outputs("valid", "invalid")
        )

        # Write valid records to BigQuery
        (
            tagged.valid
            | "WriteToBQ" >> WriteToBigQuery(
                known_args.output_table,
                schema=BQ_SCHEMA,
                write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
            )
        )

        # Optionally write invalid records
        if known_args.rejected_table:
            (
                tagged.invalid
                | "WriteRejected" >> WriteToBigQuery(
                    known_args.rejected_table,
                    schema=BQ_SCHEMA,
                    write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                    create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
                )
            )


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.INFO)
    run()
