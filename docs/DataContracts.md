# Warehouse Live - Data Contracts

Version: 0.1  
Date: 2 Feb 2026  
Status: Draft

---

## Overview

This document defines all data formats (CSV and JSON) used by Warehouse Live MVP. These schemas are stable for ICON and drive the demo datasets.

**Principles:**
- CSV for spatial/temporal data (layouts, snapshots, timelines)
- JSON for structured metadata (annotations, plans, explanations)
- All timestamps in ISO 8601 format
- All coordinates in facility-local units (feet or meters, document in metadata)
- Required fields marked with `*`
- Optional fields may be empty strings or omitted

---

## 1. Warehouse Layout (CSV)

**File:** `warehouse_layout.csv`

**Purpose:** Define the static spatial structure of the warehouse (zones, aisles, racks, docks)

**Schema:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `element_type`* | string | Yes | Type of layout element | "zone", "aisle", "rack", "dock" |
| `element_id`* | string | Yes | Unique identifier | "Zone-A", "Aisle-14", "Rack-B3" |
| `name` | string | No | Display name | "Receiving Zone", "Main Aisle" |
| `x`* | number | Yes | X coordinate (center) | 245.5 |
| `y`* | number | Yes | Y coordinate (center) | 112.3 |
| `z` | number | No | Z coordinate (ground=0) | 0.0 |
| `width`* | number | Yes | Width (X dimension) | 50.0 |
| `depth`* | number | Yes | Depth (Y dimension) | 40.0 |
| `height` | number | No | Height (Z dimension) | 12.0 |
| `rotation` | number | No | Rotation in degrees (0-360) | 90 |
| `capacity` | number | No | Storage/throughput capacity | 500 |
| `metadata` | JSON string | No | Additional properties | `{"floor": 1, "hvac_zone": "A"}` |

**Example Rows:**

```csv
element_type,element_id,name,x,y,z,width,depth,height,rotation,capacity,metadata
zone,Zone-A,Receiving Zone,100,50,0,80,60,15,0,1000,"{\"floor\": 1}"
zone,Zone-B,Storage Zone,200,50,0,120,80,20,0,2500,"{\"floor\": 1}"
zone,Zone-C,Picking Zone,100,150,0,80,60,15,0,800,"{\"floor\": 1}"
aisle,Aisle-1,Main Aisle,150,100,0,200,12,0,0,,"{\"type\": \"main\"}"
aisle,Aisle-14,Picking Aisle 14,90,150,0,60,8,0,0,,"{\"type\": \"picking\"}"
rack,Rack-A1,Rack A1,190,45,0,10,4,18,0,200,"{\"levels\": 6}"
rack,Rack-A2,Rack A2,190,55,0,10,4,18,0,200,"{\"levels\": 6}"
dock,Dock-1,Receiving Door 1,10,50,0,15,15,12,270,5,"{\"type\": \"receiving\"}"
dock,Dock-2,Shipping Door 1,10,150,0,15,15,12,270,5,"{\"type\": \"shipping\"}"
```

**Notes:**
- Coordinates are in facility units (document scale in metadata)
- `rotation` is clockwise from north (0°)
- `metadata` is a JSON string for extensibility

---

## 2. Warehouse State Snapshot (CSV)

**File:** `warehouse_state.csv`

**Purpose:** Define the operational state at a single point in time (entities and their positions)

**Schema:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `timestamp`* | ISO 8601 | Yes | Snapshot time | "2026-04-15T08:00:00Z" |
| `entity_type`* | string | Yes | Type of entity | "worker", "forklift", "pallet", "inventory" |
| `entity_id`* | string | Yes | Unique identifier | "W-042", "FL-07", "PLT-1234" |
| `zone`* | string | Yes | Current zone | "Zone-C" |
| `x`* | number | Yes | X coordinate | 245.5 |
| `y`* | number | Yes | Y coordinate | 112.3 |
| `z` | number | No | Z coordinate | 0.0 |
| `status`* | string | Yes | Entity status | "active", "idle", "moving", "error" |
| `task` | string | No | Current task | "picking", "transporting", "loading" |
| `assigned_to` | string | No | Assignment reference | "Order-5678", "Wave-23" |
| `battery_level` | number | No | Battery % (equipment) | 85 |
| `speed` | number | No | Current speed | 3.5 |
| `metadata` | JSON string | No | Additional data | `{"sku": "4472", "qty": 24}` |

**Example Rows:**

```csv
timestamp,entity_type,entity_id,zone,x,y,z,status,task,assigned_to,battery_level,speed,metadata
2026-04-15T08:00:00Z,worker,W-042,Zone-C,245.5,112.3,0,active,picking,Order-5678,,,"{\"sku\": \"4472\", \"qty\": 24}"
2026-04-15T08:00:00Z,worker,W-043,Zone-C,247.2,115.8,0,active,picking,Order-5679,,,"{\"sku\": \"3301\", \"qty\": 12}"
2026-04-15T08:00:00Z,worker,W-018,Zone-A,105.3,52.1,0,idle,waiting,,,0,""
2026-04-15T08:00:00Z,forklift,FL-07,Zone-B,198.4,75.2,0,moving,transporting,Wave-23,78,4.2,"{\"load_weight\": 1200}"
2026-04-15T08:00:00Z,forklift,FL-03,Dock-1,12.5,50.0,0,idle,standby,,45,0,""
2026-04-15T08:00:00Z,pallet,PLT-1234,Zone-B,202.1,68.3,0,staged,awaiting_pickup,Wave-23,,,"{\"sku\": \"5512\", \"qty\": 48}"
2026-04-15T08:00:00Z,inventory,INV-8821,Rack-A1,190.0,45.0,6.0,stored,available,,,,"{\"sku\": \"2210\", \"qty\": 100, \"level\": 3}"
```

