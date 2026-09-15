"""
Fleet Simulator — Generates realistic IoT telemetry events and publishes to Pub/Sub.
Designed to be containerized with Docker and deployed on Cloud Run.
"""
import json
import time
import random
import math
from datetime import datetime, timezone

# Configuration
NUM_VEHICLES = 200
PUBLISH_INTERVAL = 1  # seconds between batches
EVENTS_PER_BATCH = 50

# Indian city coordinates for realistic routes
ROUTE_POINTS = [
    (28.6139, 77.2090),   # Delhi
    (19.0760, 72.8777),   # Mumbai
    (13.0827, 80.2707),   # Chennai
    (22.5726, 88.3639),   # Kolkata
    (12.9716, 77.5946),   # Bangalore
    (17.3850, 78.4867),   # Hyderabad
    (23.0225, 72.5714),   # Ahmedabad
    (26.9124, 75.7873),   # Jaipur
]


def generate_vehicle_state(vehicle_id: int, step: int) -> dict:
    """Generate a single telemetry event for a vehicle."""
    # Simulate movement along a route
    route_idx = vehicle_id % len(ROUTE_POINTS)
    base_lat, base_lon = ROUTE_POINTS[route_idx]

    # Add some movement noise
    lat = base_lat + math.sin(step * 0.01) * 0.05 + random.gauss(0, 0.001)
    lon = base_lon + math.cos(step * 0.01) * 0.05 + random.gauss(0, 0.001)

    # Speed: normal driving with occasional spikes
    speed = max(0, random.gauss(65, 15))
    if random.random() < 0.05:  # 5% chance of speeding
        speed = random.uniform(100, 140)

    # Fuel: slowly decreasing
    fuel = max(5, 100 - (step % 500) * 0.2 + random.gauss(0, 2))

    # Engine temp: mostly normal, occasional overheating
    engine_temp = random.gauss(88, 4)
    if random.random() < 0.02:  # 2% chance of overheating
        engine_temp = random.uniform(105, 120)

    return {
        "event_id": f"EVT_{vehicle_id:04d}_{step:08d}",
        "vehicle_id": f"VEH_{vehicle_id:06d}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "latitude": round(lat, 6),
        "longitude": round(lon, 6),
        "speed_kmh": round(speed, 2),
        "fuel_level_pct": round(fuel, 2),
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
    if len(sys.argv) > 1 and sys.argv[1] == "--pubsub":
        project = sys.argv[2] if len(sys.argv) > 2 else "supply-chain-logistics-508517"
        topic = sys.argv[3] if len(sys.argv) > 3 else "fleet-telemetry"
        duration = int(sys.argv[4]) if len(sys.argv) > 4 else 60
        run_pubsub(project, topic, duration)
    else:
        run_local(num_events=500)
