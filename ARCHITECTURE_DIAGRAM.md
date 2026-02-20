# Live Wip - System Architecture Documentation
### Warehouse Operations Intelligence Platform
**Version:** 1.0 (Phases 1-3 Complete, Phase 4 In Progress)  
**Date:** February 17, 2026  
**Status:** Ready for Production Implementation

---

## Executive Summary

**Live Wip** is an AI-powered 3D warehouse operations intelligence platform that combines real-time spatial visualization with autonomous decision-making. The system uses a multi-agent AI architecture to monitor equipment, inventory, safety, labor, and slotting efficiency—automatically detecting issues, generating recommendations, and executing low-risk actions autonomously while requiring approval for high-impact decisions.

**Key Capabilities:**
- 🎯 Real-time 3D warehouse visualization with 60 FPS performance
- 🤖 Multi-agent AI system with 5 specialized domain agents
- ⚡ Autonomous action execution with safety gestation periods
- 📊 Three visualization modes for spatial analytics (gradient, column, particle)
- 💬 Natural language conversational interface
- 🔍 Explainable AI with full decision provenance
- 📈 Outcome tracking and continuous learning

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [AI Agent System](#ai-agent-system)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Technology Stack](#technology-stack)
7. [Key Features by Phase](#key-features-by-phase)
8. [Deployment Architecture](#deployment-architecture)
9. [Performance & Scalability](#performance--scalability)
10. [Security Considerations](#security-considerations)

---

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  USER LAYER                                      │
│                                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ Command    │  │ 3D Scene   │  │  KPI       │  │  Control   │              │
│  │ Bar        │  │ Viewer     │  │  Panels    │  │  Panels    │              │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘              │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────────────────────┐
│                       FRONTEND LAYER (React + Three.js)                          │
│                                   │                                              │
│  ┌────────────────────────────────▼───────────────────────────────────────┐    │
│  │                    State Management (Zustand)                            │    │
│  │  • Entities • Zones • KPIs • Alerts • Camera • Agent History            │    │
│  └────────────────────────────────┬───────────────────────────────────────┘    │
│                                   │                                              │
│  ┌───────────────────┬────────────┼────────────┬──────────────────────────┐    │
│  │ DataService       │ KPIService │ CameraCmd  │ KPISimulation            │    │
│  │ (CSV Loading)     │ (Spatial)  │ (Control)  │ (Real-time)              │    │
│  └───────────────────┴────────────┴────────────┴──────────────────────────┘    │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │ REST API (HTTP/JSON)
┌──────────────────────────────────┼──────────────────────────────────────────────┐
│                       BACKEND LAYER (Express.js)                                 │
│                                   │                                              │
│  ┌────────────────────────────────▼───────────────────────────────────────┐    │
│  │                         API Routes Layer                                 │    │
│  │  /api/agent/*  |  /api/kpi/*  |  /api/alerts/*  |  /api/outcomes/*     │    │
│  └────────────────────────────────┬───────────────────────────────────────┘    │
│                                   │                                              │
│  ┌────────────────────────────────▼───────────────────────────────────────┐    │
│  │                          OpsAgent (Orchestrator)                         │    │
│  │           Intent Classification → Delegation → Synthesis                 │    │
│  └────────────┬───────────────────────────────────────────┬────────────────┘    │
│               │                                           │                      │
│  ┌────────────▼──────────────┐         ┌─────────────────▼──────────────┐      │
│  │   Specialist Sub-Agents   │         │   Phase 3 Services             │      │
│  │  • MaintenanceAgent       │         │  • Alert Detection             │      │
│  │  • InventoryAgent         │         │  • Recommendation Engine       │      │
│  │  • SlottingAgent          │         │  • Autonomy Framework          │      │
│  │  • SafetyAgent            │         │  • Gestation Manager           │      │
│  │  • LaborAgent             │         │  • Explainability Service      │      │
│  └───────────────────────────┘         │  • Outcome Tracker             │      │
│                                        │  • KPI Analytics Service       │      │
│                                        └────────────┬───────────────────┘      │
│                                                     │                           │
│  ┌──────────────────────────────────────────────────▼────────────────────┐    │
│  │                      LLM Service (OpenAI GPT-4)                         │    │
│  │            Intent Classification | Response Synthesis                   │    │
│  │            Function Calling | Context Building                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────────────────────┐
│                            DATA LAYER                                            │
│                                       │                                          │
│  ┌────────────────────┐  ┌───────────▼──────────┐  ┌────────────────────────┐ │
│  │  CSV Datasets      │  │  JSON Data           │  │  Future: Database      │ │
│  │  • Layout          │  │  • KPI Snapshots     │  │  • PostgreSQL/SQLite   │ │
│  │  • State           │  │  • Overlay Configs   │  │  • Persistence         │ │
│  │  • Inventory       │  │  • Heat Map Data     │  │  • Historical Data     │ │
│  └────────────────────┘  └──────────────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Component Hierarchy

```
App.tsx
│
├── TopNavBar.tsx ────────────────┐ (Navigation, Profile, Notifications)
├── LeftSidebar.tsx ──────────────┤ (Context Panels)
├── ObjectiveBar.tsx ─────────────┤ (Mission Objectives)
├── KPITicker.tsx ────────────────┤ (Scrolling Metrics)
│                                 │
├── WarehouseScene.tsx ───────────┤ (Main 3D Canvas)
│   ├── WarehouseLayout.tsx ──────┤   • Zones, Aisles, Racks, Docks
│   ├── EntityRenderer.tsx ───────┤   • Workers, Forklifts, Robots, Pallets
│   ├── RackInventory.tsx ────────┤   • Inventory Visualization
│   ├── OverlayRenderer.tsx ──────┤   • Heat Map System
│   │   ├── ZoneHeatOverlay.tsx ──┤     - Gradient Mode
│   │   ├── ColumnHeatMap.tsx ────┤     - 3D Column Mode
│   │   └── ParticleHeatMap.tsx ──┤     - Particle Cloud Mode
│   ├── SelectionRing.tsx ────────┤   • Entity Selection
│   ├── ZoneHighlighter.tsx ──────┤   • Zone Highlighting
│   └── ContactShadow.tsx ────────┤   • Realistic Shadows
│                                 │
├── CommandBarContainer.tsx ──────┤ (AI Interface Container)
│   ├── CommandBar.tsx ───────────┤   • User Input
│   ├── ResponseBubble.tsx ───────┤   • Agent Responses
│   ├── SuggestionChip.tsx ───────┤   • Context Suggestions
│   ├── AgentAvatar.tsx ──────────┤   • Visual Indicator
│   └── ActionFlow.tsx ───────────┤   • Progressive Reveal
│       ├── Signals ──────────────┤     - Issue Detection
│       ├── Context ──────────────┤     - Data Analysis
│       ├── Intent ───────────────┤     - Decision Reasoning
│       └── Actions ──────────────┤     - Executable Steps
│                                 │
├── Panels ───────────────────────┤
│   ├── KPIPanel.tsx ─────────────┤   • Real-time KPIs (clickable)
│   ├── EntityDetailPanel.tsx ────┤   • Entity Inspector
│   ├── DrillDownPanel.tsx ───────┤   • Deep Analytics
│   └── HierarchyPanel.tsx ───────┤   • Task/Alert/Resource Trees
│       ├── AlertHierarchy.tsx ───┤
│       ├── TaskHierarchy.tsx ────┤
│       ├── ResourceHierarchy.tsx ┤
│       └── InventoryHierarchy.tsx┤
│                                 │
└── Controls ─────────────────────┤
    ├── DatasetSelector.tsx ──────┤   • Scenario Switching
    ├── HeatMapControls.tsx ──────┤   • Visualization Mode
    ├── EntityFilterControl.tsx ──┤   • Entity Filtering
    ├── CameraViewSwitcher.tsx ───┤   • Camera Presets
    ├── ViewGizmo.tsx ────────────┤   • 3D Orientation
    ├── ThemeToggle.tsx ──────────┤   • Light/Dark Mode
    └── ResetButton.tsx ──────────┘   • Reset View
```

### State Management (Zustand Store)

```typescript
AppState {
  // Entity Management
  entities: Entity[]                    // Workers, forklifts, robots, pallets
  selectedEntity: Entity | null         // Currently selected entity
  entityFilter: EntityFilter            // Filter configuration
  
  // Zone Management
  zones: Zone[]                         // Storage, picking, shipping zones
  selectedZones: string[]               // Multi-select zones
  zoneHighlights: Map<string, Color>    // Dynamic highlighting
  
  // KPI Management
  kpis: KPI[]                           // Real-time metrics
  selectedKPI: KPI | null               // Active KPI analysis
  kpiSpatialContext: SpatialContext     // Spatial analysis results
  
  // Camera Management
  cameraPosition: Vector3               // Current position
  cameraTarget: Vector3                 // Look-at target
  cameraPreset: CameraPreset            // Active preset
  
  // Heat Map / Overlay
  overlayMode: 'gradient' | 'column' | 'particle'
  overlayIntensityData: Map<string, number>
  heatMapIntensity: number              // 0.3 - 1.0
  particleAnimation: boolean            // Enable/disable
  
  // Agent System
  conversationHistory: Message[]        // Chat history
  isProcessing: boolean                 // Agent thinking state
  currentIntent: Intent | null          // Classified intent
  actionFlow: ActionFlow | null         // Progressive reveal data
  
  // Alerts & Recommendations
  alerts: Alert[]                       // Active alerts
  recommendations: Recommendation[]     // Agent suggestions
  gestatingActions: GestatingAction[]   // Countdown timers
  
  // UI State
  leftSidebarOpen: boolean
  activePanel: 'kpi' | 'entity' | 'drilldown' | 'hierarchy'
  theme: 'light' | 'dark'
  scenario: 'normal' | 'congestion' | 'dock_delay'
}
```

### Frontend Services

```
┌──────────────────────────────────────────────────────────────┐
│                      DataService.ts                           │
│  • Load CSV datasets (warehouse_layout, warehouse_state)     │
│  • Parse with PapaParse (Web Worker)                         │
│  • Validate schema                                           │
│  • Coordinate mapping                                        │
│  • Offline-first architecture                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      KPIService.ts                            │
│  • analyzeKPISpatialContext() → Backend API                  │
│  • getKPIRecommendations() → Backend API                     │
│  • buildWarehouseStatePayload() → Context builder            │
│  • Category extraction from KPI labels                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  CameraCommandService.ts                      │
│  • flyToZone(zoneId) → GSAP animation                        │
│  • focusOnEntity(entityId) → Smooth transition               │
│  • goToOverview() → Reset to default view                    │
│  • applyPreset(preset) → Top-down, bird's eye, custom       │
│  • focusOnKPIContext(spatialContext) → Multi-zone framing   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  KPISimulationService.ts                      │
│  • Real-time KPI updates                                     │
│  • Realistic variation simulation                            │
│  • Scenario-based value generation                           │
│  • Threshold breach detection                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            OpsAgent (Master Orchestrator)                    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Core Responsibilities:                                             │    │
│  │  1. Receive user query + warehouse context                          │    │
│  │  2. Classify intent via LLM (navigation, status, issue, briefing)  │    │
│  │  3. Select relevant sub-agents based on intent                      │    │
│  │  4. Delegate to sub-agents in parallel                              │    │
│  │  5. Collect & synthesize sub-agent analyses                         │    │
│  │  6. Generate unified response via LLM                               │    │
│  │  7. Extract function calls (camera, UI actions)                     │    │
│  │  8. Return response + actions + suggestions                         │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Key Methods:                                                                │
│  • processIntent(message, context) → AgentResponse                          │
│  • getShiftBriefing(context) → ComprehensiveSummary                         │
│  • selectRelevantAgents(intent) → SubAgent[]                                │
│  • delegateToSubAgents(intent, context) → AnalysisMap                       │
│  • synthesizeResponse(analyses, context) → LLMResponse                      │
│  • determineActions(intent, functionCall) → Action[]                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Specialist Sub-Agents

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MaintenanceAgent.ts                                                         │
│  Domain: Equipment health, battery levels, breakdowns                        │
│  ──────────────────────────────────────────────────────────────────────     │
│  Keywords: equipment, robot, maintenance, breakdown, battery, repair         │
│                                                                              │
│  Analysis Logic:                                                             │
│  • Detect low battery entities (< 20%)                                      │
│  • Identify equipment in error/maintenance status                           │
│  • Calculate uptime metrics                                                 │
│  • Generate charging rotation recommendations                               │
│                                                                              │
│  Data Sources: context.entities (robots, forklifts)                         │
│  Actions: Route to charging, dispatch maintenance team                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  InventoryAgent.ts                                                           │
│  Domain: Stock levels, replenishment, turnover                               │
│  ──────────────────────────────────────────────────────────────────────     │
│  Keywords: inventory, stock, sku, replenishment, stockout, overstock         │
│                                                                              │
│  Analysis Logic:                                                             │
│  • Detect low stock items (< 10% threshold)                                 │
│  • Identify overstock situations (> 90% capacity)                           │
│  • Calculate inventory turnover rate                                        │
│  • Generate replenishment recommendations                                   │
│                                                                              │
│  Data Sources: context.entities (pallets), context.zones (capacity)         │
│  Actions: Trigger replenishment orders, redistribute inventory              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  SlottingAgent.ts                                                            │
│  Domain: Storage optimization, pick path efficiency                          │
│  ──────────────────────────────────────────────────────────────────────     │
│  Keywords: slotting, pick path, optimization, layout, efficiency             │
│                                                                              │
│  Analysis Logic:                                                             │
│  • Analyze pick path efficiency                                             │
│  • Identify suboptimal storage locations                                    │
│  • Calculate travel distance metrics                                        │
│  • Recommend re-slotting for high-velocity items                            │
│                                                                              │
│  Data Sources: context.entities (paths), context.metrics (pick efficiency)  │
│  Actions: Initiate re-slotting operations                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  SafetyAgent.ts                                                              │
│  Domain: Safety hazards, compliance, incident prevention                     │
│  ──────────────────────────────────────────────────────────────────────     │
│  Keywords: safety, hazard, compliance, incident, congestion, collision       │
│                                                                              │
│  Analysis Logic:                                                             │
│  • Detect congestion zones (> 5 entities in small area)                     │
│  • Identify near-miss collision risks                                       │
│  • Monitor safety compliance metrics                                        │
│  • Generate hazard mitigation recommendations                               │
│                                                                              │
│  Data Sources: context.entities (proximity), context.zones (congestion)     │
│  Actions: Trigger safety protocols, clear congestion                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  LaborAgent.ts                                                               │
│  Domain: Worker allocation, productivity, scheduling                         │
│  ──────────────────────────────────────────────────────────────────────     │
│  Keywords: labor, worker, productivity, allocation, shift, utilization       │
│                                                                              │
│  Analysis Logic:                                                             │
│  • Calculate worker utilization rates                                       │
│  • Identify understaffed/overstaffed zones                                  │
│  • Monitor productivity metrics                                             │
│  • Generate reallocation recommendations                                    │
│                                                                              │
│  Data Sources: context.entities (workers), context.zones (staffing)         │
│  Actions: Reassign workers, adjust schedules                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 3 Services (Autonomous Action Pipeline)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. Alert Detection Service                                                  │
│  ────────────────────────────────────────────────────────────────────────   │
│  Input: Sub-agent analyses                                                   │
│  Output: Classified alerts with explainability                              │
│                                                                              │
│  Pipeline:                                                                   │
│  [Extract Issues] → [Deduplicate] → [Classify Severity] → [Build Context]  │
│                                                                              │
│  Severity Levels: CRITICAL | HIGH | MEDIUM | LOW                            │
│  Impact Score Calculation: 0.0 - 1.0 based on affected entities             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  2. Recommendation Engine                                                    │
│  ────────────────────────────────────────────────────────────────────────   │
│  Input: Alert                                                                │
│  Output: Recommendations with impact analysis                               │
│                                                                              │
│  Pipeline:                                                                   │
│  [Generate Primary] → [Calculate Impact] → [Generate Alternatives]          │
│                                                                              │
│  Impact Metrics: Before/After KPIs, Cost, Time, Resource changes            │
│  Confidence Scores: 0.0 - 1.0 based on data quality & historical accuracy   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  3. Autonomy Framework                                                       │
│  ────────────────────────────────────────────────────────────────────────   │
│  Input: Recommendation                                                       │
│  Output: Classified action with execution tier                              │
│                                                                              │
│  Impact Score Calculation (weighted):                                        │
│  • Affected entity count (30%)                                              │
│  • Operational criticality (30%)                                            │
│  • Reversibility (20%)                                                      │
│  • Cost implication (20%)                                                   │
│                                                                              │
│  Autonomy Tier Matrix:                                                       │
│                                                                              │
│               │  Low Impact    Medium Impact    High Impact                 │
│  ─────────────┼─────────────────────────────────────────────────           │
│  High Conf    │  🟢 AUTOMATED   🟡 SEMI-AUTO    🟡 SEMI-AUTO               │
│  (0.8-1.0)    │  10s gestation  45s gestation   45s gestation              │
│  ─────────────┼─────────────────────────────────────────────────           │
│  Medium Conf  │  🟢 AUTOMATED   🟡 SEMI-AUTO    🔴 ASSISTED                │
│  (0.5-0.8)    │  10s gestation  45s gestation   Needs approval             │
│  ─────────────┼─────────────────────────────────────────────────           │
│  Low Conf     │  🔴 ASSISTED    🔴 ASSISTED     🔴 ASSISTED                │
│  (0.0-0.5)    │  Needs approval Needs approval  Needs approval             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  4. Gestation Manager                                                        │
│  ────────────────────────────────────────────────────────────────────────   │
│  Input: Classified action (Automated or Semi-Automated)                     │
│  Output: Executed action or user objection                                  │
│                                                                              │
│  Pipeline:                                                                   │
│  [Queue Action] → [Start Countdown] → [Emit Events] → [Execute or Object]  │
│                                                                              │
│  Countdown Timers:                                                           │
│  • Automated: 10 seconds                                                    │
│  • Semi-Automated: 45 seconds                                               │
│                                                                              │
│  User can object during countdown to prevent execution                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  5. Explainability Service                                                   │
│  ────────────────────────────────────────────────────────────────────────   │
│  Provides transparent decision-making trails:                                │
│  • Data sources used (which sub-agent, which metrics)                       │
│  • Reasoning steps (why this recommendation)                                │
│  • Confidence breakdown (what factors influenced score)                     │
│  • Alternative scenarios (what if we did X instead)                         │
│  • Historical context (similar past decisions)                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  6. Outcome Tracker                                                          │
│  ────────────────────────────────────────────────────────────────────────   │
│  Continuous learning from action results:                                    │
│  • Record promised metrics (expected outcomes)                              │
│  • Monitor actual results (post-action measurements)                        │
│  • Calculate accuracy (promised vs achieved)                                │
│  • Update statistics by category (maintenance, inventory, etc.)             │
│  • Feed into confidence scoring for future recommendations                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  7. KPI Analytics Service                                                    │
│  ────────────────────────────────────────────────────────────────────────   │
│  KPI spatial context analysis:                                               │
│  • Identify affected zones (congestion, utilization, throughput, safety)    │
│  • Calculate intensity values for heat maps                                 │
│  • Select optimal visualization mode (gradient/column/particle)             │
│  • Compute camera target for auto-focus                                     │
│  • Generate KPI-specific recommendations                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## AI Agent System

### Multi-Agent Orchestration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      User Query Processing Flow                              │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: User Input
┌──────────────────┐
│ User types query │
│ in CommandBar    │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Frontend gathers context:        │
│ • Current entities               │
│ • Zone states                    │
│ • Active KPIs                    │
│ • Recent alerts                  │
└────────┬─────────────────────────┘
         │
         ▼ POST /api/agent/query
┌──────────────────────────────────┐
│ Backend receives:                │
│ { message, context }             │
└────────┬─────────────────────────┘
         │
         ▼

Step 2: Rule Engine Fast Path
┌──────────────────────────────────┐
│ Rule Engine checks patterns      │
└────────┬─────────────────────────┘
         │
    ┌────┴──────┐
    │           │
    ▼ Match     ▼ No Match
┌─────────┐  ┌──────────────┐
│ Quick   │  │ Delegate to  │
│ Response│  │ OpsAgent     │
└─────────┘  └──────┬───────┘
    │               │
    │               ▼
    │        Step 3: Intent Classification
    │        ┌──────────────────────────────────┐
    │        │ LLM Service classifies intent:   │
    │        │ • Category: navigation, status,  │
    │        │   issue, action, briefing        │
    │        │ • Target: zone/entity/system     │
    │        │ • Urgency: low/medium/high       │
    │        │ • Confidence: 0.0-1.0            │
    │        └──────┬───────────────────────────┘
    │               │
    │               ▼
    │        Step 4: Sub-Agent Selection
    │        ┌──────────────────────────────────┐
    │        │ OpsAgent selects relevant agents │
    │        │ based on intent keywords:        │
    │        │ • Briefing → ALL agents          │
    │        │ • Battery → Maintenance          │
    │        │ • Stock → Inventory              │
    │        │ • Hazard → Safety                │
    │        │ • Workers → Labor                │
    │        │ • Layout → Slotting              │
    │        └──────┬───────────────────────────┘
    │               │
    │               ▼
    │        Step 5: Parallel Delegation
    │        ┌──────────────────────────────────────────────┐
    │        │ Promise.all([                                │
    │        │   maintenanceAgent.analyze(context),         │
    │        │   inventoryAgent.analyze(context),           │
    │        │   slottingAgent.analyze(context),            │
    │        │   safetyAgent.analyze(context),              │
    │        │   laborAgent.analyze(context)                │
    │        │ ])                                           │
    │        └──────┬───────────────────────────────────────┘
    │               │
    │               ▼
    │        Step 6: Sub-Agent Analysis
    │        ┌─────────────────────────┐
    │        │ Each agent returns:     │
    │        │ • Issues detected       │
    │        │ • Metrics calculated    │
    │        │ • Recommendations       │
    │        │ • Confidence scores     │
    │        └──────┬──────────────────┘
    │               │
    │               ▼
    │        Step 7: Response Synthesis
    │        ┌──────────────────────────────────┐
    │        │ LLM synthesizes unified response │
    │        │ from all sub-agent analyses      │
    │        │ + generates function calls       │
    │        └──────┬───────────────────────────┘
    │               │
    │               ▼
    │        Step 8: Action Determination
    │        ┌──────────────────────────────────┐
    │        │ Extract actions from function    │
    │        │ calls:                           │
    │        │ • flyToZone(zoneId)              │
    │        │ • focusOnEntity(entityId)        │
    │        │ • showHeatMap(type)              │
    │        │ • showAlert(message)             │
    │        └──────┬───────────────────────────┘
    │               │
    └───────────────┴────────────────────────────┐
                                                 │
                                                 ▼
Step 9: Return to Frontend
┌──────────────────────────────────────────────────────┐
│ Response object:                                     │
│ {                                                    │
│   message: "Unified response text",                  │
│   actions: [                                         │
│     { type: 'camera', target: 'zone-a' },           │
│     { type: 'alert', severity: 'high', ... }        │
│   ],                                                 │
│   suggestions: [                                     │
│     "Check Zone B inventory",                        │
│     "Review safety protocols"                        │
│   ],                                                 │
│   actionFlow: {                                      │
│     signals: ["Low battery on R-042", ...],         │
│     context: { ... },                                │
│     intent: "Maintenance intervention",              │
│     actions: [ ... ]                                 │
│   },                                                 │
│   source: 'llm' | 'rule'                            │
│ }                                                    │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
Step 10: Frontend Execution
┌──────────────────────────────────────────────────────┐
│ • Render response in CommandBar                      │
│ • Display ActionFlow UI (progressive reveal)         │
│ • Execute camera actions (GSAP animations)           │
│ • Show alerts/notifications                          │
│ • Display context-aware suggestions                  │
└──────────────────────────────────────────────────────┘
```

### Autonomous Action Pipeline (Phase 3)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           From Issue Detection to Autonomous Execution                       │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: Issue Detection (during sub-agent analysis)
┌──────────────────────────────────────────────────────┐
│ Sub-agents detect issues:                            │
│ • Maintenance: "R-042 battery at 12%"                │
│ • Safety: "Zone A congestion (7 entities)"           │
│ • Inventory: "SKU-1234 stock at 8%"                  │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
Step 2: Alert Detection Service
┌──────────────────────────────────────────────────────┐
│ Extract & classify issues:                           │
│ • Deduplicate similar issues                         │
│ • Classify severity (critical/high/medium/low)       │
│ • Calculate impact score (0.0-1.0)                   │
│ • Build explainability context                       │
└──────┬───────────────────────────────────────────────┘
       │
       ▼ For each alert
Step 3: Recommendation Engine
┌──────────────────────────────────────────────────────┐
│ Generate recommendations:                            │
│ • Primary action (e.g., "Route R-042 to charging")  │
│ • Impact analysis:                                   │
│   - Before: 12% battery, 15min to shutdown           │
│   - After: 100% battery, 8hr runtime                 │
│ • Alternative approaches (battery swap vs charge)    │
│ • Confidence score: 0.85                             │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
Step 4: Autonomy Framework
┌──────────────────────────────────────────────────────┐
│ Calculate impact score (0.0-1.0):                    │
│ • Affected entities: 1 robot = 0.2                   │
│ • Operational criticality: picking = 0.7             │
│ • Reversibility: can recall = 0.9                    │
│ • Cost: charging = 0.1                               │
│ → Impact Score = 0.35 (LOW)                          │
│                                                      │
│ Confidence: 0.85 (HIGH)                              │
│                                                      │
│ Matrix Lookup: HIGH confidence + LOW impact          │
│ → Tier: 🟢 AUTOMATED                                 │
│ → Gestation: 10 seconds                              │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
Step 5a: Automated/Semi-Automated → Gestation Manager
┌──────────────────────────────────────────────────────┐
│ Queue action with countdown:                         │
│ • Start 10-second timer                              │
│ • Emit events to frontend (every 1s)                 │
│ • Display countdown UI                               │
│ • Allow user objection (cancel button)               │
└──────┬───────────────────────────────────────────────┘
       │
       ▼ Timer expires & no objection
Step 6: Action Execution
┌──────────────────────────────────────────────────────┐
│ Execute validated action:                            │
│ • Camera: flyToEntity('R-042')                       │
│ • Notify: "R-042 routing to Charging Station 3"     │
│ • Dispatch: Send route command to robot              │
│ • Log: Record action in activity feed                │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
Step 7: Outcome Tracker
┌──────────────────────────────────────────────────────┐
│ Monitor results:                                     │
│ • Promised: Robot reaches charging in 2 min          │
│ • Actual: Robot reached charging in 1.8 min ✓        │
│ • Accuracy: 90% (better than promised)               │
│ • Update confidence model for future maintenance     │
│   recommendations                                    │
└──────────────────────────────────────────────────────┘

Step 5b: Assisted → Requires User Approval
┌──────────────────────────────────────────────────────┐
│ Display recommendation card:                         │
│ • Show issue + recommendation                        │
│ • Display impact analysis                            │
│ • Show explainability (why this suggestion)          │
│ • Provide "Approve" / "Dismiss" buttons              │
│ • User must explicitly approve                       │
└──────────────────────────────────────────────────────┘
       │
       ▼ User approves
       └─────→ Jump to Step 6: Action Execution
```

---

## Data Flow Diagrams

### Flow 1: KPI Click → Spatial Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  KPI-Driven Heat Map Activation Flow                         │
└─────────────────────────────────────────────────────────────────────────────┘

1. User clicks KPI card (e.g., "Zone B Congestion: 78%")
   ↓
2. KPIPanel.handleKPIClick()
   • Set loading state
   • Highlight active KPI
   ↓
3. KPIService.analyzeKPISpatialContext(kpi, warehouseState)
   • Build payload from store (entities, zones, metrics)
   • Extract KPI category from label
   ↓
4. POST /api/kpi/spatial-context
   {
     kpi: { id, category, value, label },
     warehouseState: { zones, entities }
   }
   ↓
5. KPIAnalyticsService.analyzeSpatialContext()
   • Identify affected zones based on category:
     - Congestion → zones with high entity density
     - Utilization → zones above/below threshold
     - Throughput → zones with flow issues
     - Safety → zones with hazards
   • Calculate intensity per zone (0.0-1.0)
   • Select visualization mode:
     - High variance → Column mode
     - Multiple zones → Gradient mode
     - Dense data → Particle mode
   • Calculate camera target (center of affected zones)
   • Generate recommendations via LLM
   ↓
6. Response returned:
   {
     primaryZones: ['zone-b', 'zone-c'],
     overlayType: 'congestion',
     visualizationMode: 'column',
     cameraTarget: { x, y, z, lookAt },
     intensityData: { 'zone-b': 0.8, 'zone-c': 0.6 },
     recommendations: [...]
   }
   ↓
7. store.selectKPIWithSpatialContext(kpi, spatialContext)
   • Update state with spatial context
   • Set overlay intensity data
   • Set heat map mode
   ↓
8. Parallel UI updates (React re-render):
   
   ┌─────────────────────────────────┐
   │ OverlayRenderer.tsx             │
   │ • Switch mode (gradient/column/ │
   │   particle)                     │
   │ • Render with intensity data    │
   │ • Animate mode transition       │
   └─────────────────────────────────┘
   
   ┌─────────────────────────────────┐
   │ CameraCommandService            │
   │ • flyToZone() with target       │
   │ • GSAP smooth animation         │
   │ • Multi-zone framing            │
   └─────────────────────────────────┘
   
   ┌─────────────────────────────────┐
   │ OverlayLegend.tsx               │
   │ • Update title with KPI label   │
   │ • Show mode selector            │
   │ • Enable intensity slider       │
   └─────────────────────────────────┘
   
   ┌─────────────────────────────────┐
   │ KPIPanel.tsx                    │
   │ • Highlight active KPI card     │
   │ • Clear loading state           │
   └─────────────────────────────────┘
```

### Flow 2: Dataset Switching

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Scenario Switching Flow                                │
└─────────────────────────────────────────────────────────────────────────────┘

1. User selects scenario in DatasetSelector
   (normal / congestion / dock_delay)
   ↓
2. store.setScenario(scenario)
   ↓
3. DataService.loadDataset(scenario)
   ↓
4. Parallel CSV loading:
   ┌─────────────────────────────────────────────┐
   │ Load CSV files (Web Worker):                │
   │ • warehouse_layout.csv                      │
   │ • warehouse_state.csv                       │
   │ • inventory_boxes.csv                       │
   │ • inventory_items.csv                       │
   └─────────────────┬───────────────────────────┘
                     │ PapaParse
                     ▼
   ┌─────────────────────────────────────────────┐
   │ Validate schema:                            │
   │ • Check required columns                    │
   │ • Type validation                           │
   │ • Coordinate mapping                        │
   └─────────────────┬───────────────────────────┘
                     │
                     ▼
5. Update Zustand store:
   • store.setEntities(entities)
   • store.setZones(zones)
   • store.setInventory(inventory)
   ↓
6. Load scenario-specific JSON:
   • kpi_snapshot_scenario_*.json → store.setKPIs()
   • overlay_data_scenario_*.json → store.setOverlayData()
   ↓
7. React re-render:
   ┌─────────────────────────────────────────────┐
   │ WarehouseScene.tsx                          │
   │ • Re-render layout with new zones           │
   │ • Re-render entities with new positions     │
   │ • GSAP fade transition (opacity 0→1)        │
   └─────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────┐
   │ KPIPanel.tsx                                │
   │ • Update KPI cards with new values          │
   │ • Animate number transitions                │
   └─────────────────────────────────────────────┘
   
   ┌─────────────────────────────────────────────┐
   │ OverlayRenderer.tsx                         │
   │ • Update heat map with new data             │
   │ • Smooth color interpolation                │
   └─────────────────────────────────────────────┘
```

### Flow 3: Real-Time Entity Updates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Real-Time Simulation Flow                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Every 2 seconds (configurable):

1. KPISimulationService.tick()
   ↓
2. Update KPI values with realistic variation:
   • Utilization: ±5% random walk
   • Productivity: ±3% with trend
   • Safety: threshold-based jumps
   • Inventory: gradual depletion
   ↓
3. store.updateKPIs(newKPIs)
   ↓
4. Check thresholds:
   • If KPI crosses threshold → trigger alert
   • If critical level → auto-analyze spatial context
   ↓
5. React re-render:
   • KPIPanel updates values (animated)
   • KPITicker scrolls updated metrics
   • Alert panel shows new alerts (if triggered)

Future Enhancement (WebSocket):
┌─────────────────────────────────────────────────────────────────────────────┐
│ Backend WebSocket server                                                     │
│ • Connects to warehouse IoT systems                                         │
│ • Streams real-time entity position updates                                 │
│ • Pushes alert notifications                                                │
│ • Bi-directional command/control                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack

```
┌──────────────────────────────────────────────────────────────────┐
│                        Core Framework                             │
├──────────────────────────────────────────────────────────────────┤
│ React 18.2              │ Component-based UI                      │
│ TypeScript 5.2          │ Static typing, strict mode             │
│ Vite 5.0                │ Build tool, dev server, HMR            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        3D Rendering                               │
├──────────────────────────────────────────────────────────────────┤
│ Three.js 0.160          │ WebGL 3D engine                        │
│ React Three Fiber 8.15  │ React renderer for Three.js            │
│ @react-three/drei 9.93  │ Helper components (shadows, gizmo)     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      State & Data Management                      │
├──────────────────────────────────────────────────────────────────┤
│ Zustand 4.4             │ Lightweight state management           │
│ PapaParse 5.4           │ CSV parsing (Web Worker)               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       Animation & Styling                         │
├──────────────────────────────────────────────────────────────────┤
│ GSAP 3.14               │ Timeline animations, camera control    │
│ Framer Motion 12.34     │ React component animations             │
│ Tailwind CSS 3.4        │ Utility-first styling                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                           UI Components                           │
├──────────────────────────────────────────────────────────────────┤
│ Lucide React 0.563      │ Icon library                           │
└──────────────────────────────────────────────────────────────────┘
```

### Backend Stack

```
┌──────────────────────────────────────────────────────────────────┐
│                        Core Framework                             │
├──────────────────────────────────────────────────────────────────┤
│ Node.js 18+             │ Runtime environment                    │
│ Express.js 4.18         │ Web framework                          │
│ TypeScript 5.3          │ Static typing                          │
│ ts-node-dev 2.0         │ Development server with auto-reload    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        AI/LLM Integration                         │
├──────────────────────────────────────────────────────────────────┤
│ OpenAI SDK 4.20         │ GPT-4 integration                      │
│                         │ • Intent classification                │
│                         │ • Response synthesis                   │
│                         │ • Function calling                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       Utilities & Middleware                      │
├──────────────────────────────────────────────────────────────────┤
│ CORS 2.8                │ Cross-origin resource sharing          │
│ dotenv 16.3             │ Environment variable management        │
│ UUID 13.0               │ Unique ID generation                   │
│ csv-parse 6.1           │ CSV parsing (backend)                  │
└──────────────────────────────────────────────────────────────────┘
```

### Development Tools

```
┌──────────────────────────────────────────────────────────────────┐
│ ESLint                  │ Code linting                           │
│ Prettier                │ Code formatting                        │
│ PostCSS                 │ CSS processing                         │
│ Autoprefixer            │ CSS vendor prefixing                   │
└──────────────────────────────────────────────────────────────────┘
```

### Future/Planned Stack

```
┌──────────────────────────────────────────────────────────────────┐
│                          Database                                 │
├──────────────────────────────────────────────────────────────────┤
│ PostgreSQL              │ Primary database (recommended)         │
│ OR SQLite               │ Lightweight alternative                │
│ Redis                   │ Caching layer                          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       Real-Time Communication                     │
├──────────────────────────────────────────────────────────────────┤
│ Socket.io               │ WebSocket communication                │
│ Server-Sent Events      │ One-way streaming updates              │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                          Testing                                  │
├──────────────────────────────────────────────────────────────────┤
│ Jest                    │ Unit testing                           │
│ React Testing Library   │ Component testing                      │
│ Playwright              │ E2E testing                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Features by Phase

### Phase 1: Foundation ✅ (Complete)

**Objective:** Build core 3D visualization and data loading infrastructure

**Features:**
- ✅ 3D warehouse visualization with Three.js
- ✅ Entity rendering (workers, forklifts, robots, pallets)
- ✅ Interactive camera controls (orbit, pan, zoom)
- ✅ CSV-driven data loading (offline-first)
- ✅ Dataset switching (3 scenarios: normal, congestion, dock_delay)
- ✅ Entity detail panel (click to inspect)
- ✅ Zone highlighting
- ✅ Basic command bar UI
- ✅ Contact shadows for realism

**Performance:**
- 60 FPS with 50+ entities
- < 2s dataset loading
- Smooth camera transitions

---

### Phase 2: Multi-Agent System ✅ (Complete)

**Objective:** Implement AI-powered multi-agent orchestration

**Features:**
- ✅ OpsAgent orchestrator with intent classification
- ✅ 5 specialist sub-agents:
  - MaintenanceAgent (equipment, battery, repairs)
  - InventoryAgent (stock, replenishment, turnover)
  - SlottingAgent (layout optimization, pick paths)
  - SafetyAgent (hazards, congestion, compliance)
  - LaborAgent (worker allocation, productivity)
- ✅ Parallel sub-agent execution
- ✅ LLM integration (OpenAI GPT-4)
- ✅ Function calling for camera control
- ✅ ActionFlow progressive reveal UI:
  - Signals (issue detection)
  - Context (data analysis)
  - Intent (decision reasoning)
  - Actions (executable steps)
- ✅ Rule engine for fast-path queries
- ✅ Context-aware suggestions
- ✅ Conversational interface

**Key Capabilities:**
- Natural language queries: "Show me robots with low battery"
- Shift briefings: "Give me a shift briefing"
- Proactive analysis: "What's the most critical issue?"
- Multi-domain analysis (all 5 agents working together)

---

### Phase 3: Autonomous Actions ✅ (Complete)

**Objective:** Enable autonomous decision-making with safety mechanisms

**Features:**
- ✅ Alert Detection Service
  - Issue extraction from sub-agent analyses
  - Deduplication
  - Severity classification (critical/high/medium/low)
  - Impact scoring
  
- ✅ Recommendation Engine
  - Category-specific recommendations
  - Before/after impact analysis
  - Alternative approaches
  - Confidence scoring

- ✅ Autonomy Framework
  - Impact score calculation (4 weighted factors)
  - Confidence × Impact matrix
  - 3-tier classification:
    - 🟢 Automated (10s gestation)
    - 🟡 Semi-Automated (45s gestation)
    - 🔴 Assisted (requires approval)

- ✅ Gestation Manager
  - Countdown timers (10s or 45s)
  - User objection mechanism
  - Event streaming to frontend
  - Countdown UI display

- ✅ Explainability Service
  - Decision provenance
  - Data source tracing
  - Confidence breakdowns
  - Alternative scenarios

- ✅ Outcome Tracker
  - Promised vs. achieved metrics
  - Accuracy calculation
  - Learning from results
  - Category-based statistics

- ✅ Activity Feed
  - Real-time action log
  - Alert history
  - Recommendation tracking

**Key Capabilities:**
- Autonomous execution of low-risk actions
- Safety mechanisms (gestation period + objection)
- Full decision transparency
- Continuous learning from outcomes

---

### Phase 4: KPI ↔ Overlay Integration 🚧 (70% Complete)

**Objective:** Link KPIs to spatial visualizations with auto-focus

**Features:**
- ✅ Backend: KPI spatial analysis service
- ✅ Backend: Recommendation generation for KPIs
- ✅ Frontend: State management for Phase 4
- ✅ Frontend: KPI service (API calls)
- ✅ 3D: Column heat map visualization
- ✅ 3D: Particle heat map visualization
- ✅ UI: Heat map mode selector
- ✅ UI: Intensity slider
- ✅ UI: Animation toggle
- ✅ KPI panel: Async spatial analysis on click
- ⏳ Camera: Auto-focus on KPI context (in progress)
- ⏳ Integration: End-to-end testing
- ⏳ Polish: Animations and transitions

**Key Capabilities (When Complete):**
- Click any KPI → Automatic spatial analysis
- 3 visualization modes:
  - Gradient: Smooth color transitions
  - Column: 3D bars showing intensity
  - Particle: Cloud-like density visualization
- Camera automatically flies to affected zones
- Manual mode switching + intensity control
- KPI-specific recommendations

**Estimated Completion:** ~3-4 days remaining

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Development Setup                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐          ┌─────────────────────────┐
│   Frontend Dev Server   │          │   Backend Dev Server    │
│   (Vite)                │          │   (ts-node-dev)         │
│                         │          │                         │
│   Port: 5174            │◄────────►│   Port: 3001            │
│   Auto-reload: Yes      │   CORS   │   Auto-reload: Yes      │
│   HMR: Yes              │          │   OpenAI: Optional      │
└─────────────────────────┘          └─────────────────────────┘
            │                                    │
            │                                    │
            ▼                                    ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│   CSV Files (public/)   │          │   .env Configuration    │
│   • Datasets            │          │   OPENAI_API_KEY=...    │
│   • KPI Snapshots       │          │   PORT=3001             │
│   • Overlay Configs     │          │   FRONTEND_URL=...      │
└─────────────────────────┘          └─────────────────────────┘

Commands:
Frontend: npm run dev
Backend:  cd server && npm run dev
```

### Production Architecture (Recommended)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Production Deployment                                │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────────┐
                            │   Load Balancer  │
                            │   / Reverse Proxy│
                            │   (nginx/ALB)    │
                            └────────┬─────────┘
                                     │
                ┌────────────────────┴────────────────────┐
                │                                         │
                ▼                                         ▼
    ┌───────────────────────┐              ┌─────────────────────────┐
    │   CDN / Static Host   │              │   Backend API Cluster   │
    │   (S3 + CloudFront)   │              │   (EC2 / ECS / Lambda)  │
    │                       │              │                         │
    │   • index.html        │              │   • Express.js          │
    │   • JS bundles        │              │   • Multi-instance      │
    │   • CSS               │              │   • Auto-scaling        │
    │   • 3D assets         │              │   • Health checks       │
    │   • CSV datasets      │              └────────┬────────────────┘
    └───────────────────────┘                       │
                                                    │
                                        ┌───────────┴──────────┐
                                        │                      │
                                        ▼                      ▼
                            ┌───────────────────┐  ┌─────────────────┐
                            │   OpenAI API      │  │   Database      │
                            │   (GPT-4)         │  │   (PostgreSQL   │
                            │                   │  │    + Redis)     │
                            └───────────────────┘  └─────────────────┘
```

### Scaling Considerations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Horizontal Scaling                                │
└─────────────────────────────────────────────────────────────────────────────┘

Current State: Single-instance backend (in-memory)
Future State:  Multi-instance with shared state

┌──────────────────────────────────┐
│   API Gateway / Load Balancer    │
└────────┬─────────────────────────┘
         │
         ├─────────────────┬─────────────────┬─────────────────┐
         ▼                 ▼                 ▼                 ▼
    ┌─────────┐       ┌─────────┐      ┌─────────┐      ┌─────────┐
    │Backend 1│       │Backend 2│      │Backend 3│      │Backend N│
    └────┬────┘       └────┬────┘      └────┬────┘      └────┬────┘
         │                 │                 │                 │
         └─────────────────┴─────────────────┴─────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Shared State       │
                        │   • Redis (cache)    │
                        │   • PostgreSQL (DB)  │
                        │   • S3 (file storage)│
                        └──────────────────────┘

Key Requirements:
• Stateless backend servers
• Session management via Redis
• Database connection pooling
• Rate limiting (per API key)
• LLM request queuing (to avoid OpenAI rate limits)
```

---

## Performance & Scalability

### Current Performance Metrics

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Performance Targets                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Frontend:
✅ 60 FPS with 50+ entities (desktop)
✅ 30+ FPS with 100+ entities (desktop)
✅ < 2s dataset loading (CSV parsing)
✅ < 500ms camera transitions (GSAP)
✅ < 100ms UI interactions (React)

Backend:
✅ < 100ms rule engine responses (fast-path)
✅ < 3s LLM responses (with real OpenAI API)
✅ < 1s sub-agent parallel execution (mock mode)
✅ < 500ms spatial analysis (KPI service)

Network:
• Initial bundle size: ~2MB (gzipped)
• Lazy loading for large datasets
• CDN caching for static assets
```

### Optimization Techniques

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Frontend Optimizations                               │
└─────────────────────────────────────────────────────────────────────────────┘

3D Rendering:
• Instanced rendering for inventory boxes (1000s of boxes)
• Frustum culling (off-screen entities not rendered)
• Level-of-detail (LOD) for distant entities
• Shader-based particle systems (GPU computation)
• Contact shadows (optimized, not real-time ray tracing)

React:
• React.memo() for expensive components
• useMemo() / useCallback() for derived state
• Virtualized lists for large datasets
• Debounced camera controls
• Throttled state updates

Data:
• Web Worker for CSV parsing (off main thread)
• Lazy loading of datasets
• Pre-computed overlay data (JSON)
• Incremental entity updates (not full re-render)

┌─────────────────────────────────────────────────────────────────────────────┐
│                         Backend Optimizations                                │
└─────────────────────────────────────────────────────────────────────────────┘

AI/LLM:
• Rule engine fast-path (bypass LLM for common queries)
• Context compression (summarize large datasets)
• Caching of intent classifications (Redis, future)
• Parallel sub-agent execution (Promise.all)
• LLM request queuing (rate limit management)

Performance:
• Timeout for sub-agent analysis (5s max)
• In-memory caching (current: Map, future: Redis)
• Stateless API (horizontal scaling ready)
• Connection pooling (future: database)
```

### Scalability Roadmap

```
Phase 1: Current (Single Instance)
┌──────────────────────────────────────┐
│ • Single backend server              │
│ • In-memory state                    │
│ • No database                        │
│ • Suitable for: Demo, POC            │
│ • Max users: ~10 concurrent          │
└──────────────────────────────────────┘

Phase 2: Vertical Scaling (3-6 months)
┌──────────────────────────────────────┐
│ • Larger server instance             │
│ • PostgreSQL database                │
│ • Redis caching layer                │
│ • Suitable for: Pilot, small teams   │
│ • Max users: ~50 concurrent          │
└──────────────────────────────────────┘

Phase 3: Horizontal Scaling (6-12 months)
┌──────────────────────────────────────┐
│ • Multi-instance backend             │
│ • Load balancer                      │
│ • Database replication               │
│ • CDN for static assets              │
│ • Suitable for: Enterprise           │
│ • Max users: 500+ concurrent         │
└──────────────────────────────────────┘

Phase 4: Full Enterprise (12+ months)
┌──────────────────────────────────────┐
│ • Kubernetes orchestration           │
│ • Microservices architecture         │
│ • Message queue (RabbitMQ/Kafka)     │
│ • Real-time WebSocket cluster        │
│ • Multi-region deployment            │
│ • Suitable for: Global deployment    │
│ • Max users: 10,000+ concurrent      │
└──────────────────────────────────────┘
```

---

## Security Considerations

### Current Security Status

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Security Checklist                                   │
└─────────────────────────────────────────────────────────────────────────────┘

✅ Implemented:
• CORS configuration (restricts origins)
• Environment variable management (.env for secrets)
• TypeScript type safety (prevents common bugs)
• Input validation (CSV schema validation)
• HTTPS in production (via CDN/load balancer)

⚠️  Needs Implementation (Production):
• Authentication & Authorization (no auth currently)
• API rate limiting (prevent abuse)
• Input sanitization (prevent injection attacks)
• API key management (OpenAI key rotation)
• Audit logging (track all actions)
• Encryption at rest (database)
• Encryption in transit (TLS 1.3)
• CSRF protection
• XSS prevention (Content Security Policy)
• Secrets management (Vault/AWS Secrets Manager)
```

### Production Security Recommendations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Authentication & Authorization                       │
└─────────────────────────────────────────────────────────────────────────────┘

Recommended Approach:
┌────────────────────────────────────────────┐
│   OAuth 2.0 / OpenID Connect               │
│   • Azure AD / Okta / Auth0                │
│   • Role-based access control (RBAC)       │
│   • Roles: Admin, Supervisor, Viewer       │
└────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              API Security                                    │
└─────────────────────────────────────────────────────────────────────────────┘

• JWT tokens for session management
• API key rotation (OpenAI)
• Rate limiting:
  - Per user: 100 req/min
  - Per IP: 1000 req/hour
  - LLM calls: 10/min per user (expensive)
• Request validation (schema validation with Zod/Joi)
• CORS whitelist (only allowed origins)

┌─────────────────────────────────────────────────────────────────────────────┐
│                            Data Security                                     │
└─────────────────────────────────────────────────────────────────────────────┘

• Encryption at rest (database: AES-256)
• Encryption in transit (TLS 1.3)
• Secrets management:
  - AWS Secrets Manager / Azure Key Vault
  - Rotate OpenAI keys quarterly
  - Rotate database credentials monthly
• Data retention policies (GDPR compliance)
• Audit logging (all actions logged with user ID)

┌─────────────────────────────────────────────────────────────────────────────┐
│                         Frontend Security                                    │
└─────────────────────────────────────────────────────────────────────────────┘

• Content Security Policy (CSP)
• Subresource Integrity (SRI) for CDN assets
• XSS prevention (sanitize user input)
• CSRF tokens for state-changing requests
• Secure cookies (HttpOnly, Secure, SameSite)
```

---

## API Endpoints Reference

### Agent Endpoints

```
POST /api/agent/query
Description: Process user query with multi-agent system
Body: {
  message: string,
  context: {
    entities: Entity[],
    zones: Zone[],
    metrics: Record<string, number>,
    alerts?: Alert[]
  }
}
Response: {
  message: string,
  actions: Action[],
  suggestions: string[],
  actionFlow?: ActionFlow,
  source: 'llm' | 'rule'
}

GET /api/agent/briefing
Description: Get comprehensive shift briefing from all agents
Query: ?context={serialized_context}
Response: {
  summary: string,
  agentReports: {
    maintenance: Report,
    inventory: Report,
    slotting: Report,
    safety: Report,
    labor: Report
  },
  criticalIssues: Issue[],
  recommendations: Recommendation[]
}

GET /api/agent/alerts
Description: Get active alerts
Response: {
  alerts: Alert[]
}

POST /api/agent/recommendations
Description: Get recommendations for specific issue
Body: {
  issueId: string,
  context: WarehouseContext
}
Response: {
  recommendations: Recommendation[]
}

GET /api/agent/gestation
Description: Get gestating actions (countdown timers)
Response: {
  gestatingActions: GestatingAction[]
}

POST /api/agent/gestation/object
Description: Object to a gestating action (cancel)
Body: {
  actionId: string,
  reason?: string
}
Response: {
  success: boolean
}

GET /api/agent/explainability
Description: Get decision explanation
Query: ?actionId={id}
Response: {
  decision: string,
  reasoning: string[],
  dataSources: string[],
  confidenceBreakdown: Record<string, number>,
  alternatives: Alternative[]
}

GET /api/agent/outcomes
Description: Get outcome tracking statistics
Response: {
  byCategory: Record<string, Statistics>,
  overall: Statistics,
  recentActions: Action[]
}
```

### KPI Endpoints

```
POST /api/kpi/spatial-context
Description: Analyze KPI spatial context for visualization
Body: {
  kpi: {
    id: string,
    category: string,
    value: number,
    label: string
  },
  warehouseState: {
    zones: Zone[],
    entities: Entity[]
  }
}
Response: {
  primaryZones: string[],
  overlayType: string,
  visualizationMode: 'gradient' | 'column' | 'particle',
  cameraTarget: {
    position: Vector3,
    lookAt: Vector3
  },
  intensityData: Record<string, number>,
  recommendations?: Recommendation[]
}

POST /api/kpi/recommendations
Description: Get recommendations for KPI issue
Body: {
  kpiId: string,
  context: WarehouseContext
}
Response: {
  recommendations: Recommendation[]
}
```

---

## File Structure

```
Live Wip/
├── server/                                   # Backend
│   ├── src/
│   │   ├── index.ts                          # Express server entry
│   │   ├── agents/
│   │   │   ├── OpsAgent.ts                   # Master orchestrator
│   │   │   ├── SubAgent.ts                   # Base class
│   │   │   ├── ruleEngine.ts                 # Fast-path rules
│   │   │   └── specialists/
│   │   │       ├── MaintenanceAgent.ts
│   │   │       ├── InventoryAgent.ts
│   │   │       ├── SlottingAgent.ts
│   │   │       ├── SafetyAgent.ts
│   │   │       └── LaborAgent.ts
│   │   ├── services/
│   │   │   ├── llmService.ts                 # OpenAI integration
│   │   │   ├── alertDetectionService.ts      # Phase 3
│   │   │   ├── recommendationEngine.ts       # Phase 3
│   │   │   ├── autonomyFramework.ts          # Phase 3
│   │   │   ├── gestationManager.ts           # Phase 3
│   │   │   ├── explainabilityService.ts      # Phase 3
│   │   │   ├── outcomeTracker.ts             # Phase 3
│   │   │   └── kpiAnalyticsService.ts        # Phase 4
│   │   ├── routes/
│   │   │   ├── agent.ts                      # Agent endpoints
│   │   │   └── kpi.ts                        # KPI endpoints
│   │   └── types/
│   │       ├── index.ts                      # Shared types
│   │       ├── phase3.ts                     # Phase 3 types
│   │       └── phase4.ts                     # Phase 4 types
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                                  # Environment variables
│
├── src/                                      # Frontend
│   ├── App.tsx                               # Root component
│   ├── main.tsx                              # Entry point
│   ├── index.css                             # Global styles
│   ├── components/
│   │   ├── Scene/                            # 3D Components
│   │   │   ├── WarehouseScene.tsx
│   │   │   ├── WarehouseLayout.tsx
│   │   │   ├── EntityRenderer.tsx
│   │   │   ├── RackInventory.tsx
│   │   │   ├── InstancedInventoryBoxes.tsx
│   │   │   ├── OverlayRenderer.tsx
│   │   │   ├── ZoneHeatOverlay.tsx
│   │   │   ├── ColumnHeatMap.tsx             # Phase 4
│   │   │   ├── ParticleHeatMap.tsx           # Phase 4
│   │   │   ├── SelectionRing.tsx
│   │   │   ├── ZoneHighlighter.tsx
│   │   │   └── ContactShadow.tsx
│   │   ├── CommandBar/                       # AI Interface
│   │   │   ├── CommandBarContainer.tsx
│   │   │   ├── CommandBar.tsx
│   │   │   ├── ResponseBubble.tsx
│   │   │   ├── SuggestionChip.tsx
│   │   │   └── AgentAvatar.tsx
│   │   ├── Agent/                            # Agent UI
│   │   │   ├── ActionFlow.tsx                # Phase 2
│   │   │   └── AgentStatusIndicator.tsx      # Phase 2
│   │   ├── Panels/
│   │   │   ├── KPIPanel.tsx
│   │   │   ├── EntityDetailPanel.tsx
│   │   │   ├── DrillDownPanel.tsx
│   │   │   └── HierarchyPanel.tsx
│   │   ├── Controls/
│   │   │   ├── DatasetSelector.tsx
│   │   │   ├── HeatMapControls.tsx           # Phase 4
│   │   │   ├── EntityFilterControl.tsx
│   │   │   ├── CameraViewSwitcher.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── ResetButton.tsx
│   │   ├── Layout/
│   │   │   ├── TopNavBar.tsx
│   │   │   ├── LeftSidebar.tsx
│   │   │   ├── ObjectiveBar.tsx
│   │   │   └── KPITicker.tsx
│   │   └── UI/
│   │       ├── ViewGizmo.tsx
│   │       ├── LensSwitcher.tsx
│   │       └── [other UI components]
│   ├── services/
│   │   ├── DataService.ts
│   │   ├── KPIService.ts                     # Phase 4
│   │   ├── CameraCommandService.ts
│   │   └── KPISimulationService.ts
│   ├── state/
│   │   └── store.ts                          # Zustand store
│   ├── types/
│   │   ├── index.ts
│   │   └── phase4.ts                         # Phase 4 types
│   └── utils/
│       ├── coordinates.ts
│       └── [other utilities]
│
├── public/
│   ├── datasets/
│   │   ├── scenario_normal/
│   │   │   ├── warehouse_layout.csv
│   │   │   ├── warehouse_state.csv
│   │   │   └── inventory_boxes.csv
│   │   ├── scenario_congestion/
│   │   └── scenario_dock_delay/
│   └── data/
│       ├── kpis/
│       │   ├── kpi_snapshot_scenario_normal.json
│       │   ├── kpi_snapshot_scenario_congestion.json
│       │   └── kpi_snapshot_scenario_dock_delay.json
│       └── overlays/
│           ├── overlay_config.json
│           ├── overlay_data_scenario_normal.json
│           ├── overlay_data_scenario_congestion.json
│           └── overlay_data_scenario_dock_delay.json
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── index.html
└── README.md
```

---

## Quick Start for Production Team

### Prerequisites

```bash
# Required
- Node.js 18+ and npm
- OpenAI API key (for LLM features)

# Optional (future)
- PostgreSQL 14+
- Redis 7+
```

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd "Live Wip"

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd server
npm install

# 4. Configure environment
cp .env.example .env
# Edit .env and add:
# OPENAI_API_KEY=sk-...
# PORT=3001
# FRONTEND_URL=http://localhost:5174
```

### Development

```bash
# Terminal 1: Start backend
cd server
npm run dev
# Backend runs on http://localhost:3001

# Terminal 2: Start frontend
npm run dev
# Frontend runs on http://localhost:5174

# Open browser to http://localhost:5174
```

### Production Build

```bash
# Build frontend
npm run build
# Output: dist/

# Build backend
cd server
npm run build
# Output: server/dist/

# Start production server
cd server
npm start
```

---

## Next Steps & Roadmap

### Immediate (Complete Phase 4)
- ⏳ Camera auto-focus integration
- ⏳ End-to-end testing
- ⏳ Polish animations and transitions
- ⏳ Documentation completion

### Short-Term (3-6 months)
- Database integration (PostgreSQL)
- User authentication & authorization
- WebSocket for real-time updates
- Advanced analytics dashboard
- Mobile-responsive design
- Performance monitoring (Sentry, New Relic)

### Medium-Term (6-12 months)
- IoT integration (real warehouse sensors)
- Historical replay (timeline scrubbing)
- What-if scenario modeling
- Multi-warehouse support
- Advanced AI features (predictive alerts)
- Custom report builder

### Long-Term (12+ months)
- Microservices architecture
- Multi-region deployment
- AR/VR interfaces
- Advanced machine learning models
- Integration with ERP/WMS systems
- White-label solution

---

## Contact & Support

**Project:** Live Wip - Warehouse Operations Intelligence Platform  
**Version:** 1.0 (Phases 1-3 Complete, Phase 4 In Progress)  
**Last Updated:** February 17, 2026  
**Status:** Ready for Production Pilot

**For Production Implementation:**
- Review this architecture document
- Provision infrastructure (servers, database, CDN)
- Configure environment variables
- Set up authentication system
- Configure monitoring and logging
- Schedule production deployment

**Key Success Metrics:**
- ✅ 60 FPS 3D rendering
- ✅ < 3s LLM responses
- ✅ 5 specialist AI agents operational
- ✅ Autonomous action execution with safety
- ✅ Full explainability and outcome tracking

---

## Glossary

**Terms:**
- **OpsAgent:** Master orchestrator AI agent
- **Sub-Agent:** Specialist domain agent (Maintenance, Inventory, etc.)
- **Gestation:** Safety countdown period before autonomous action execution
- **ActionFlow:** Progressive reveal UI showing agent reasoning
- **Heat Map:** Spatial visualization overlay (gradient/column/particle)
- **Autonomy Tier:** Classification of action execution mode (Automated/Semi-Auto/Assisted)
- **Spatial Context:** Zone-level analysis for KPI visualization
- **Entity:** Warehouse object (worker, forklift, robot, pallet)
- **Zone:** Warehouse area (storage, picking, shipping, receiving)

---

**END OF ARCHITECTURE DOCUMENTATION**