**Notes:**
- All entities at the same `timestamp` represent a single snapshot
- Missing optional fields can be empty or omitted
- `metadata` can include domain-specific fields (SKU, quantity, order ID, etc.)

---

## 3. Warehouse Timeline (CSV)

**File:** `warehouse_timeline_{scenario_id}.csv`

**Purpose:** Define entity movements and state changes over time for a specific scenario

**Schema:**

Same as `warehouse_state.csv`, but with multiple timestamps representing a time series

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `timestamp`* | ISO 8601 | Yes | Event time | "2026-04-15T08:05:30Z" |
| (all fields from warehouse_state.csv) | | | | |

**Additional Timeline-Specific Fields:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `event_type` | string | No | Event that triggered state change | "moved", "task_completed", "alert_fired", "idle" |
| `from_zone` | string | No | Previous zone (for moves) | "Zone-A" |
| `to_zone` | string | No | Target zone (for moves) | "Zone-B" |

**Example Rows:**

```csv
timestamp,entity_type,entity_id,zone,x,y,z,status,task,assigned_to,event_type,from_zone,to_zone,metadata
2026-04-15T08:00:00Z,worker,W-042,Zone-C,245.5,112.3,0,active,picking,Order-5678,task_started,,,"{\"sku\": \"4472\"}"
2026-04-15T08:02:15Z,worker,W-042,Zone-C,248.2,114.1,0,active,picking,Order-5678,moved,,,"{\"sku\": \"4472\"}"
2026-04-15T08:03:45Z,worker,W-042,Zone-C,251.0,115.0,0,active,picking,Order-5678,moved,,,"{\"sku\": \"4472\"}"
2026-04-15T08:05:30Z,worker,W-042,Zone-C,252.5,116.2,0,active,transporting,Order-5678,task_completed,,,"{\"sku\": \"4472\", \"qty\": 24}"
2026-04-15T08:07:00Z,worker,W-042,Zone-B,220.0,80.0,0,moving,transporting,Order-5678,moved,Zone-C,Zone-B,"{\"sku\": \"4472\", \"qty\": 24}"
2026-04-15T08:09:47Z,worker,W-042,Zone-B,202.3,75.1,0,idle,waiting,,idle,Zone-C,Zone-B,""
```

**Notes:**
- Rows are sorted by `timestamp` ascending
- Entity positions should be sampled at reasonable intervals (5-30 seconds)
- Not all entities need to appear at every timestamp (only include changes)
- For smooth animation, include intermediate positions for moving entities

---

## 4. Alerts Definition (CSV)

**File:** `alerts.csv`

**Purpose:** Define alert rules and pre-computed alert instances for scenarios

**Schema:**

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `alert_id`* | string | Yes | Unique alert identifier | "congestion-zone-c-001" |
| `alert_type`* | string | Yes | Alert category | "congestion", "bottleneck", "safety", "delay" |
| `title`* | string | Yes | Display title | "Potential Bottleneck in Zone C" |
| `description` | string | No | Detailed description | "High worker density detected" |
| `scenario_id`* | string | Yes | Scenario this alert belongs to | "scenario_congestion" |
| `trigger_time`* | ISO 8601 | Yes | When alert fires | "2026-04-15T09:47:00Z" |
| `zone`* | string | Yes | Affected zone | "Zone-C" |
| `x`* | number | Yes | Alert pin X coordinate | 245.0 |
| `y`* | number | Yes | Alert pin Y coordinate | 115.0 |
| `z` | number | No | Alert pin Z coordinate | 0.0 |
| `confidence`* | number | Yes | Confidence score (0-1) | 0.85 |
| `impact_level`* | string | Yes | Impact severity | "low", "medium", "high" |
| `impact_description` | string | No | Impact statement | "May delay 12 orders by 15 minutes" |
| `affected_entities` | JSON array | No | List of affected entity IDs | `["W-042", "W-043", "FL-07"]` |
| `metric_values` | JSON object | No | Metric readings that triggered alert | `{"worker_density": 0.82, "throughput": 45}` |
| `threshold_config` | JSON object | No | Threshold configuration | `{"metric": "worker_density", "threshold": 0.8, "condition": "above"}` |

**Example Rows:**

