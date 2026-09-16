"""
Synthetic data generator for the supply chain platform.
Produces ~20 lakh (2M) records across structured (CSV), semi-structured (JSON/XML),
and unstructured (text) formats to simulate realistic GLOBAL production data
covering customers, suppliers, warehouses, and IoT telemetry across 6 continents.
"""
import os
import json
import uuid
import random
import sys
from datetime import datetime

import numpy as np
import pandas as pd
from faker import Faker

# Add project root to sys.path so we can import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.logger import get_logger

logger = get_logger("data_generation")

fake = Faker()

# ── Volume configuration (20 Lakh / 2 Million scale) ──────────────
NUM_CUSTOMERS  = 80000   # Global enterprise + consumer base
NUM_PRODUCTS   = 15000   # Expanded SKU catalogue
NUM_SUPPLIERS  = 800     # Global supplier network
NUM_WAREHOUSES = 200     # Distribution centres across 6 continents
NUM_VEHICLES   = 4000    # Global fleet (doubled)
NUM_DRIVERS    = 5000    # Global driver pool (doubled)
NUM_ORDERS     = 1000000 # 10 Lakh orders
NUM_SHIPMENTS  = 1000000 # 10 Lakh shipments
NUM_TELEMETRY  = 2000000 # 20 Lakh telemetry events (streaming)

# Output directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
output_dir = os.path.join(BASE_DIR, 'data')
STRUCTURED_DIR = os.path.join(output_dir, 'structured')
SEMI_STRUCTURED_DIR = os.path.join(output_dir, 'semi_structured')
UNSTRUCTURED_DIR = os.path.join(output_dir, 'unstructured')
SCHEMAS_DIR = os.path.join(output_dir, 'schemas')


def generate_ids(prefix, count):
    return [f"{prefix}_{i:06d}" for i in range(1, count + 1)]


logger.info("Starting data generation...")

# ---------------------------------------------------------
# Dimension Tables
# ---------------------------------------------------------
logger.info("Generating dimension tables...")

# ── Global customer distribution across 6 continents ──────────────
GLOBAL_COUNTRIES = [
    # North America
    'USA', 'Canada', 'Mexico',
    # South America
    'Brazil', 'Argentina', 'Colombia', 'Chile',
    # Europe
    'Germany', 'France', 'UK', 'Netherlands', 'Spain', 'Italy', 'Poland', 'Sweden',
    # Asia Pacific
    'China', 'Japan', 'India', 'South Korea', 'Australia', 'Singapore', 'Indonesia', 'Thailand',
    # Middle East
    'UAE', 'Saudi Arabia', 'Turkey',
    # Africa
    'South Africa', 'Nigeria', 'Kenya', 'Egypt',
]

customer_ids = generate_ids('CUST', NUM_CUSTOMERS)
customers_df = pd.DataFrame({
    'customer_id': customer_ids,
    'customer_name': [
        fake.company() if random.random() > 0.5 else fake.name()
        for _ in range(NUM_CUSTOMERS)
    ],
    'customer_type': np.random.choice(
        ['B2B', 'B2C'], NUM_CUSTOMERS, p=[0.35, 0.65]  # more B2B for global enterprise
    ),
    'country': np.random.choice(GLOBAL_COUNTRIES, NUM_CUSTOMERS),
    'region': np.random.choice(
        ['North America', 'Europe', 'Asia Pacific', 'South America', 'Middle East & Africa'],
        NUM_CUSTOMERS, p=[0.25, 0.25, 0.30, 0.10, 0.10]
    ),
    'registration_date': [
        fake.date_between(start_date='-5y', end_date='today')
        for _ in range(NUM_CUSTOMERS)
    ]
})
customers_df.to_csv(
    os.path.join(STRUCTURED_DIR, 'customers.csv'), index=False
)

product_ids = generate_ids('PROD', NUM_PRODUCTS)
categories = [
    'Electronics', 'Clothing', 'Home',
    'Industrial', 'Medical', 'Automotive'
]
products_df = pd.DataFrame({
    'product_id': product_ids,
    'product_name': [fake.catch_phrase() for _ in range(NUM_PRODUCTS)],
    'category': np.random.choice(categories, NUM_PRODUCTS),
    'unit_price': np.round(
        np.random.uniform(10.0, 5000.0, NUM_PRODUCTS), 2
    ),
    'weight_kg': np.round(
        np.random.uniform(0.5, 100.0, NUM_PRODUCTS), 2
    )
})
products_df.to_csv(
    os.path.join(STRUCTURED_DIR, 'products.csv'), index=False
)

