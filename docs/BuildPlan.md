# Warehouse Live - Build Plan
## Vertical Slices Strategy

Version: 0.1  
Date: 2 Feb 2026  
Status: Draft

---

## Overview

This build plan breaks down the Warehouse Live MVP into **6 vertical slices** that each deliver end-to-end value. Each slice builds on the previous, allowing incremental demos and validation while maintaining a working system at every stage.

**Key Principles:**
- Each slice is deployable and demonstrable
- No slice is "complete" until it's integrated with the full stack
- Prioritize core workflows over edge cases
- Build demo mode infrastructure early (Slice 1)
- Keep offline fallbacks in mind from the start

---

## Slice 1: Foundation & Basic Spatial Monitoring
**Goal:** Establish the spatial twin as the primary interface with basic data overlay capability

**Duration Estimate:** Foundation layer  
**Demo Value:** "Here's the warehouse floor with live worker and equipment positions"

### Capabilities
- **Warehouse Model Viewer**
  - Load pre-built 3D warehouse layout (static for MVP)
  - Basic camera controls (orbit, pan, zoom, focus)
  - Zone/aisle/dock labels rendered as overlays
  - Coordinate system established

- **Data Ingestion Pipeline**
  - CSV parser for `warehouse_layout.csv` and `warehouse_state.csv`
  - Schema validation with clear error messages
  - Sample datasets included (3 scenarios: normal, congestion, bottleneck)

- **Basic Entity Overlay**
  - Render workers, forklifts, and inventory as simple 3D primitives
  - Entity info cards on click (ID, status, task, location)
  - Entity filtering by type (workers/equipment/inventory)
  - Search by entity ID

- **Demo Mode Infrastructure**
  - Scene state management (current dataset, camera position, UI state)
  - Reset to default scenario button
  - Dataset selector dropdown
  - Pause/resume capability

### Technical Deliverables
- React app scaffold with Three.js integration
- State management setup (Context API or Zustand)
- CSV loading and validation utilities
- Basic 3D scene with coordinate mapping
- Entity component system
- Demo controller service

### Success Criteria
- Load warehouse layout in <2 seconds
- 60 FPS with 50+ entities visible
- Dataset switch with smooth transitions
- Clean error messages for malformed CSVs

---

## Slice 2: Health Monitoring & Spatial Overlays
**Goal:** Surface warehouse health instantly and connect metrics to spatial reality

**Duration Estimate:** Core monitoring layer  
**Demo Value:** "See the warehouse health at a glance and drill into problem areas"

### Capabilities
- **KPI/Vitals Panel**
  - Always-visible panel showing 4-6 key metrics
  - Role-based KPI sets (Manager vs Supervisor personas)
  - KPI states: value, trend (↑/↓), status (Normal/Watch/Critical), recency
  - Timestamp/data freshness indicators

- **Overlay System**
  - Heat map visualization engine (utilization, congestion, dwell time)
  - Gradient rendering on zones/aisles
  - Multiple overlay types selectable
  - Transparency controls
  - Color legend with thresholds

- **KPI-to-Map Linking**
  - Selecting a KPI activates corresponding overlay
  - Camera focuses on top contributing zones
  - Drill-down panel opens with drivers list
  - "View on map" interactions highlight specific areas

- **Spatial Highlighting**
  - Zone boundary pulsing for alerts
  - Entity highlighting (outline glow)
  - Animated camera transitions with easing

### Technical Deliverables
- KPI computation engine from CSV data
- Heat map shader/material system
- Camera animation controller
- Drill-down panel component
- Zone aggregation utilities
- Overlay blending system

### Success Criteria
- KPI panel visible within 1 second of load
- Heat map renders at 60 FPS
- KPI selection triggers overlay change in <500ms
- Top 3 drivers identified correctly for each KPI

---

## Slice 3: Intelligence Layer (Alerts & Autonomous Actions)
**Goal:** Show proactive detection, transparent auto-handling, and explainability

**Duration Estimate:** AI/Intelligence layer  
**Demo Value:** "The system detects problems before they escalate and handles minor issues automatically"

