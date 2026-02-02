# Warehouse Live - Architecture Proposal

Version: 0.1  
Date: 2 Feb 2026  
Status: Draft

---

## Overview

This document defines the technical architecture for Warehouse Live MVP, optimized for:
- **ICON demo reliability** (offline-first, fast reset, 60 FPS)
- **Incremental development** (vertical slices, testable layers)
- **Future extensibility** (modular design, clear contracts)

---

## System Context

```
┌─────────────────────────────────────────────────────────────┐
│                     Warehouse Live MVP                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           React Application (SPA)                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │  UI Layer    │  │ Three.js     │  │  Chat    │  │   │
│  │  │ (Components) │  │   Scene      │  │  Panel   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │        State Management (Zustand / Context)   │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │ Data Layer   │  │ Intelligence │  │  Demo    │  │   │
│  │  │ (CSV/JSON)   │  │   Layer      │  │  Engine  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                       │                   │
         │ CSV Files             │ API (optional)    │ Offline Cache
         ▼                       ▼                   ▼
  ┌──────────────┐      ┌──────────────┐    ┌──────────────┐
  │  Static      │      │   AI/LLM     │    │  IndexedDB / │
  │  Assets      │      │  Services    │    │ LocalStorage │
  │ (bundled)    │      │ (fallback)   │    │              │
  └──────────────┘      └──────────────┘    └──────────────┘
```

---

## Architecture Layers

### 1. Presentation Layer
**Responsibilities:** User interface, visualization, user interactions

**Components:**
- **React Components** - UI panels, controls, forms
- **Three.js Scene** - 3D warehouse visualization
- **Overlay System** - Heat maps, labels, highlights
- **Animation System** - Camera transitions, entity movement

**Key Modules:**
```
/src/components/
  /Scene/              # Three.js scene components
    WarehouseScene.tsx
    EntityRenderer.tsx
    OverlayRenderer.tsx
    CameraController.tsx
  /Panels/             # UI panels
    KPIPanel.tsx
    AlertPanel.tsx
    ExplainabilityPanel.tsx
    RecommendationPanel.tsx
    PlanTuningPanel.tsx
    ActivityFeed.tsx
  /Controls/           # Interactive controls
    Timeline.tsx
    DatasetSelector.tsx
    OverlayToggle.tsx
  /Chat/               # Conversational interface
    ChatPanel.tsx
    MessageList.tsx
    ActionChips.tsx
  /Demo/               # Demo mode UI
    DemoControls.tsx
    SceneIndicator.tsx
```

---

### 2. Application Layer
**Responsibilities:** State management, business logic, orchestration

**State Model:**

```typescript
// Global Application State
interface AppState {
  // Scene State
  scene: {
    camera: CameraState;
    entities: Entity[];
    visibleLayers: LayerType[];
    selectedEntity: string | null;
    focusedZone: string | null;
  };
  
  // Data State
  data: {
    warehouse: WarehouseLayout;
    currentDataset: string;
    scenarios: Scenario[];
    timelines: Record<string, TimelineData>;
    loadingState: LoadingState;
  };
  
  // Monitoring State
  monitoring: {
    kpis: KPI[];
    alerts: Alert[];
    activityFeed: FeedItem[];
    overlays: OverlayConfig[];
    overallStatus: 'Stable' | 'Watch' | 'AtRisk';
  };
  
  // Interaction State
  interaction: {
    activePanel: PanelType | null;
    selectedKPI: string | null;
    selectedAlert: string | null;
    drillDownData: DrillDownData | null;
    comparisonMode: boolean;
  };
  
  // Timeline State
  timeline: {
    currentTime: number;
    playbackSpeed: number;
    isPlaying: boolean;
    markers: TimelineMarker[];
    comparisonScenario: string | null;
  };
  
  // Demo State
  demo: {
    mode: 'auto' | 'interactive' | 'off';
    currentScene: number;
    scriptedActions: ScriptedAction[];
    isExecuting: boolean;
    offlineMode: boolean;
  };
}
```

**State Management Choice:** Zustand (lightweight, performant, dev-friendly)

**Alternative:** React Context + useReducer (if team prefers built-in solution)

**Key Services:**
```
/src/services/
  DataService.ts          # CSV loading, validation, caching
  SceneService.ts         # 3D scene orchestration
  MonitoringService.ts    # Alert detection, KPI computation
  IntelligenceService.ts  # Recommendations, explainability
  TimelineService.ts      # Timeline playback, interpolation
  DemoService.ts          # Script execution, scene sequencing
  ChatService.ts          # Query handling, intent detection
  OfflineService.ts       # Fallback logic, caching
```