supplier_ids = generate_ids('SUPP', NUM_SUPPLIERS)
suppliers_df = pd.DataFrame({
    'supplier_id': supplier_ids,
    'supplier_name': [
        f"{fake.company()} {fake.company_suffix()}"
        for _ in range(NUM_SUPPLIERS)
    ],
    'rating': np.round(
        np.random.uniform(1.0, 5.0, NUM_SUPPLIERS), 1
    ),
    # Global manufacturing hubs
    'country': np.random.choice(
        ['China', 'Vietnam', 'Mexico', 'India', 'USA', 'Germany',
         'Brazil', 'Bangladesh', 'Indonesia', 'Thailand', 'Taiwan',
         'South Korea', 'Poland', 'Turkey', 'Malaysia', 'Philippines'],
        NUM_SUPPLIERS
    ),
    'region': np.random.choice(
        ['North America', 'Europe', 'Asia Pacific', 'South America', 'Middle East & Africa'],
        NUM_SUPPLIERS, p=[0.15, 0.20, 0.45, 0.10, 0.10]
    )
})
suppliers_df.to_csv(
    os.path.join(STRUCTURED_DIR, 'suppliers.csv'), index=False
)

warehouse_ids = generate_ids('WHSE', NUM_WAREHOUSES)
# Global distribution centre cities
GLOBAL_WAREHOUSE_CITIES = [
    # North America
    'Los Angeles', 'Chicago', 'Dallas', 'New York', 'Houston', 'Toronto', 'Mexico City',
    # Europe
    'Rotterdam', 'Frankfurt', 'London', 'Paris', 'Warsaw', 'Madrid', 'Milan',
    # Asia Pacific
    'Shanghai', 'Singapore', 'Tokyo', 'Sydney', 'Mumbai', 'Seoul', 'Jakarta', 'Bangkok',
    # Middle East
    'Dubai', 'Riyadh', 'Istanbul',
    # South America
    'São Paulo', 'Buenos Aires', 'Bogotá',
    # Africa
    'Johannesburg', 'Lagos', 'Nairobi', 'Cairo',
]
warehouses_df = pd.DataFrame({
    'warehouse_id': warehouse_ids,
    'location': [
        random.choice(GLOBAL_WAREHOUSE_CITIES) for _ in range(NUM_WAREHOUSES)
    ],
    'region': np.random.choice(
        ['North America', 'Europe', 'Asia Pacific', 'South America', 'Middle East & Africa'],
        NUM_WAREHOUSES, p=[0.25, 0.25, 0.30, 0.10, 0.10]
    ),
    'capacity_sqft': np.random.randint(10000, 500000, NUM_WAREHOUSES),
    'manager_name': [fake.name() for _ in range(NUM_WAREHOUSES)]
})
warehouses_df.to_csv(
    os.path.join(STRUCTURED_DIR, 'warehouses.csv'), index=False
)

vehicle_ids = generate_ids('VEH', NUM_VEHICLES)
vehicles_df = pd.DataFrame({
    'vehicle_id': vehicle_ids,
    'vehicle_type': np.random.choice(
        ['Van', 'Box Truck', 'Semi-Trailer', 'Refrigerated'],
        NUM_VEHICLES, p=[0.4, 0.3, 0.2, 0.1]
    ),
    'capacity_kg': np.random.choice(
        [1500, 5000, 20000, 18000], NUM_VEHICLES
    ),
    'year': np.random.randint(2015, 2024, NUM_VEHICLES),
    'status': np.random.choice(
        ['Active', 'Maintenance', 'Decommissioned'],
        NUM_VEHICLES, p=[0.85, 0.10, 0.05]
    )
})
vehicles_df.to_csv(
    os.path.join(STRUCTURED_DIR, 'vehicles.csv'), index=False
)