```csv
alert_id,alert_type,title,description,scenario_id,trigger_time,zone,x,y,z,confidence,impact_level,impact_description,affected_entities,metric_values,threshold_config
congestion-zone-c-001,congestion,Potential Bottleneck in Zone C,High worker density may cause delays,scenario_congestion,2026-04-15T09:47:00Z,Zone-C,245.0,115.0,0,0.85,high,May delay 12 orders by 15 minutes,"[\"W-042\", \"W-043\", \"W-051\", \"W-018\"]","{\"worker_density\": 0.82, \"active_tasks\": 52, \"aisle_width\": 8.5}","{\"metric\": \"worker_density\", \"threshold\": 0.8, \"condition\": \"above\"}"
delay-dock-2-001,delay,Shipping Dock 2 Congestion,Staging area near capacity,scenario_dock_delay,2026-04-15T10:15:00Z,Dock-2,15.0,150.0,0,0.78,medium,May miss 3 shipment windows by 10 minutes,"[\"FL-03\", \"PLT-5501\", \"PLT-5502\"]","{\"dock_utilization\": 0.92, \"staged_pallets\": 11}","{\"metric\": \"dock_utilization\", \"threshold\": 0.9, \"condition\": \"above\"}"
safety-aisle-1-001,safety,Safety Concern: Aisle 1 Congestion,Multiple forklifts + workers in narrow aisle,scenario_safety,2026-04-15T11:03:00Z,Aisle-1,150.0,100.0,0,0.91,high,Collision risk elevated,"[\"FL-07\", \"FL-09\", \"W-021\", \"W-033\"]","{\"forklift_count\": 2, \"worker_count\": 2, \"aisle_width\": 12}","{\"metric\": \"density_mixed\", \"threshold\": 0.75, \"condition\": \"above\"}"
```

**Notes:**
- Each row represents a specific alert instance tied to a scenario
- `metric_values` and `threshold_config` support explainability
- Multiple alerts can exist for the same scenario at different times

---

## 5. KPI Definitions (JSON)

**File:** `kpi_config.json`

**Purpose:** Define KPI metadata, thresholds, and computation rules

**Schema:**

```json
{
  "kpis": [
    {
      "id": "throughput",
      "label": "Throughput",
      "description": "Orders processed per hour",
      "unit": "orders/hr",
      "category": "performance",
      "persona": ["manager", "supervisor"],
      "overlayType": "heat_throughput",
      "computation": {
        "source": "timeline",
        "aggregation": "count",
        "filter": {
          "entity_type": "worker",
          "event_type": "task_completed"
        },
        "timeWindow": 3600
      },
      "thresholds": {
        "critical": { "operator": "below", "value": 30 },
        "watch": { "operator": "below", "value": 45 },
        "normal": { "operator": "above", "value": 45 }
      },
      "drillDownDrivers": ["zone", "worker", "task_type"]
    },
    {
      "id": "orders_at_risk",
      "label": "Orders at Risk",
      "description": "Orders likely to miss SLA",
      "unit": "orders",
      "category": "risk",
      "persona": ["manager"],
      "overlayType": "heat_risk",
      "computation": {
        "source": "timeline",
        "aggregation": "count",
        "filter": {
          "metadata.sla_buffer": "below_threshold"
        }
      },
      "thresholds": {
        "critical": { "operator": "above", "value": 10 },
        "watch": { "operator": "above", "value": 5 },
        "normal": { "operator": "below", "value": 5 }
      },
      "drillDownDrivers": ["zone", "order_id", "delay_reason"]
    },
    {
      "id": "labor_utilization",
      "label": "Labor Utilization",
      "description": "Percentage of worker time active",
      "unit": "%",
      "category": "efficiency",
      "persona": ["manager", "supervisor"],
      "overlayType": "heat_utilization",
      "computation": {
        "source": "snapshot",
        "aggregation": "percentage",
        "filter": {
          "entity_type": "worker",
          "status": "active"
        }
      },
      "thresholds": {
        "critical": { "operator": "below", "value": 60 },
        "watch": { "operator": "below", "value": 75 },
        "normal": { "operator": "between", "value": [75, 90] }
      },
      "drillDownDrivers": ["zone", "worker", "task"]
    },
    {
      "id": "dock_utilization",
      "label": "Dock Utilization",
      "description": "Percentage of dock capacity in use",
      "unit": "%",
      "category": "capacity",
      "persona": ["manager"],
      "overlayType": "heat_dock",
      "computation": {
        "source": "snapshot",
        "aggregation": "ratio",
        "numerator": {
          "entity_type": "pallet",
          "zone": "dock_*"
        },
        "denominator": "dock_capacity"
      },
      "thresholds": {
        "critical": { "operator": "above", "value": 95 },
        "watch": { "operator": "above", "value": 85 },
        "normal": { "operator": "below", "value": 85 }
      },
      "drillDownDrivers": ["dock", "pallet", "shipment"]
    }
  ]
}
```

**Fields:**
- `id`: Unique KPI identifier
- `label`: Display name
- `overlayType`: Linked heat map overlay
- `persona`: Which user roles see this KPI
- `computation`: How to calculate from data
- `thresholds`: Status thresholds (Normal/Watch/Critical)
- `drillDownDrivers`: What to show in drill-down panel

---

## 6. Explainability Templates (JSON)

**File:** `explainability_templates.json`

**Purpose:** Define templates for generating alert explanations

**Schema:**