### Capabilities
- **Monitoring State & Triage**
  - Continuous background evaluation (simulated via CSV events)
  - Alert detection based on threshold rules
  - Three-tier categorization: Handled / Monitoring / Needs Attention
  - Overall health status indicator (Stable/Watch/At Risk)

- **Activity Feed**
  - Non-intrusive feed/toast stack
  - Item types: auto-handled fixes, monitored risks, attention needed
  - Each item shows: badge, title, location, timestamp, confidence
  - "View on map" action for each item
  - Filter toggles for Handled/Monitoring/Needs Attention

- **Alert System**
  - Alert pins anchored to zones/locations
  - Alert panel with confidence score and impact window
  - Camera auto-focus on alert zones
  - Alert priority sorting

- **Explainability Panel**
  - "Why" explanation with data factors
  - Spatial constraints visualization
  - Predicted impact metrics
  - Evidence links to contributing entities/zones
  - Drill-down to underlying threshold logic

- **Auto-Action Logging**
  - Mini-explain panel for "Handled" items
  - Before → After state summary
  - Expected impact/KPI delta
  - Reversibility via scenario switch

### Technical Deliverables
- Alert detection engine (rule-based for MVP)
- Activity feed component with real-time updates
- Alert panel with rich explainability UI
- Template-based explanation generator
- Confidence/impact scoring system
- Auto-action state tracking

### Success Criteria
- Alerts appear within 1 second of threshold breach
- Explainability panel loads in <300ms
- Auto-actions logged with full audit trail
- Feed supports 50+ items without performance degradation

---

## Slice 4: Recommendations & Plan Tuning
**Goal:** Provide actionable options and enable user-driven plan refinement

**Duration Estimate:** Action layer  
**Demo Value:** "Get smart recommendations, tweak them in plain language, and see the impact before committing"

### Capabilities
- **Recommendation Engine**
  - 2-3 intervention options per alert
  - Impact estimates (KPI deltas, time, cost)
  - Resource requirements (workers, equipment)
  - Risk assessment for each option

- **Plan Details View**
  - Concrete step-by-step plan (who/what/where/when)
  - Affected entities highlighted on map
  - Estimated timeline with milestones
  - Resource allocation visualization

- **Plan Tuning Interface**
  - Natural language input field for constraints
  - Supported constraint types:
    - Quantity: "use 2 workers instead of 3"
    - Lock/unlock: "don't move John", "keep Zone D free"
    - Time: "limit overtime to 30 mins"
    - Spatial: "avoid shipping dock", "stay in Zone A-C"
  - Instant plan regeneration (or switch to pre-computed variant)

- **Plan Preview & Diff**
  - Before/after comparison (steps, KPIs, map highlights)
  - Impact delta visualization
  - Validation warnings for constraint violations
  - "Preview on map" button
  - Apply/Revert/Tweak again actions

- **Execution Simulation**
  - "Execute" button triggers scenario switch
  - Smooth transition animation (interpolated state changes)
  - Progress indicator during transition
  - "Undo" capability to revert to baseline

### Technical Deliverables
- Recommendation data model and templates
- Plan diff algorithm
- Natural language constraint parser (or fallback to structured inputs)
- Scenario transition engine with interpolation
- Plan validation rules engine
- Pre-computed plan variants for demo reliability

### Success Criteria
- 2-3 relevant options generated per alert scenario
- Plan tuning responds in <2 seconds (regeneration or variant switch)
- Diff clearly shows changed steps and KPI deltas
- Execution transition smooth and trackable

---

## Slice 5: Timeline, Comparison & Collaboration
**Goal:** Enable temporal analysis, what-if comparison, and shift handover

**Duration Estimate:** Temporal layer  
**Demo Value:** "Replay history, compare scenarios side-by-side, and leave notes for the next shift"

### Capabilities
- **Timeline Replay**
  - Timeline scrubber (draggable)
  - Play/pause controls
  - Speed controls (1×/5×/10× playback)
  - Jump-to-moment chips for key events (alerts, decisions, annotations)
  - Current time indicator with absolute/relative display