---

### 3. Data Layer
**Responsibilities:** Data loading, parsing, validation, caching

**Data Flow:**
```
CSV Files (static/bundled)
   ↓
DataService.loadDataset()
   ↓
Schema Validation
   ↓
Parse & Transform
   ↓
Cache (IndexedDB)
   ↓
Expose via State
   ↓
Consume in Components
```

**Key Modules:**
```
/src/data/
  /parsers/
    CSVParser.ts
    WarehouseLayoutParser.ts
    TimelineParser.ts
    AlertParser.ts
  /validators/
    SchemaValidator.ts
    CoordinateValidator.ts
  /transformers/
    EntityTransformer.ts
    KPIAggregator.ts
    HeatmapComputer.ts
  /cache/
    IndexedDBCache.ts
    DatasetCache.ts
```

**Caching Strategy:**
- **IndexedDB** for large datasets (timelines, scenarios)
- **LocalStorage** for small config (user prefs, last loaded dataset)
- **In-memory cache** for current session data
- **Asset preloading** on app start (3D models, textures)

---

### 4. Intelligence Layer
**Responsibilities:** Alert detection, recommendations, explainability, plan generation

**For MVP:** Rule-based + templates (not true AI, but designed to be swappable)

**Components:**

**Alert Detection:**
```typescript
// Rule-based alert detection
interface AlertRule {
  id: string;
  metric: string;
  threshold: number;
  condition: 'above' | 'below' | 'rapid_change';
  zoneFilter?: string[];
  confidence: number;
  impactLevel: 'low' | 'medium' | 'high';
}

// Example: Congestion alert
{
  id: 'congestion-zone-c',
  metric: 'worker_density',
  threshold: 0.8,
  condition: 'above',
  zoneFilter: ['Zone-C'],
  confidence: 0.85,
  impactLevel: 'high'
}
```

**Explainability Templates:**
```typescript
interface ExplanationTemplate {
  alertType: string;
  factors: FactorTemplate[];
  impactDescription: string;
  recommendationHint: string;
}

// Example template
{
  alertType: 'congestion',
  factors: [
    { label: 'Worker Density', value: '{{worker_density}}', threshold: '0.8', status: 'above' },
    { label: 'Aisle Width', value: '{{aisle_width}}', unit: 'ft' },
    { label: 'Active Tasks', value: '{{active_tasks}}', threshold: '50' }
  ],
  impactDescription: 'Congestion may delay {{affected_orders}} orders by {{delay_minutes}} minutes',
  recommendationHint: 'resource_reallocation'
}
```

**Recommendation Generation:**
```typescript
interface RecommendationOption {
  id: string;
  title: string;
  description: string;
  steps: PlanStep[];
  impact: ImpactEstimate;
  cost: CostEstimate;
  confidence: number;
}

// Pre-defined options per alert type
const congestionOptions: RecommendationOption[] = [
  {
    id: 'reallocate-3-workers',
    title: 'Reallocate 3 Workers to Zone B',
    description: 'Move workers from Zone C to reduce density',
    steps: [/* ... */],
    impact: { ordersAtRisk: -12, utilizationChange: -0.15, timeToResolve: '8min' },
    cost: { laborHours: 1.5, equipmentMoves: 0 },
    confidence: 0.82
  },
  // ... more options
];
```

**Plan Tuning (MVP approach):**
- Natural language input parsed for keywords
- Match to pre-computed plan variants
- If no match, suggest closest variant with message: "Closest match to your request"
- Future: true LLM-based regeneration

**Key Modules:**
```
/src/intelligence/
  /detection/
    AlertDetector.ts
    ThresholdEngine.ts
    TriageClassifier.ts
  /explanation/
    ExplainerService.ts
    TemplateEngine.ts
    EvidenceCollector.ts
  /recommendation/
    OptionGenerator.ts
    PlanBuilder.ts
    ImpactEstimator.ts
  /tuning/
    ConstraintParser.ts
    PlanVariantMatcher.ts
    DiffGenerator.ts
```

---

### 5. Timeline Layer
**Responsibilities:** Temporal data management, playback, interpolation, comparison

**Timeline Data Structure:**
```typescript
interface TimelineData {
  scenarioId: string;
  startTime: number;
  endTime: number;
  frames: TimelineFrame[];
  events: TimelineEvent[];
  kpiSeries: KPISeries[];
}

interface TimelineFrame {
  timestamp: number;
  entities: EntitySnapshot[];
  metrics: MetricSnapshot[];
}

interface TimelineEvent {
  timestamp: number;
  type: 'alert' | 'decision' | 'annotation' | 'scenario_switch';
  data: any;
  location?: Vector3;
}
```

