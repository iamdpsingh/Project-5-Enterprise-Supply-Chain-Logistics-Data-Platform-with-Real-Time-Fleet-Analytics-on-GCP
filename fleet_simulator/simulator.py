"""
Fleet Simulator — Generates realistic IoT telemetry events and publishes to Pub/Sub.
Designed to be containerized with Docker and deployed on Cloud Run.
"""
import json
import time
import random
import math
from datetime import datetime, timezone

# ── Configuration (20 Lakh scale) ──────────────────────────────────────
NUM_VEHICLES = 400           # Global fleet (doubled)
PUBLISH_INTERVAL = 1         # seconds between batches
EVENTS_PER_BATCH = 50

# Global route hubs — major logistics cities across 6 continents
ROUTE_POINTS = [
    # North America
    (40.7128, -74.0060,  'New York',      'North America'),
    (34.0522, -118.2437, 'Los Angeles',   'North America'),
    (41.8781, -87.6298,  'Chicago',       'North America'),
    (29.7604, -95.3698,  'Houston',       'North America'),
    (43.6532, -79.3832,  'Toronto',       'North America'),
    (19.4326, -99.1332,  'Mexico City',   'North America'),
    # South America
    (-23.5505, -46.6333, 'São Paulo',     'South America'),
    (-34.6037, -58.3816, 'Buenos Aires',  'South America'),
    ( -4.2634, -69.9369, 'Bogotá',       'South America'),
    # Europe
    (51.5074,  -0.1278,  'London',        'Europe'),
    (48.8566,   2.3522,  'Paris',         'Europe'),
    (52.5200,  13.4050,  'Berlin',        'Europe'),
    (51.9225,   4.4792,  'Rotterdam',     'Europe'),
    (52.2297,  21.0122,  'Warsaw',        'Europe'),
    (45.4654,   9.1859,  'Milan',         'Europe'),
    # Middle East & Africa
    (25.2048,  55.2708,  'Dubai',         'Middle East & Africa'),
    (24.7136,  46.6753,  'Riyadh',        'Middle East & Africa'),
    (41.0082,  28.9784,  'Istanbul',      'Middle East & Africa'),
    (-26.2041,  28.0473, 'Johannesburg',  'Middle East & Africa'),
    ( 6.5244,   3.3792,  'Lagos',         'Middle East & Africa'),
    (30.0444,  31.2357,  'Cairo',         'Middle East & Africa'),
    # Asia Pacific
    (31.2304, 121.4737,  'Shanghai',      'Asia Pacific'),
    (35.6762, 139.6503,  'Tokyo',         'Asia Pacific'),
    ( 1.3521, 103.8198,  'Singapore',     'Asia Pacific'),
    (19.0760,  72.8777,  'Mumbai',        'Asia Pacific'),
    (37.5665, 126.9780,  'Seoul',         'Asia Pacific'),
    (-6.2088, 106.8456,  'Jakarta',       'Asia Pacific'),
    (13.7563, 100.5018,  'Bangkok',       'Asia Pacific'),
    # Australia & Oceania
    (-33.8688, 151.2093, 'Sydney',        'Australia & Oceania'),
    (-37.8136, 144.9631, 'Melbourne',     'Australia & Oceania'),
]