```json
{
  "templates": [
    {
      "alertType": "congestion",
      "title": "Why is this happening?",
      "factors": [
        {
          "label": "Worker Density",
          "valueKey": "worker_density",
          "unit": "workers/sqft",
          "thresholdKey": "density_threshold",
          "status": "above"
        },
        {
          "label": "Aisle Width",
          "valueKey": "aisle_width",
          "unit": "ft",
          "thresholdKey": null,
          "status": "info"
        },
        {
          "label": "Active Tasks",
          "valueKey": "active_tasks",
          "unit": "tasks",
          "thresholdKey": "task_threshold",
          "status": "above"
        }
      ],
      "impactDescription": "Congestion may delay {{affected_orders}} orders by {{delay_minutes}} minutes",
      "spatialConstraints": [
        "Aisle width: {{aisle_width}} ft (narrow for current volume)",
        "{{forklift_count}} forklifts in zone (increases complexity)"
      ],
      "recommendationHint": "resource_reallocation",
      "evidenceQuery": {
        "entities": {
          "filter": {
            "zone": "{{zone}}",
            "status": "active"
          }
        }
      }
    },
    {
      "alertType": "bottleneck",
      "title": "Why is this happening?",
      "factors": [
        {
          "label": "Queue Length",
          "valueKey": "queue_length",
          "unit": "tasks",
          "thresholdKey": "queue_threshold",
          "status": "above"
        },
        {
          "label": "Processing Rate",
          "valueKey": "processing_rate",
          "unit": "tasks/hr",
          "thresholdKey": "min_rate",
          "status": "below"
        },
        {
          "label": "Available Workers",
          "valueKey": "worker_count",
          "unit": "workers",
          "thresholdKey": null,
          "status": "info"
        }
      ],
      "impactDescription": "Bottleneck may delay {{affected_waves}} waves by {{delay_minutes}} minutes on average",
      "spatialConstraints": [
        "Single access point to {{zone}} (choke point)",
        "Limited staging space: {{staging_capacity}} pallets"
      ],
      "recommendationHint": "process_optimization",
      "evidenceQuery": {
        "entities": {
          "filter": {
            "assigned_to": "{{wave_id}}",
            "status": ["waiting", "queued"]
          }
        }
      }
    }
  ]
}
```

**Fields:**
- `alertType`: Maps to `alert_type` in alerts.csv
- `factors`: Data factors displayed in explainability panel
- `valueKey`: Key to look up in `metric_values` from alerts.csv
- `impactDescription`: Template string with variable substitution
- `spatialConstraints`: Additional context derived from layout
- `recommendationHint`: Hint for which recommendation set to use

**Variable Substitution:**
- `{{variable_name}}` placeholders replaced with values from alert data
- Values come from `metric_values` or computed from context

---

## 7. Recommendations (JSON)

**File:** `recommendations_{alert_type}.json`

**Purpose:** Define pre-computed recommendation options for each alert type

**Schema:**

```json
{
  "alertType": "congestion",
  "options": [
    {
      "id": "reallocate-3-workers",
      "title": "Reallocate 3 Workers to Zone B",
      "description": "Move 3 workers from Zone C to reduce density and balance workload",
      "confidence": 0.82,
      "steps": [
        {
          "stepNumber": 1,
          "action": "Reassign",
          "target": "Workers W-042, W-043, W-051",
          "from": "Zone-C",
          "to": "Zone-B",
          "duration": "2 min"
        },
        {
          "stepNumber": 2,
          "action": "Adjust task queue",
          "target": "Zone C picking tasks",
          "details": "Reduce active tasks from 52 to 38",
          "duration": "immediate"
        }
      ],
      "impact": {
        "ordersAtRisk": -12,
        "utilizationChange": -0.15,
        "throughputChange": 8,
        "timeToResolve": "8 min",
        "kpiDeltas": [
          { "kpiId": "orders_at_risk", "delta": -12, "unit": "orders" },
          { "kpiId": "labor_utilization", "delta": -15, "unit": "%" }
        ]
      },
      "cost": {
        "laborHours": 1.5,
        "equipmentMoves": 0,
        "estimatedCost": 45
      },
      "affectedEntities": ["W-042", "W-043", "W-051"],
      "affectedZones": ["Zone-C", "Zone-B"],
      "scenarioId": "scenario_congestion_option1"
    },
    {
      "id": "delay-wave-23",
      "title": "Delay Wave 23 by 15 Minutes",
      "description": "Postpone Wave 23 release to allow Zone C to clear current tasks",
      "confidence": 0.75,
      "steps": [
        {
          "stepNumber": 1,
          "action": "Delay wave",
          "target": "Wave 23",
          "details": "Postpone release from 10:00 to 10:15",
          "duration": "15 min"
        },
        {
          "stepNumber": 2,
          "action": "Notify supervisors",
          "target": "Zone C, Zone D",
          "details": "Update task assignments",
          "duration": "immediate"
        }
      ],
      "impact": {
        "ordersAtRisk": -8,
        "utilizationChange": 0,
        "throughputChange": -3,
        "timeToResolve": "15 min",
        "kpiDeltas": [
          { "kpiId": "orders_at_risk", "delta": -8, "unit": "orders" },
          { "kpiId": "throughput", "delta": -3, "unit": "orders/hr" }
        ]
      },
      "cost": {
        "laborHours": 0,
        "equipmentMoves": 0,
        "estimatedCost": 0
      },
      "affectedEntities": [],
      "affectedZones": ["Zone-C"],
      "scenarioId": "scenario_congestion_option2"
    },
    {
      "id": "add-forklift-support",
      "title": "Deploy Forklift FL-03 to Zone C",
      "description": "Reassign idle forklift from receiving dock to support Zone C pallet movement",
      "confidence": 0.68,
      "steps": [
        {
          "stepNumber": 1,
          "action": "Reassign",
          "target": "Forklift FL-03",
          "from": "Dock-1",
          "to": "Zone-C",
          "duration": "3 min"
        },
        {
          "stepNumber": 2,
          "action": "Assign tasks",
          "target": "FL-03",
          "details": "Pallet moves within Zone C",
          "duration": "immediate"
        }
      ],
      "impact": {
        "ordersAtRisk": -5,
        "utilizationChange": -0.08,
        "throughputChange": 4,
        "timeToResolve": "10 min",
        "kpiDeltas": [
          { "kpiId": "orders_at_risk", "delta": -5, "unit": "orders" },
          { "kpiId": "labor_utilization", "delta": -8, "unit": "%" }
        ]
      },
      "cost": {
        "laborHours": 0.5,
        "equipmentMoves": 1,
        "estimatedCost": 25
      },
      "affectedEntities": ["FL-03"],
      "affectedZones": ["Dock-1", "Zone-C"],
      "scenarioId": "scenario_congestion_option3"
    }
  ]
}
```