**Playback Engine:**
- Interpolate between frames for smooth playback
- Variable speed (1×, 5×, 10×) via frame skip + interpolation
- Scrubber updates at 30Hz, scene renders at 60Hz
- Event markers trigger callbacks (camera focus, panel open)

**Comparison Mode:**
- Dual scene rendering (side-by-side or picture-in-picture)
- Synchronized timeline cursors
- Metric delta computation on-the-fly
- Divergence point highlighting

**Key Modules:**
```
/src/timeline/
  TimelineController.ts
  FrameInterpolator.ts
  PlaybackEngine.ts
  ComparisonSyncService.ts
  EventMarkerManager.ts
```

---

### 6. Demo Layer
**Responsibilities:** Scripted demo execution, offline fallbacks, booth operator controls

**Demo Script Structure:**
```typescript
interface DemoScript {
  scenes: DemoScene[];
  defaultDataset: string;
  resetState: AppState;
}

interface DemoScene {
  id: string;
  name: string;
  duration: number; // seconds
  actions: ScriptedAction[];
  userInputPrompts?: UserPrompt[];
  exitCondition: 'timer' | 'user_action' | 'event';
}

interface ScriptedAction {
  timestamp: number; // relative to scene start
  type: 'load_dataset' | 'focus_camera' | 'open_panel' | 'trigger_alert' | 'animate_entity';
  params: any;
  waitForCompletion: boolean;
}
```

**Example Scene:**
```typescript
{
  id: 'scene-3-proactive-warning',
  name: 'Proactive Warning',
  duration: 60,
  actions: [
    { timestamp: 0, type: 'advance_timeline', params: { to: 'congestion_start' }, waitForCompletion: true },
    { timestamp: 2, type: 'trigger_alert', params: { alertId: 'congestion-zone-c' }, waitForCompletion: false },
    { timestamp: 3, type: 'focus_camera', params: { zone: 'Zone-C', smooth: true }, waitForCompletion: true },
    { timestamp: 4, type: 'activate_overlay', params: { type: 'heat_congestion' }, waitForCompletion: false },
    { timestamp: 5, type: 'open_panel', params: { panel: 'alert', alertId: 'congestion-zone-c' }, waitForCompletion: false },
  ],
  exitCondition: 'timer'
}
```

**Offline Fallback System:**
```typescript
interface OfflineFallback {
  chatResponses: Record<string, ChatResponse>;
  precomputedExplanations: Record<string, Explanation>;
  precomputedRecommendations: Record<string, RecommendationOption[]>;
  planVariants: Record<string, PlanVariant[]>;
}

// Fallback detection
class IntelligenceService {
  async getRecommendations(alertId: string): Promise<RecommendationOption[]> {
    try {
      // Try API first (with 2s timeout)
      const response = await fetchWithTimeout('/api/recommendations', { alertId }, 2000);
      return response;
    } catch (error) {
      // Fallback to precomputed
      this.activateOfflineMode();
      return OfflineFallback.precomputedRecommendations[alertId] || [];
    }
  }
}
```

**Key Modules:**
```
/src/demo/
  DemoScriptEngine.ts
  SceneSequencer.ts
  OfflineFallbackService.ts
  BoothOperatorControls.tsx
```

---

## Technology Stack

### Frontend
- **Framework:** React 18 (hooks, concurrent features)
- **3D Engine:** Three.js + React Three Fiber (declarative Three.js)
- **State Management:** Zustand (lightweight, performant)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Data Parsing:** PapaParse (CSV), native JSON
- **Animations:** Framer Motion (UI), GSAP (camera/entity)
- **Chat (optional):** Basic text input + OpenAI API (with fallback)

### Storage
- **IndexedDB:** Large datasets, scenarios, timelines
- **LocalStorage:** User preferences, last state
- **In-memory:** Current session cache

### Build & Dev
- **Build Tool:** Vite (fast dev server, optimized builds)
- **Language:** TypeScript (strict mode)
- **Linting:** ESLint + Prettier
- **Testing:** Vitest (unit), Playwright (E2E)

### Deployment (ICON)
- **Hosting:** Static SPA (bundled for offline use)
- **Assets:** All datasets and 3D models bundled
- **Fallback:** Service Worker for offline reliability

---

## Data Flow Examples