def generate_vehicle_state(vehicle_id: int, step: int) -> dict:
    """Generate a single telemetry event for a vehicle assigned to a global region."""
    # Each vehicle is pinned to a specific hub city (consistent regional routing)
    route_idx = vehicle_id % len(ROUTE_POINTS)
    base_lat, base_lon, city, region = ROUTE_POINTS[route_idx]

    # Simulate realistic route movement around the hub
    lat = base_lat + math.sin(step * 0.01) * 0.5 + random.gauss(0, 0.01)
    lon = base_lon + math.cos(step * 0.01) * 0.5 + random.gauss(0, 0.01)

    # Speed varies by region (highway norms differ globally)
    base_speed = 80 if region in ('Europe', 'Australia & Oceania') else 65
    speed = max(0, random.gauss(base_speed, 15))
    if random.random() < 0.05:  # 5% chance of speeding
        speed = random.uniform(110, 145)

    # Fuel: slowly decreasing over time
    fuel = max(5, 100 - (step % 500) * 0.2 + random.gauss(0, 2))

    # Engine temp: mostly normal, occasional overheating
    engine_temp = random.gauss(88, 4)
    if random.random() < 0.02:  # 2% chance of overheating
        engine_temp = random.uniform(105, 120)

    return {
        "event_id":             f"EVT_{vehicle_id:04d}_{step:08d}",
        "vehicle_id":           f"VEH_{vehicle_id:06d}",
        "timestamp":            datetime.now(timezone.utc).isoformat(),
        "latitude":             round(lat, 6),
        "longitude":            round(lon, 6),
        "region":               region,
        "hub_city":             city,
        "speed_kmh":            round(speed, 2),
        "fuel_level_pct":       round(fuel, 2),
        "engine_temperature_c": round(engine_temp, 2),
    }


def run_local(num_events: int = 1000):
    """Run locally, printing events to stdout (for testing)."""
    step = 0
    generated = 0
    while generated < num_events:
        batch = []
        for _ in range(min(EVENTS_PER_BATCH, num_events - generated)):
            vid = random.randint(1, NUM_VEHICLES)
            event = generate_vehicle_state(vid, step)
            batch.append(event)
            generated += 1
            step += 1

        for event in batch:
            print(json.dumps(event))

        time.sleep(PUBLISH_INTERVAL)

    print(f"\n✅ Generated {generated} telemetry events.")


def run_pubsub(project_id: str, topic_id: str, duration_seconds: int = 60):
    """Publish telemetry events to Google Pub/Sub."""
    from google.cloud import pubsub_v1

    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, topic_id)

    step = 0
    start = time.time()
    total = 0

    print(f"Publishing to {topic_path} for {duration_seconds}s...")

    while (time.time() - start) < duration_seconds:
        futures = []
        for _ in range(EVENTS_PER_BATCH):
            vid = random.randint(1, NUM_VEHICLES)
            event = generate_vehicle_state(vid, step)
            data = json.dumps(event).encode("utf-8")
            future = publisher.publish(topic_path, data, vehicle_id=event["vehicle_id"])
            futures.append(future)
            step += 1
            total += 1

        # Wait for all publishes in batch
        for f in futures:
            f.result()

        time.sleep(PUBLISH_INTERVAL)

    print(f"\n✅ Published {total} events to Pub/Sub in {duration_seconds}s.")


if __name__ == "__main__":
    import sys
    import os
    import threading
    from http.server import HTTPServer, BaseHTTPRequestHandler

    class HealthCheckHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        
        # Suppress logging of health checks to keep logs clean
        def log_message(self, format, *args):
            pass

    def start_health_server():
        port = int(os.environ.get("PORT", 8080))
        server = HTTPServer(("0.0.0.0", port), HealthCheckHandler)
        print(f"Started health check server on port {port}")
        server.serve_forever()

    if len(sys.argv) > 1 and sys.argv[1] == "--pubsub":
        # Start health check server in a background thread so Cloud Run knows the container is ready
        threading.Thread(target=start_health_server, daemon=True).start()
        
        # Use env vars injected by Terraform, or fall back to sys args/defaults
        project = os.environ.get("PROJECT_ID", sys.argv[2] if len(sys.argv) > 2 else "supply-chain-logistics-508517")
        topic = os.environ.get("TOPIC_ID", sys.argv[3] if len(sys.argv) > 3 else "fleet-telemetry")
        
        # Run for 24 hours in the cloud instead of just 60 seconds
        duration = int(sys.argv[4]) if len(sys.argv) > 4 else 86400
        run_pubsub(project, topic, duration)
    else:
        run_local(num_events=500)