**Fields:**
- `options`: Array of 2-3 recommendation options
- `steps`: Concrete action steps with targets and durations
- `impact`: Estimated KPI changes and time to resolve
- `cost`: Resource cost (labor, equipment, dollars)
- `scenarioId`: Reference to timeline scenario for execution preview

---

## 8. Plan Variants (JSON)

**File:** `plan_variants_{recommendation_id}.json`

**Purpose:** Pre-computed plan variants for plan tuning (MVP: match constraints to closest variant)

**Schema:**

```json
{
  "baseRecommendationId": "reallocate-3-workers",
  "variants": [
    {
      "variantId": "reallocate-2-workers",
      "description": "Use 2 workers instead of 3",
      "constraints": {
        "workerCount": 2
      },
      "steps": [
        {
          "stepNumber": 1,
          "action": "Reassign",
          "target": "Workers W-042, W-043",
          "from": "Zone-C",
          "to": "Zone-B",
          "duration": "2 min"
        },
        {
          "stepNumber": 2,
          "action": "Adjust task queue",
          "target": "Zone C picking tasks",
          "details": "Reduce active tasks from 52 to 42",
          "duration": "immediate"
        }
      ],
      "impact": {
        "ordersAtRisk": -8,
        "utilizationChange": -0.10,
        "throughputChange": 5,
        "timeToResolve": "10 min",
        "kpiDeltas": [
          { "kpiId": "orders_at_risk", "delta": -8, "unit": "orders" },
          { "kpiId": "labor_utilization", "delta": -10, "unit": "%" }
        ]
      },
      "scenarioId": "scenario_congestion_option1_v2workers"
    },
    {
      "variantId": "reallocate-no-w042",
      "description": "Exclude worker W-042 from reallocation",
      "constraints": {
        "excludeWorkers": ["W-042"]
      },
      "steps": [
        {
          "stepNumber": 1,
          "action": "Reassign",
          "target": "Workers W-043, W-051, W-018",
          "from": "Zone-C",
          "to": "Zone-B",
          "duration": "2 min"
        },
        {
          "stepNumber": 2,
          "action": "Adjust task queue",
          "target": "Zone C picking tasks",
          "details": "Reduce active tasks from 52 to 38",
          "duration": "immediate"
        }
      ],
      "impact": {
        "ordersAtRisk": -10,
        "utilizationChange": -0.12,
        "throughputChange": 7,
        "timeToResolve": "9 min",
        "kpiDeltas": [
          { "kpiId": "orders_at_risk", "delta": -10, "unit": "orders" },
          { "kpiId": "labor_utilization", "delta": -12, "unit": "%" }
        ]
      },
      "scenarioId": "scenario_congestion_option1_no_w042"
    }
  ]
}
```

**Fields:**
- `baseRecommendationId`: Links to parent recommendation
- `variants`: Array of plan variants with different constraints
- `constraints`: Structured constraints applied to this variant
- `scenarioId`: Timeline scenario for this variant

**Constraint Matching (MVP):**
- Parse user input for keywords: "2 workers", "don't move W-042", etc.
- Match to `constraints` object in variants
- Return closest match or indicate no match found

---

## 9. Annotations (JSON)

**File:** `annotations_{session_id}.json`

**Purpose:** Store spatial annotations for shift handover and collaboration

**Schema:**