- **Timeline Event Markers**
  - Alert fired markers
  - Decision executed markers
  - Annotation markers
  - Scenario switch markers
  - Marker legend and filtering

- **What-If Comparison View**
  - Side-by-side twin rendering (baseline vs intervention)
  - Synced timeline scrubbers
  - Metric delta panel (KPI comparison over time)
  - Divergence point indicator
  - Toggle between split and overlay modes

- **Spatial Annotations**
  - Pin creation on map (click to place)
  - Annotation form: text note, optional photo/audio upload
  - Annotation types: issue, fix, observation, handover note
  - Timestamp and location auto-captured
  - Annotation list view with filters

- **Shift Handover Summary**
  - Auto-generated summary of key events
  - List of decisions taken (who/when/what)
  - Outstanding issues requiring follow-up
  - Annotation export (JSON download)

### Technical Deliverables
- Timeline state management (time cursor, playback)
- Dual-scene renderer for comparison view
- Timeline interpolation engine
- Annotation data model and storage (JSON)
- Event marker system
- Playback controller with speed modulation
- Comparison sync logic

### Success Criteria
- Timeline scrubbing maintains 60 FPS
- Comparison view renders both scenarios at 45+ FPS
- Annotations persist across sessions (local storage)
- Jump-to-moment responds instantly

---

## Slice 6: Conversational UX & Demo Polish
**Goal:** Add agentic flavor with Q&A and prepare for ICON booth reliability

**Duration Estimate:** UX polish and demo hardening  
**Demo Value:** "Ask the system anything and get actionable answers; demo runs flawlessly"

### Capabilities
- **Conversational Interface**
  - Chat panel with message history
  - Supported query types:
    - Status: "what's happening", "how are we doing"
    - Spatial: "where is worker W-042", "why is Zone C red"
    - Options: "what are my options", "what should I do"
    - Navigation: "show me the shipping dock", "highlight congestion"
  - Actionable response chips (camera actions, panel opens, filters)
  - Typing indicators and loading states

- **Plan Tuning in Chat**
  - Conversational constraint input post-recommendation
  - "Change that plan to use 2 workers, not 3"
  - System responds with "Preview changes" and "Apply" action chips
  - Chat history shows plan evolution

- **Offline Fallback System**
  - Canned responses mapped to scenario states
  - Detection of API unavailability
  - Seamless fallback without user-facing errors
  - "Limited mode" indicator (subtle)

- **Demo Mode Enhancements**
  - Scripted autoplay sequence (9 scenes from Section 11)
  - Per-scene timing and user input prompts
  - Demo progress indicator (optional)
  - Booth operator controls (skip scene, restart, pause)
  - Demo reset in <10 seconds

- **Performance & Polish**
  - Loading states for all async operations
  - Error boundaries with graceful degradation
  - Smooth transitions and animations (easing)
  - Accessibility basics (keyboard nav, screen reader labels)
  - Responsive layout for booth screens (4K)
  - Asset optimization (textures, models)

- **Reliability Features**
  - Health check endpoint
  - Asset preloading
  - Retry logic for data loading
  - Connection status indicator
  - Offline data caching

### Technical Deliverables
- Chat component with action chip renderer
- Intent detection for conversational queries (rule-based + optional LLM)
- Fallback response library
- Demo script engine (scene sequencer)
- Performance monitoring hooks
- Asset preloader
- Error tracking and recovery

### Success Criteria
- Chat responds to 80% of expected queries
- Fallback mode activates within 2 seconds of API failure
- Demo autoplay runs for 8 minutes without intervention
- Reset to start in <10 seconds
- 60 FPS sustained on target hardware
- No critical errors during 20+ consecutive demo runs

---

## Architecture Proposal

See detailed architecture in **Architecture.md** (next section), but key components:

### State Model
```
AppState
├── SceneState (current 3D view, camera, entities)
├── DataState (loaded CSVs, scenarios, timelines)
├── MonitoringState (alerts, feed items, KPIs)
├── InteractionState (selected entities, panels, overlays)
├── TimelineState (current time, playback, comparison)
└── DemoState (script, scene, autoplay status)
```

