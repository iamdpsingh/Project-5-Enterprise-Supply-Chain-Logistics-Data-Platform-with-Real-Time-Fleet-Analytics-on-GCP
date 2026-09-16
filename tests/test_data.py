"""
Test suite for the supply chain data platform.
Tests cover data generation outputs, schema validation,
and fleet simulator logic.
"""
import os
import json
import pytest
import pandas as pd

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, "data", "structured")
SEMI = os.path.join(BASE, "data", "semi_structured")

# Skip data file tests when files are not present (e.g. in CI)
DATA_FILES_EXIST = os.path.exists(os.path.join(DATA, "orders.csv"))
skip_if_no_data = pytest.mark.skipif(
    not DATA_FILES_EXIST,
    reason="Data files not present (run data_generation.py first)"
)


@skip_if_no_data
class TestStructuredData:
    """Validate generated CSV files meet expected schemas and volumes."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.files = {
            "customers": pd.read_csv(os.path.join(DATA, "customers.csv")),
            "orders": pd.read_csv(os.path.join(DATA, "orders.csv")),
            "shipments": pd.read_csv(os.path.join(DATA, "shipments.csv")),
        }

    def test_customers_not_empty(self):
        assert len(self.files["customers"]) > 0

    def test_orders_row_count(self):
        assert len(self.files["orders"]) >= 500000

    def test_orders_no_null_ids(self):
        assert self.files["orders"]["order_id"].notna().all()

    def test_orders_valid_status(self):
        valid = {"Delivered", "Processing", "Shipped", "Cancelled"}
        assert set(self.files["orders"]["status"].unique()).issubset(valid)

    def test_shipments_row_count(self):
        assert len(self.files["shipments"]) >= 500000

    def test_customer_id_format(self):
        assert self.files["customers"]["customer_id"].str.startswith("CUST_").all()


@skip_if_no_data
class TestSemiStructuredData:
    """Validate generated JSON and XML files."""

    def test_telemetry_file_exists(self):
        assert os.path.exists(os.path.join(SEMI, "iot_telemetry.json"))

    def test_telemetry_valid_json(self):
        with open(os.path.join(SEMI, "iot_telemetry.json")) as f:
            first_line = f.readline()
            record = json.loads(first_line)
            required_keys = {
                "event_id", "vehicle_id", "timestamp",
                "latitude", "longitude", "speed_kmh"
            }
            assert required_keys.issubset(record.keys())

    def test_xml_file_exists(self):
        assert os.path.exists(os.path.join(SEMI, "supplier_invoices.xml"))


class TestFleetSimulator:
    """Validate the fleet simulator generates valid telemetry events."""

    def test_simulator_importable(self):
        import sys
        sys.path.insert(0, os.path.join(BASE, "fleet_simulator"))
        from simulator import generate_vehicle_state
        event = generate_vehicle_state(1, 0)
        assert "vehicle_id" in event
        assert "speed_kmh" in event

    def test_event_structure(self):
        import sys
        sys.path.insert(0, os.path.join(BASE, "fleet_simulator"))
        from simulator import generate_vehicle_state
        event = generate_vehicle_state(42, 100)
        assert event["vehicle_id"] == "VEH_000042"
        assert isinstance(event["speed_kmh"], float)
        assert isinstance(event["fuel_level_pct"], float)