```json
{
  "sessionId": "session-2026-04-15-shift1",
  "warehouseId": "warehouse-main",
  "createdAt": "2026-04-15T08:00:00Z",
  "updatedAt": "2026-04-15T16:30:00Z",
  "annotations": [
    {
      "id": "ann-001",
      "type": "issue",
      "title": "Congestion Resolved",
      "description": "Moved 3 workers to Zone B as recommended. Cleared in 8 minutes.",
      "createdBy": "John Doe (Supervisor)",
      "createdAt": "2026-04-15T09:55:00Z",
      "location": {
        "zone": "Zone-C",
        "x": 245.0,
        "y": 115.0,
        "z": 0.0
      },
      "timestamp": "2026-04-15T09:47:00Z",
      "relatedAlertId": "congestion-zone-c-001",
      "relatedDecisionId": "decision-001",
      "media": [
        {
          "type": "photo",
          "url": "/uploads/photo-001.jpg",
          "caption": "Zone C at peak congestion"
        }
      ],
      "tags": ["congestion", "resolved", "zone-c"]
    },
    {
      "id": "ann-002",
      "type": "observation",
      "title": "Forklift FL-07 Performance Issue",
      "description": "FL-07 moving slower than usual. Battery at 45%. Recommend charging during next break.",
      "createdBy": "Jane Smith (Operator)",
      "createdAt": "2026-04-15T11:20:00Z",
      "location": {
        "zone": "Zone-B",
        "x": 198.0,
        "y": 75.0,
        "z": 0.0
      },
      "timestamp": "2026-04-15T11:15:00Z",
      "relatedAlertId": null,
      "relatedDecisionId": null,
      "media": [],
      "tags": ["equipment", "maintenance", "forklift"]
    },
    {
      "id": "ann-003",
      "type": "handover",
      "title": "Shift Handover: Dock 2 Issue Ongoing",
      "description": "Dock 2 staging area still at 90% capacity. Watch for next wave. May need to delay if not cleared by 14:00.",
      "createdBy": "John Doe (Supervisor)",
      "createdAt": "2026-04-15T12:00:00Z",
      "location": {
        "zone": "Dock-2",
        "x": 15.0,
        "y": 150.0,
        "z": 0.0
      },
      "timestamp": "2026-04-15T12:00:00Z",
      "relatedAlertId": "delay-dock-2-001",
      "relatedDecisionId": null,
      "media": [],
      "tags": ["handover", "dock", "capacity"]
    }
  ]
}
```

**Fields:**
- `sessionId`: Unique session identifier (per shift or demo run)
- `annotations[]`: Array of annotation objects
- `type`: Annotation category (issue, fix, observation, handover)
- `location`: Spatial anchor (zone + coordinates)
- `timestamp`: Time the annotated event occurred (not creation time)
- `media`: Optional photos/audio
- `tags`: Filterable tags

---

## 10. Demo Script (JSON)

**File:** `demo_script.json`

**Purpose:** Define scripted demo sequence for autoplay mode

**Schema:**

```json
{
  "scriptId": "icon-2026-main-demo",
  "version": "1.0",
  "totalDuration": 600,
  "defaultDataset": "scenario_normal",
  "scenes": [
    {
      "sceneId": "scene-1-glanceable-health",
      "name": "Glanceable Health",
      "duration": 30,
      "description": "Show healthy warehouse with KPI panel",
      "actions": [
        {
          "timestamp": 0,
          "type": "load_dataset",
          "params": {
            "datasetId": "scenario_normal",
            "timestamp": "2026-04-15T08:00:00Z"
          },
          "waitForCompletion": true
        },
        {
          "timestamp": 3,
          "type": "highlight_panel",
          "params": {
            "panel": "kpi"
          },
          "waitForCompletion": false
        },
        {
          "timestamp": 5,
          "type": "camera_tour",
          "params": {
            "waypoints": ["Zone-A", "Zone-B", "Zone-C"],
            "duration": 20,
            "smooth": true
          },
          "waitForCompletion": true
        }
      ],
      "narratorScript": "Warehouse Live gives you instant visibility into your entire operation. The KPI panel shows warehouse health at a glance.",
      "exitCondition": "timer"
    },
    {
      "sceneId": "scene-2-quiet-autonomy",
      "name": "Quiet Autonomy",
      "duration": 45,
      "description": "Activity feed shows auto-handled items",
      "actions": [
        {
          "timestamp": 0,
          "type": "show_activity_feed",
          "params": {
            "feedItems": ["handled-001", "handled-002", "monitoring-001"]
          },
          "waitForCompletion": false
        },
        {
          "timestamp": 10,
          "type": "select_feed_item",
          "params": {
            "itemId": "handled-001"
          },
          "waitForCompletion": false
        },
        {
          "timestamp": 12,
          "type": "open_mini_explain",
          "params": {
            "itemId": "handled-001"
          },
          "waitForCompletion": false
        },
        {
          "timestamp": 25,
          "type": "close_panel",
          "params": {
            "panel": "mini_explain"
          },
          "waitForCompletion": false
        }
      ],
      "narratorScript": "The system continuously monitors operations and automatically handles minor issues. Here, it quietly rebalanced a small queue without human intervention.",
      "exitCondition": "timer"
    },
    {
      "sceneId": "scene-3-proactive-warning",
      "name": "Proactive Warning",
      "duration": 60,
      "description": "Alert fires, camera focuses, explainability shown",
      "actions": [
        {
          "timestamp": 0,
          "type": "advance_timeline",
          "params": {
            "to": "2026-04-15T09:47:00Z"
          },
          "waitForCompletion": true
        },
        {
          "timestamp": 2,
          "type": "trigger_alert",
          "params": {
            "alertId": "congestion-zone-c-001"
          },
          "waitForCompletion": false
        },
        {
          "timestamp": 3,
          "type": "focus_camera",
          "params": {
            "zone": "Zone-C",
            "smooth": true,
            "duration": 2
          },
          "waitForCompletion": true
        },
        {
          "timestamp": 4,
          "type": "activate_overlay",
          "params": {
            "overlayType": "heat_congestion"
          },
          "waitForCompletion": false
        },
        {
          "timestamp": 5,
          "type": "open_panel",
          "params": {
            "panel": "alert",
            "alertId": "congestion-zone-c-001"
          },
          "waitForCompletion": false
        },
        {
          "timestamp": 10,
          "type": "expand_explainability",
          "params": {
            "alertId": "congestion-zone-c-001"
          },
          "waitForCompletion": false
        }
      ],
      "narratorScript": "The system detects a potential bottleneck forming in Zone C before it causes delays. The explainability panel shows exactly why this alert was triggered.",
      "exitCondition": "timer",
      "userInputPrompts": []
    }
  ],
  "resetState": {
    "datasetId": "scenario_normal",
    "timestamp": "2026-04-15T08:00:00Z",
    "cameraPosition": { "x": 150, "y": 100, "z": 200 },
    "panels": [],
    "overlays": []
  }
}
```