driver_ids = generate_ids('DRV', NUM_DRIVERS)
drivers_df = pd.DataFrame({
    'driver_id': driver_ids,
    'driver_name': [fake.name() for _ in range(NUM_DRIVERS)],
    'license_type': np.random.choice(
        ['Class A', 'Class B', 'Class C'], NUM_DRIVERS
    ),
    'hire_date': [
        fake.date_between(start_date='-10y', end_date='today')
        for _ in range(NUM_DRIVERS)
    ]
})
drivers_df.to_csv(
    os.path.join(STRUCTURED_DIR, 'drivers.csv'), index=False
)

# ---------------------------------------------------------
# Fact Tables (Orders, Order Items, Shipments)
# ---------------------------------------------------------
logger.info("Generating fact tables (this may take a minute)...")

order_ids = generate_ids('ORD', NUM_ORDERS)
start_ts = datetime.strptime('2023-01-01', '%Y-%m-%d').timestamp()
end_ts = datetime.now().timestamp()
order_timestamps = np.random.randint(int(start_ts), int(end_ts), NUM_ORDERS)
order_dates = pd.to_datetime(order_timestamps, unit='s')

orders_df = pd.DataFrame({
    'order_id': order_ids,
    'customer_id': np.random.choice(customer_ids, NUM_ORDERS),
    'order_date': order_dates,
    'status': np.random.choice(
        ['Delivered', 'Processing', 'Shipped', 'Cancelled'],
        NUM_ORDERS, p=[0.8, 0.05, 0.1, 0.05]
    ),
    'total_amount': np.round(
        np.random.uniform(50.0, 10000.0, NUM_ORDERS), 2
    )
})
orders_df.to_csv(
    os.path.join(STRUCTURED_DIR, 'orders.csv'), index=False
)

# Order line items (~1.5 items per order on average)
num_items = int(NUM_ORDERS * 1.5)
order_items_df = pd.DataFrame({
    'order_id': np.random.choice(order_ids, num_items),
    'product_id': np.random.choice(product_ids, num_items),
    'quantity': np.random.randint(1, 10, num_items),
    'unit_price': np.round(
        np.random.uniform(10.0, 1000.0, num_items), 2
    )
})
order_items_df.to_csv(
    os.path.join(STRUCTURED_DIR, 'order_items.csv'), index=False
)

# Shipments — linking orders to vehicles and drivers
shipment_ids = generate_ids('SHIP', NUM_SHIPMENTS)
dispatch_dates = order_dates + pd.to_timedelta(
    np.random.randint(1, 5, NUM_SHIPMENTS), unit='D'
)
actual_delivery = dispatch_dates + pd.to_timedelta(
    np.random.randint(1, 10, NUM_SHIPMENTS), unit='D'
)

shipments_df = pd.DataFrame({
    'shipment_id': shipment_ids,
    'order_id': np.random.choice(order_ids, NUM_SHIPMENTS),
    'vehicle_id': np.random.choice(vehicle_ids, NUM_SHIPMENTS),
    'driver_id': np.random.choice(driver_ids, NUM_SHIPMENTS),
    'warehouse_id': np.random.choice(warehouse_ids, NUM_SHIPMENTS),
    'dispatch_date': dispatch_dates,
    'expected_delivery_date': dispatch_dates + pd.to_timedelta(5, unit='D'),
    'actual_delivery_date': [
        d if np.random.random() > 0.1 else None  # 10% still in transit
        for d in actual_delivery
    ]
})
shipments_df.to_csv(
    os.path.join(STRUCTURED_DIR, 'shipments.csv'), index=False
)

# ---------------------------------------------------------
# IoT Telemetry (NDJSON for streaming simulation)
# ---------------------------------------------------------
logger.info("Generating IoT telemetry (NDJSON) — GLOBAL coordinates, 20L records...")
v_ids = np.random.choice(vehicle_ids, NUM_TELEMETRY)
# ── Global lat/lon bounding boxes per region ───────────────────────
# Each telemetry event tagged to a real geographic region
REGION_BOUNDS = [
    # (lat_min, lat_max, lon_min, lon_max, region_label, weight)
    (25.0,  49.0, -125.0,  -67.0, 'North America',        0.22),
    (14.5,  33.0,  -92.0,  -77.0, 'Central America',      0.05),
    (-34.0, 5.0,  -73.0,  -35.0, 'South America',         0.10),
    (36.0,  71.0,   -9.0,   40.0, 'Europe',               0.22),
    (-35.0, 37.0,  -17.0,   51.0, 'Africa',               0.08),
    (20.0,  55.0,   26.0,   77.0, 'Middle East',          0.06),
    ( 5.0,  53.0,   68.0,  140.0, 'Asia Pacific',         0.20),
    (-43.0, -10.0, 113.0,  153.0, 'Australia & Oceania',  0.07),
]
region_labels  = [r[4] for r in REGION_BOUNDS]
region_weights = np.array([r[5] for r in REGION_BOUNDS])
region_weights /= region_weights.sum()  # normalise