### Example 1: Loading a Dataset
```
User clicks dataset selector
  ↓
DataService.loadDataset('congestion_scenario')
  ↓
Check IndexedDB cache
  ↓ (cache miss)
Fetch CSV from /public/datasets/
  ↓
Validate schema
  ↓
Parse & transform entities
  ↓
Cache in IndexedDB
  ↓
Update AppState.data.currentDataset
  ↓
SceneService observes state change
  ↓
Update entity positions in Three.js scene
  ↓
MonitoringService recomputes KPIs
  ↓
Update AppState.monitoring.kpis
  ↓
KPIPanel re-renders with new values
```

### Example 2: Alert Detection and Explainability
```
Timeline advances to T=09:47
  ↓
TimelineService updates AppState.timeline.currentTime
  ↓
MonitoringService.tick() evaluates alert rules
  ↓
Threshold exceeded: worker_density > 0.8 in Zone-C
  ↓
AlertDetector.fireAlert('congestion-zone-c')
  ↓
ExplainerService generates explanation from template
  ↓
Update AppState.monitoring.alerts (new alert added)
  ↓
Update AppState.monitoring.activityFeed (new feed item)
  ↓
ActivityFeed component renders new item
  ↓
User clicks feed item → "View on map"
  ↓
CameraController.focusOn('Zone-C')
  ↓
OverlayRenderer activates heat_congestion overlay
  ↓
User clicks alert pin
  ↓
Open ExplainabilityPanel with alert data
```

### Example 3: Plan Tuning and Execution
```
User views recommendation options
  ↓
User clicks "Tweak plan"
  ↓
User types: "use 2 workers instead of 3"
  ↓
ChatService.parseConstraint(input)
  ↓
Detected: { type: 'quantity', resource: 'workers', value: 2 }
  ↓
PlanVariantMatcher finds closest pre-computed variant
  ↓
DiffGenerator compares original vs variant
  ↓
Update AppState.interaction.planDiff
  ↓
PlanTuningPanel renders diff + updated KPI deltas
  ↓
User clicks "Preview on map"
  ↓
SceneService highlights affected entities/zones
  ↓
User clicks "Execute"
  ↓
ScenarioService.switchScenario('variant_2workers')
  ↓
Load variant timeline data
  ↓
Interpolate from current state to new state
  ↓
Animate entities smoothly over 3 seconds
  ↓
Update KPIPanel with new metrics
  ↓
Show outcome validation dashboard
```

---

## Performance Considerations

### Rendering Budget (60 FPS = 16ms per frame)
- **Scene render:** <10ms (Three.js)
- **React render:** <4ms (UI updates)
- **State updates:** <1ms (Zustand)
- **Data processing:** <1ms (amortized via Web Workers)

### Optimization Strategies
1. **Entity Instancing:** Use Three.js InstancedMesh for repeated entities (workers, pallets)
2. **Level of Detail (LOD):** Reduce geometry complexity when camera is far
3. **Frustum Culling:** Only render entities in camera view
4. **Occlusion:** Hide entities blocked by warehouse structures
5. **Texture Atlasing:** Combine textures to reduce draw calls
6. **Lazy Loading:** Load datasets on-demand, preload next scenario
7. **Web Workers:** Offload CSV parsing and heavy computations
8. **Memoization:** Cache computed KPIs, heat maps
9. **Virtual Scrolling:** For large activity feeds and entity lists
10. **Debouncing:** Timeline scrubber updates throttled to 30Hz

### Memory Management
- **Entity Cap:** Max 200 entities visible at once
- **Timeline Frames:** Keep only ±30 seconds of frames in memory
- **Texture Resolution:** 1024×1024 max for ground/walls, 512×512 for props
- **Geometry Buffers:** Dispose unused geometries on scenario switch

---

## Security & Data Governance (MVP)

**MVP Scope:** Minimal security since no real user data or cloud storage

**Basic Measures:**
- Input validation on all CSV uploads
- XSS protection via React's built-in escaping
- No sensitive data stored (demo datasets only)

**Post-ICON (Production):**
- Auth (OAuth 2.0)
- RBAC for features
- Encrypted storage
- Audit logs
- GDPR compliance

---

## Testing Strategy

### Unit Tests (Vitest)
- **Coverage Target:** 60%+ for core services
- **Focus Areas:**
  - Data parsers and validators
  - KPI computation
  - Alert detection logic
  - Plan diff generation
  - Constraint parsing

### Integration Tests
- State management flows (load dataset → update scene)
- Timeline playback (play → pause → scrub → jump)
- Demo script execution (scene sequencer)