**Fields:**
- `scenes[]`: Array of demo scenes in sequence
- `actions[]`: Timed actions within each scene
- `timestamp`: Seconds relative to scene start
- `waitForCompletion`: Whether to block next action until this completes
- `exitCondition`: "timer" (auto-advance) or "user_action" (wait for input)
- `resetState`: State to restore on demo reset

---

## 11. Chat Fallback Responses (JSON)

**File:** `chat_fallback.json`

**Purpose:** Offline chat responses for demo reliability

**Schema:**

```json
{
  "fallbackMode": true,
  "responses": [
    {
      "queryPatterns": [
        "what's happening",
        "what is happening",
        "current status",
        "warehouse status"
      ],
      "response": {
        "text": "The warehouse is currently in **Watch** status. Zone C is experiencing higher-than-normal worker density. An alert has been triggered and recommendations are available.",
        "actionChips": [
          {
            "label": "View Alert",
            "action": "open_panel",
            "params": { "panel": "alert", "alertId": "congestion-zone-c-001" }
          },
          {
            "label": "Show Zone C",
            "action": "focus_camera",
            "params": { "zone": "Zone-C" }
          }
        ]
      },
      "context": {
        "scenarioId": "scenario_congestion",
        "timeRange": ["2026-04-15T09:45:00Z", "2026-04-15T10:00:00Z"]
      }
    },
    {
      "queryPatterns": [
        "why is zone c red",
        "what's wrong with zone c",
        "zone c alert"
      ],
      "response": {
        "text": "Zone C has elevated worker density (0.82 workers/sqft, above the 0.8 threshold). This is causing congestion and may delay 12 orders by approximately 15 minutes.",
        "actionChips": [
          {
            "label": "View Explanation",
            "action": "open_panel",
            "params": { "panel": "explainability", "alertId": "congestion-zone-c-001" }
          },
          {
            "label": "See Options",
            "action": "open_panel",
            "params": { "panel": "recommendations", "alertId": "congestion-zone-c-001" }
          }
        ]
      },
      "context": {
        "scenarioId": "scenario_congestion",
        "timeRange": ["2026-04-15T09:45:00Z", "2026-04-15T10:00:00Z"]
      }
    },
    {
      "queryPatterns": [
        "where is worker",
        "find worker",
        "worker location"
      ],
      "response": {
        "text": "Worker W-042 is currently in Zone C at coordinates (245.5, 112.3), performing a picking task for Order-5678.",
        "actionChips": [
          {
            "label": "Show on Map",
            "action": "focus_entity",
            "params": { "entityId": "W-042" }
          },
          {
            "label": "Worker Details",
            "action": "open_entity_card",
            "params": { "entityId": "W-042" }
          }
        ]
      },
      "context": {
        "scenarioId": "scenario_congestion",
        "timeRange": ["2026-04-15T09:45:00Z", "2026-04-15T10:00:00Z"]
      }
    },
    {
      "queryPatterns": [
        "what are my options",
        "what should i do",
        "recommendations",
        "how do i fix this"
      ],
      "response": {
        "text": "I found 3 options to resolve the Zone C congestion:\n1. **Reallocate 3 Workers** to Zone B (82% confidence, 8 min to resolve)\n2. **Delay Wave 23** by 15 minutes (75% confidence)\n3. **Deploy Forklift FL-03** to support Zone C (68% confidence, 10 min to resolve)\n\nWould you like to see the detailed plan for any of these?",
        "actionChips": [
          {
            "label": "View All Options",
            "action": "open_panel",
            "params": { "panel": "recommendations", "alertId": "congestion-zone-c-001" }
          },
          {
            "label": "Compare Options",
            "action": "open_comparison",
            "params": { "alertId": "congestion-zone-c-001" }
          }
        ]
      },
      "context": {
        "scenarioId": "scenario_congestion",
        "timeRange": ["2026-04-15T09:45:00Z", "2026-04-15T10:00:00Z"]
      }
    }
  ],
  "defaultResponse": {
    "text": "I can help you with that, but I need more context. Try asking:\n- \"What's happening?\"\n- \"Why is Zone C red?\"\n- \"Where is worker W-042?\"\n- \"What are my options?\"",
    "actionChips": []
  }
}
```

**Fields:**
- `queryPatterns`: Array of user input patterns to match (case-insensitive substring match)
- `response`: Canned response with text and action chips
- `context`: Scenario and time range this response applies to
- `actionChips`: Clickable actions that trigger UI changes

**Matching Strategy:**
1. Check if user input contains any `queryPatterns` substring
2. Filter by current scenario and timeline if `context` specified
3. Return matching response or `defaultResponse`

---

## 12. Activity Feed Items (JSON)

**File:** Embedded in timeline or generated on-the-fly

**Purpose:** Define feed items for Monitoring State UI

**Schema:**