assigned_regions = np.random.choice(len(REGION_BOUNDS), NUM_TELEMETRY, p=region_weights)
latitudes  = np.zeros(NUM_TELEMETRY)
longitudes = np.zeros(NUM_TELEMETRY)
for ri, (lat_min, lat_max, lon_min, lon_max, _, _w) in enumerate(REGION_BOUNDS):
    mask = assigned_regions == ri
    latitudes[mask]  = np.round(np.random.uniform(lat_min, lat_max, mask.sum()), 4)
    longitudes[mask] = np.round(np.random.uniform(lon_min, lon_max, mask.sum()), 4)
speeds = np.random.normal(85, 15, NUM_TELEMETRY).clip(0, 140)
fuels = np.random.uniform(5.0, 100.0, NUM_TELEMETRY)
temps = np.random.normal(90, 5, NUM_TELEMETRY).clip(70, 120)

with open(
    os.path.join(SEMI_STRUCTURED_DIR, 'iot_telemetry.json'), 'w'
) as f:
    for i in range(NUM_TELEMETRY):
        event = {
            "event_id":              str(uuid.uuid4()),
            "vehicle_id":            str(v_ids[i]),
            "timestamp":             datetime.now().isoformat(),
            "latitude":              float(latitudes[i]),
            "longitude":             float(longitudes[i]),
            "region":                region_labels[assigned_regions[i]],
            "speed_kmh":             float(round(float(np.random.normal(85, 15)), 2)),
            "fuel_level_pct":        float(round(float(np.random.uniform(5.0, 100.0)), 2)),
            "engine_temperature_c":  float(round(float(np.random.normal(90, 5)), 2))
        }
        f.write(json.dumps(event) + "\n")

# ---------------------------------------------------------
# Supplier Invoices (XML)
# ---------------------------------------------------------
logger.info("Generating XML invoices...")
with open(
    os.path.join(SEMI_STRUCTURED_DIR, 'supplier_invoices.xml'), 'w'
) as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    f.write('<invoices>\n')
    for _ in range(1000):
        f.write(f'  <invoice id="{uuid.uuid4()}">\n')
        f.write(f'    <supplier_id>{random.choice(supplier_ids)}</supplier_id>\n')
        f.write(f'    <amount>{round(random.uniform(1000, 50000), 2)}</amount>\n')
        f.write(f'    <date>{fake.date_this_year()}</date>\n')
        f.write('  </invoice>\n')
    f.write('</invoices>\n')

# ---------------------------------------------------------
# Unstructured Text Documents
# ---------------------------------------------------------
logger.info("Generating maintenance reports...")
os.makedirs(
    os.path.join(UNSTRUCTURED_DIR, 'maintenance_reports'), exist_ok=True
)
for i in range(100):
    vid = random.choice(vehicle_ids)
    report_path = os.path.join(
        UNSTRUCTURED_DIR, 'maintenance_reports', f'report_{vid}_{i}.txt'
    )
    with open(report_path, 'w') as f:
        f.write(f"Maintenance Report for {vid}\n")
        f.write(f"Date: {fake.date_this_month()}\n")
        f.write("Issues found:\n")
        f.write("- " + fake.sentence() + "\n")
        f.write("- " + fake.sentence() + "\n")
        f.write("Status: Resolved\n")

logger.info(
    f"Synthetic data generation complete — 20 Lakh scale, GLOBAL orientation.\n"
    f"  Orders:    {NUM_ORDERS:,}\n"
    f"  Shipments: {NUM_SHIPMENTS:,}\n"
    f"  Telemetry: {NUM_TELEMETRY:,}\n"
    f"  Files saved to: {output_dir}"
)