### Core Layers
1. **Presentation Layer** - React components, Three.js scene
2. **Application Layer** - State management, business logic
3. **Data Layer** - CSV parsing, validation, caching
4. **Intelligence Layer** - Alert detection, recommendation generation, explainability
5. **Demo Layer** - Script sequencing, offline fallbacks

---

## Demo Mode Strategy

### Scripted Demo Sequence (8-10 minutes)
Mapped to ICON storyline (Section 11):

1. **Opening: Glanceable Health (30s)**
   - Auto-load "normal operations" dataset
   - KPI panel shows healthy metrics
   - Narrator: "Warehouse Live gives you instant visibility..."

2. **Scene: Quiet Autonomy (45s)**
   - Activity feed shows 3-4 "Handled" items
   - Narrator selects one, mini-explain panel opens
   - Status indicator shows "Stable"

3. **Scene: Proactive Warning (60s)**
   - Timeline auto-advances to congestion event
   - Alert fires, camera focuses, heat map activates
   - Alert panel opens automatically

4. **Scene: Visual Explainability (45s)**
   - Explainability panel auto-expands
   - Data factors, spatial constraints, impact shown
   - Evidence rows highlight on hover (scripted)

5. **Scene: Options (60s)**
   - Recommendation cards appear
   - Side-by-side comparison auto-opens
   - Metric deltas highlighted

6. **Scene: Tweak the Plan (90s)**
   - Narrator types: "use 2 workers instead of 3"
   - System shows plan diff + updated deltas
   - "Preview on map" highlights affected zones
   - Narrator clicks "Execute"

7. **Scene: Execute & Validate (45s)**
   - Scenario transition animation
   - Outcome dashboard appears
   - KPIs show improvement

8. **Scene: Timeline & Annotations (45s)**
   - Switch to timeline replay
   - Scrub back to congestion moment
   - Add annotation pin
   - Jump back to current

9. **Scene: Ask Anything (60s)**
   - Open chat panel
   - Type: "where is worker W-042"
   - System responds with map highlight + action chip
   - Type: "what should I do about Zone C"
   - System shows options recap

10. **Closing: Reset (15s)**
    - "Thank you" screen
    - Auto-reset to Scene 1 after 10 seconds

### Interactive Mode
- Disable autoplay
- All features manually accessible
- Booth operator can:
  - Switch datasets
  - Jump to specific scenes
  - Trigger alerts manually
  - Answer "what if" questions live

### Offline Fallback Strategy
**Problem:** AI services (LLM, recommendation engine) may be unreliable at booth

**Solution:**

1. **Pre-compute Everything Possible**
   - Alert explanations (template-based from CSV)
   - Recommendations (2-3 options per alert, pre-defined)
   - Plan variants for common tweaks
   - Chat responses for top 20 queries

2. **Detect API Failures Fast**
   - Timeout: 2 seconds max
   - Retry: 1 attempt, then fallback
   - Health check on app load

3. **Graceful Degradation**
   - Switch to pre-computed responses
   - Disable plan tuning (or limit to pre-defined variants)
   - Chat shows "Limited mode: showing prepared answers"
   - No visible errors; system "just works"

4. **Offline-First Architecture**
   - All demo datasets bundled with app
   - Scenarios pre-loaded on app start
   - Assets cached aggressively
   - IndexedDB for persistence

### Offline Feedback Collection
**Goal:** Gather visitor reactions and questions without internet dependency

**Strategy:**

1. **Local Feedback Capture**
   - Lightweight form at end of demo: rating (1-5), comment (optional)
   - Booth operator notes field
   - Timestamped entries
   - Stored in browser IndexedDB

2. **Sync When Online**
   - Background sync when connection available
   - Batch upload to cloud endpoint
   - Conflict-free append-only log

3. **Physical Fallback**
   - QR code for post-event survey
   - Business card drop box with "Learn more" URL

4. **Analytics Tracking**
   - Scene completion rates (which scenes were watched)
   - Interaction heatmap (what was clicked)
   - Time spent per scene
   - Demo resets/restarts
   - All logged locally, synced later