```json
{
  "feedItems": [
    {
      "id": "feed-001",
      "state": "Handled",
      "title": "Queue imbalance auto-corrected",
      "description": "Redistributed 8 tasks from Zone A to Zone B",
      "location": "Zone-A",
      "zone": "Zone-A",
      "timestamp": "2026-04-15T08:15:00Z",
      "confidence": 0.92,
      "impactLevel": "low",
      "explanation": {
        "trigger": "Zone A queue length exceeded Zone B by 12 tasks",
        "action": "Reassigned 8 low-priority tasks to Zone B",
        "expectedImpact": "Reduced Zone A queue by 30%, increased utilization balance by 8%",
        "beforeAfter": {
          "before": { "zoneA_queue": 20, "zoneB_queue": 8 },
          "after": { "zoneA_queue": 12, "zoneB_queue": 16 }
        }
      },
      "affectedEntities": ["W-018", "W-021"],
      "relatedKPIs": ["labor_utilization", "throughput"]
    },
    {
      "id": "feed-002",
      "state": "Monitoring",
      "title": "Dock 2 utilization elevated",
      "description": "Dock 2 at 87% capacity, watching for further increases",
      "location": "Dock-2",
      "zone": "Dock-2",
      "timestamp": "2026-04-15T08:45:00Z",
      "confidence": 0.78,
      "impactLevel": "medium",
      "explanation": {
        "trigger": "Dock utilization crossed 85% watch threshold",
        "action": "Monitoring for next 15 minutes; will escalate if exceeds 95%",
        "expectedImpact": "No immediate action needed",
        "thresholds": {
          "watch": 0.85,
          "critical": 0.95,
          "current": 0.87
        }
      },
      "affectedEntities": ["PLT-5501", "PLT-5502"],
      "relatedKPIs": ["dock_utilization"]
    },
    {
      "id": "feed-003",
      "state": "NeedsAttention",
      "title": "Potential bottleneck in Zone C",
      "description": "High worker density detected, may delay orders",
      "location": "Zone-C",
      "zone": "Zone-C",
      "timestamp": "2026-04-15T09:47:00Z",
      "confidence": 0.85,
      "impactLevel": "high",
      "explanation": null,
      "affectedEntities": ["W-042", "W-043", "W-051", "W-018"],
      "relatedKPIs": ["orders_at_risk", "labor_utilization"],
      "alertId": "congestion-zone-c-001"
    }
  ]
}
```

**Fields:**
- `state`: "Handled" | "Monitoring" | "NeedsAttention"
- `impactLevel`: Severity (low/medium/high)
- `explanation`: Why and what was done (for "Handled" items)
- `alertId`: Link to full alert (for "NeedsAttention" items)

---

## Summary of File Formats

| File | Format | Purpose | Required for MVP |
|------|--------|---------|------------------|
| `warehouse_layout.csv` | CSV | Define warehouse structure | Yes |
| `warehouse_state.csv` | CSV | Single-time snapshot | Yes |
| `warehouse_timeline_{scenario}.csv` | CSV | Time-series data for scenarios | Yes |
| `alerts.csv` | CSV | Pre-computed alerts per scenario | Yes |
| `kpi_config.json` | JSON | KPI definitions and thresholds | Yes |
| `explainability_templates.json` | JSON | Alert explanation templates | Yes |
| `recommendations_{alert_type}.json` | JSON | Pre-computed recommendation options | Yes |
| `plan_variants_{rec_id}.json` | JSON | Plan tuning variants | Yes |
| `annotations_{session_id}.json` | JSON | Shift handover notes | Yes |
| `demo_script.json` | JSON | Scripted demo sequence | Yes |
| `chat_fallback.json` | JSON | Offline chat responses | Yes |
| `activity_feed.json` | JSON | Monitoring feed items | Yes (can be embedded in timeline) |

---

## Sample Dataset Requirements for ICON

**Minimum 3 Complete Scenarios:**

1. **scenario_normal** - Healthy operations
   - All KPIs in "Normal" range
   - No alerts
   - Activity feed shows 2-3 "Handled" items
   - Timeline: 30 minutes

2. **scenario_congestion** - Zone C bottleneck
   - Alert: congestion-zone-c-001
   - KPIs: Orders at Risk (high), Labor Utilization (critical in Zone C)
   - 3 recommendation options
   - Timeline: 60 minutes (includes alert, intervention, resolution)

3. **scenario_dock_delay** - Dock 2 capacity issue
   - Alert: delay-dock-2-001
   - KPIs: Dock Utilization (critical)
   - 2 recommendation options
   - Timeline: 45 minutes

**Each Scenario Includes:**
- `warehouse_timeline_{scenario_id}.csv`
- Corresponding rows in `alerts.csv`
- Recommendation JSON files
- At least 1-2 plan variants per recommendation

---

## Validation & Testing

**CSV Validator Requirements:**
- Check required columns present
- Validate data types (numbers, dates, JSON)
- Check coordinate bounds (within warehouse layout)
- Verify entity_id uniqueness within snapshot
- Validate zone references (exist in layout)
- Check timestamp ordering (ascending)

**JSON Schema Validation:**
- All JSON files should have strict schemas
- Use JSON Schema Draft 7 for validation
- Provide clear error messages for violations

**Sample Template Downloads:**
- Include 1-row example for each CSV
- Include annotated JSON templates
- Provide README with field descriptions

---

**End of Data Contracts Document**