### E2E Tests (Playwright)
- **Critical Paths:**
  - Load app → select dataset → view KPIs → drill down
  - Trigger alert → view explainability → view recommendations
  - Tweak plan → preview → execute
  - Timeline replay → add annotation
  - Demo autoplay (full 8-minute sequence)

### Performance Tests
- FPS monitoring (target: 60 FPS sustained)
- Load time (target: <3s on booth hardware)
- Memory profiling (target: <500MB)

### Demo Rehearsal
- **20+ consecutive runs** without critical errors
- **Offline mode test:** Disable API, verify graceful fallback
- **Reset test:** Verify <10s reset time

---

## Deployment Architecture (ICON Booth)

```
┌───────────────────────────────────────┐
│   Booth Laptop (Windows/Mac)          │
│  ┌─────────────────────────────────┐  │
│  │  Chrome/Edge (fullscreen)       │  │
│  │  http://localhost:3000          │  │
│  │  (or file:// for offline)       │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  Static Build (dist/)           │  │
│  │  - HTML, CSS, JS (bundled)      │  │
│  │  - Datasets (CSV, JSON)         │  │
│  │  - 3D Models (GLB)              │  │
│  │  - Textures (PNG, JPG)          │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  Local HTTP Server (optional)   │  │
│  │  - Python SimpleHTTPServer      │  │
│  │  - OR serve via Vite preview    │  │
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
         │
         │ (Optional API calls)
         ▼
  ┌──────────────┐
  │  Cloud API   │
  │ (with 2s     │
  │  timeout)    │
  └──────────────┘
```

**Pre-Event Checklist:**
- [ ] Build app with production config
- [ ] Bundle all datasets (3+ scenarios)
- [ ] Test offline mode (disconnect network)
- [ ] Verify 60 FPS on booth hardware
- [ ] Run 20+ consecutive demo cycles
- [ ] Test reset (<10s)
- [ ] Preload all assets on app start
- [ ] Print backup QR codes for surveys

---

## Extension Points (Post-ICON)

**Designed for future extensibility:**

1. **Data Sources:** CSV → REST API → WebSocket streams
2. **Intelligence:** Rule-based → LLM-powered → ML models
3. **Collaboration:** Annotations → Real-time multi-user (WebRTC)
4. **Orchestration:** Simulated execution → Real WMS/WES integration
5. **Visualization:** Three.js primitives → Custom GLB models → Digital twin APIs

**Key abstraction layers to preserve:**
- DataService (swap CSV for API)
- IntelligenceService (swap templates for LLM)
- SceneService (swap primitives for detailed models)
- ChatService (swap rules for conversational AI)

---

## Appendix: State Model Reference

```typescript
// Complete State Model

// Scene State
interface CameraState {
  position: Vector3;
  target: Vector3;
  fov: number;
  isAnimating: boolean;
}

interface Entity {
  id: string;
  type: 'worker' | 'forklift' | 'pallet' | 'rack';
  position: Vector3;
  rotation: number;
  status: string;
  task?: string;
  metadata: Record<string, any>;
}

// Data State
interface WarehouseLayout {
  zones: Zone[];
  aisles: Aisle[];
  docks: Dock[];
  racks: Rack[];
  bounds: BoundingBox;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  timelineId: string;
  isBaseline: boolean;
}

// Monitoring State
interface KPI {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: number; // delta
  status: 'Normal' | 'Watch' | 'Critical';
  recency: number; // timestamp
  overlayType?: string;
}

interface Alert {
  id: string;
  type: string;
  title: string;
  location: Vector3;
  zone: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timestamp: number;
  explanation?: Explanation;
  recommendations?: RecommendationOption[];
}

interface FeedItem {
  id: string;
  state: 'Handled' | 'Monitoring' | 'NeedsAttention';
  title: string;
  location: string;
  timestamp: number;
  confidence: number;
  details?: string;
}

// Interaction State
interface DrillDownData {
  kpiId: string;
  drivers: Driver[];
  evidence: Evidence[];
}

interface Driver {
  label: string;
  value: number;
  contribution: number; // percentage
  zone: string;
}

// Timeline State
interface TimelineMarker {
  id: string;
  timestamp: number;
  type: 'alert' | 'decision' | 'annotation';
  label: string;
  location?: Vector3;
}

// Demo State
interface ScriptedAction {
  type: string;
  params: any;
  timestamp: number;
  waitForCompletion: boolean;
}
```

---

**End of Architecture Document**