---

## Risk Mitigation by Slice

| Risk | Slice | Mitigation |
|------|-------|------------|
| Performance degradation with large datasets | 1, 2 | Cap entities at 100, LOD system, instanced rendering |
| AI services fail at booth | 3, 4, 6 | Offline fallback, pre-computed responses, graceful degradation |
| CSV schema confusion | 1 | In-app validator, sample templates, clear error messages |
| Timeline interpolation jank | 5 | Cap frame interpolation, use easing, optimize render loop |
| Demo timing issues | 6 | Scene-based autoplay, manual skip controls, fast reset |
| 3D complexity slows development | 1 | Start with primitives, add GLB models in later slices if time |
| Scope creep | All | Lock MVP scope per slice, track backlog separately |

---

## Success Criteria for ICON

**Demo Reliability:**
- 20+ consecutive demos without critical failure
- Reset-to-start in <10 seconds
- 60 FPS on booth hardware (4K displays)

**Engagement:**
- Visitors ask "how does this connect to our data?"
- "Wow" reaction at explainability and plan tuning scenes
- Requests for follow-up meetings

**Technical Proof:**
- All 6 slices integrated and working
- Offline mode tested and reliable
- 3 complete datasets (normal, congestion, bottleneck)
- Demo script executable in auto and interactive modes

---

## Post-ICON Backlog (Out of Scope for MVP)

**Deferred to North Star:**
- Blueprint upload and AI-generated warehouse layout
- Natural language warehouse editing
- Custom GLB model upload and replacement
- Real-time integrations (WMS/WES/IoT)
- Streaming updates (WebSocket)
- Multi-user real-time collaboration
- RBAC and user management
- Multi-site views
- Probabilistic forecasting
- Closed-loop autonomous execution
- Robotics orchestration

**Technical Debt to Address Post-ICON:**
- Unit test coverage (aim for 60%+)
- E2E testing for demo flows
- Performance profiling and optimization
- Accessibility audit
- Internationalization (i18n)
- Documentation (API, CSV schemas, deployment)

---

## Dependencies & Prerequisites

**Before Slice 1:**
- Design system / component library decision
- Three.js setup and basic scene example
- CSV schema finalized (at least warehouse_state and warehouse_layout)
- Sample datasets created (3 scenarios minimum)
- Development environment setup (Node, React, Three.js)

**Before Slice 3:**
- Alert detection rules defined
- Explainability templates authored
- Confidence/impact scoring logic agreed

**Before Slice 4:**
- Recommendation options defined per scenario
- Plan tuning constraints list finalized
- Pre-computed plan variants created

**Before Slice 6:**
- Demo script written (scene-by-scene)
- Top 20 chat queries and responses authored
- Booth hardware specs confirmed

---

## Timeline Checkpoints (Placeholder for PM)

- **Slice 1 Complete:** Foundation ready for data overlays
- **Slice 2 Complete:** Health monitoring demo-ready
- **Slice 3 Complete:** Intelligence layer showcases proactive detection
- **Slice 4 Complete:** Full decision loop (alert → recommend → tweak → execute)
- **Slice 5 Complete:** Temporal analysis and collaboration in place
- **Slice 6 Complete:** ICON-ready demo, rehearsed and hardened

**Integration Checkpoints:**
- After Slice 2: First end-to-end demo (load → view KPIs → drill down)
- After Slice 4: Full decision cycle demo
- After Slice 6: ICON rehearsal (internal, then with stakeholders)

---

## Notes for Implementation

- **Build in slices, not layers:** Avoid building "all UI" then "all data layer" then "all AI." Each slice should go full-stack.
- **Demo mode is a first-class feature:** Don't treat it as an afterthought. Build the script engine early and test every slice in demo mode.
- **Offline fallbacks are non-negotiable:** Assume AI services will fail at the worst possible moment. Pre-compute aggressively.
- **Performance budget:** Profile after every slice. If FPS drops below 50, stop and optimize before moving on.
- **Test on target hardware early:** Booth laptops may not match dev machines. Test on real hardware by Slice 3.

---

**End of Build Plan**
