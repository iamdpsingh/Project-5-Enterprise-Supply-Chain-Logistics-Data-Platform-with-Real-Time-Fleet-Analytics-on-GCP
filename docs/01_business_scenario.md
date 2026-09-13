# Business Scenario

## Context
GlobalLogistics Inc. is a leading supply-chain and logistics company managing thousands of shipments daily. The company operates a vast network of suppliers, warehouses, and a fleet of delivery vehicles equipped with IoT telemetry sensors.

## Problem Statement
Currently, the company's data is fragmented across various systems:
- Transactional data (orders, inventory, shipments) is stored in legacy relational databases.
- Semi-structured data (supplier APIs, vehicle telemetry) is difficult to integrate and analyze in real-time.
- Unstructured data (invoices, maintenance reports, delivery proofs) is stored manually in file shares and lacks automated processing.

This fragmentation leads to:
1. Lack of real-time visibility into the supply chain.
2. Inability to monitor fleet health and route deviations proactively.
3. Delayed identification of inventory stockouts or supplier delays.
4. Reactive instead of predictive maintenance for the fleet.

## Objective
Build a centralized, real-time Enterprise Data Platform on Google Cloud Platform (GCP). The platform will ingest structured, semi-structured, and unstructured data across batch and streaming pipelines to enable a **Supply Chain Control Tower**.

## Business Domains Covered
1. **Order Management**: Customers, products, orders, payments.
2. **Supply Chain**: Suppliers, purchase orders, performance, procurement.
3. **Warehouse & Inventory**: Stock movements, capacity, reorder levels.
4. **Logistics**: Shipments, routes, deliveries, delays, ETAs.
5. **Fleet**: Vehicles, drivers, GPS telemetry, fuel, engine health.
