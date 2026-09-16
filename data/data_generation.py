"""
Synthetic data generator for the supply chain platform.
Produces ~2.8M records across structured (CSV), semi-structured (JSON/XML),
and unstructured (text) formats to simulate realistic production data.
"""
import os
import json
import uuid
import random

import numpy as np
import pandas as pd
from faker import Faker
from datetime import datetime


fake = Faker()

# Volume configuration
NUM_CUSTOMERS = 50000
NUM_PRODUCTS = 10000
NUM_SUPPLIERS = 500
NUM_WAREHOUSES = 100
NUM_VEHICLES = 2000
NUM_DRIVERS = 2500
NUM_ORDERS = 500000
NUM_SHIPMENTS = 500000
NUM_TELEMETRY = 1000000

# Output directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STRUCTURED_DIR = os.path.join(BASE_DIR, 'data', 'structured')
SEMI_STRUCTURED_DIR = os.path.join(BASE_DIR, 'data', 'semi_structured')
UNSTRUCTURED_DIR = os.path.join(BASE_DIR, 'data', 'unstructured')
SCHEMAS_DIR = os.path.join(BASE_DIR, 'data', 'schemas')


def generate_ids(prefix, count):
    return [f"{prefix}_{i:06d}" for i in range(1, count + 1)]


print("Starting data generation...")

# ---------------------------------------------------------
# Dimension Tables
# ---------------------------------------------------------
print("Generating dimension tables...")

customer_ids = generate_ids('CUST', NUM_CUSTOMERS)
customers_df = pd.DataFrame({
    'customer_id': customer_ids,
    'customer_name': [
        fake.company() if random.random() > 0.5 else fake.name()
        for _ in range(NUM_CUSTOMERS)
    ],
    'customer_type': np.random.choice(
        ['B2B', 'B2C'], NUM_CUSTOMERS, p=[0.2, 0.8]
    ),
    'country': np.random.choice(
        ['USA', 'Canada', 'UK', 'Germany', 'France', 'Australia', 'Japan'],
        NUM_CUSTOMERS
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
    'country': np.random.choice(
        ['China', 'Vietnam', 'Mexico', 'India', 'USA', 'Germany', 'Brazil'],
        NUM_SUPPLIERS
    )
})
suppliers_df.to_csv(
    os.path.join(STRUCTURED_DIR, 'suppliers.csv'), index=False
)

warehouse_ids = generate_ids('WHSE', NUM_WAREHOUSES)
warehouses_df = pd.DataFrame({
    'warehouse_id': warehouse_ids,
    'location': [fake.city() for _ in range(NUM_WAREHOUSES)],
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
print("Generating fact tables (this may take a minute)...")

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
print("Generating IoT telemetry (NDJSON)...")
v_ids = np.random.choice(vehicle_ids, NUM_TELEMETRY)
latitudes = np.round(np.random.uniform(25.0, 49.0, NUM_TELEMETRY), 4)
longitudes = np.round(np.random.uniform(-125.0, -67.0, NUM_TELEMETRY), 4)
speeds = np.random.normal(85, 15, NUM_TELEMETRY).clip(0, 140)
fuels = np.random.uniform(5.0, 100.0, NUM_TELEMETRY)
temps = np.random.normal(90, 5, NUM_TELEMETRY).clip(70, 120)

with open(
    os.path.join(SEMI_STRUCTURED_DIR, 'iot_telemetry.json'), 'w'
) as f:
    for i in range(NUM_TELEMETRY):
        event = {
            "event_id": str(uuid.uuid4()),
            "vehicle_id": str(v_ids[i]),
            "timestamp": datetime.now().isoformat(),
            "latitude": float(latitudes[i]),
            "longitude": float(longitudes[i]),
            "speed_kmh": float(speeds[i]),
            "fuel_level_pct": float(fuels[i]),
            "engine_temperature_c": float(temps[i])
        }
        f.write(json.dumps(event) + "\n")

# ---------------------------------------------------------
# Supplier Invoices (XML)
# ---------------------------------------------------------
print("Generating XML invoices...")
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
print("Generating maintenance reports...")
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

print("Data generation completed successfully!")
