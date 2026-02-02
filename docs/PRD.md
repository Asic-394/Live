Warehouse Live: ICON 2026 MVP PRD

Product Requirements Document (PRD)

| Document status | Draft (for rapid prototyping) |
| --- | --- |
| Version | 0.1 |
| Date | 30 Jan 2026 |
| Authors | Rahul Krishnan, Asic Hussain, Pankaj Rathoure |
| Primary audience | Panasonic team + BY UX Team (ICON build) |
| Primary artifact | Interactive web prototype (React + Three.js) + scripted demo mode |

# 1. Problem Statement & Vision

Warehouse operations are increasingly complex, fast-moving, and exception-driven. Teams need a single, trustworthy decision surface that makes the current state obvious, surfaces emerging risk early, and helps coordinate action across people, processes, and devices.

Warehouse Live is an immersive command center that embeds spatial intelligence directly into warehouse workflows, turning fragmented, reactive operations into proactive, unified execution.

# 2. Goals

- Deliver an ICON-ready demo that clearly communicates the *future-state* Warehouse Live vision, while being buildable with today’s prototype foundations (CSV-driven simulation + lightweight AI).
- Demonstrate spatial monitoring (heat maps + overlays) as the primary decision surface, with drill-down + search to build credibility.
- Show an ‘intelligence layer’ (alerts + explainability + recommendations) that feels agentic, even if partially simulated/hard-coded.
- Make AI feel like a co-worker: the system quietly handles low-impact “noise” in the background and keeps the user informed, so users focus only on high-impact decisions.
- User empowerment: when recommendations are generated, the user can tweak the plan using natural language and instantly preview the updated outcome before executing.
- Show an orchestration moment: user chooses an option and the system ‘pushes’ changes across map + devices.
- Enable an on-rails ‘demo mode’ and an ‘interactive mode’ for deeper conversations at the booth.
# 3. Non-Goals (MVP constraints)

- Not a production-grade WMS replacement; this is a prototype / experience wrapper.
- No requirement for fully realistic 3D at real-world scale; prioritize clarity, performance, and trust over fidelity.
- No need for real-time integrations for ICON; CSV and precomputed scenarios are acceptable, as long as we communicate intended extensibility.
# 4. Key Insights from Customer Research (Design Requirements)

- Heat maps are the most universally valuable capability and should be treated as the primary decision surface.
- Users want *patterns and flow* more than surveillance-style individual tracking; individual tracking matters mainly when tied to exceptions.
- High-level visuals must support drill-down, search, and data validation—otherwise they are perceived as ‘marketing’ rather than functional.
- Scalability + responsiveness matter more than lifelike 3D; an abstracted/hybrid model is more credible.
# 5. Target Users & Personas (ICON demo)

- Warehouse Manager / Ops Manager (primary): monitors health, manages exceptions, reallocates resources.
- Shift Supervisor (secondary): coordinates floor action, confirms outcomes, captures shift notes.
- IT / Solution Architect (buyer influencer): cares about integration, data pipeline, governance, scalability.
# 6. Product Definitions

## Core Concepts

- **Digital Twin****/ Spatial Twin** (Warehouse Model): a navigable spatial model of the facility (zones/aisles/racks/docks), not necessarily photorealistic.
- **Live Layer**: real-time or simulated operational state rendered on the twin (people/equipment/inventory/work queues).
- KPI / Vitals Panel: a glanceable, role-based set of real-time health metrics displayed on top of the twin or a separate panel(e.g., Throughput, Orders at Risk, Dock Utilization, Labor Utilization).
- **Overlay**** / Lens**: a visualization on the twin (heat map, icons, paths, boundaries, labels).
- Monitoring State: the system’s default operating mode where it continuously evaluates signals, surfaces risk, and (when safe) takes low-impact actions.
- **Autonomous Micro-Action** (Auto-handled fix): a low-impact corrective action the system can perform automatically (e.g., micro-rebalance, auto-reroute, auto-prioritize a small set of tasks) with a logged explanation.
- **Activity Feed** (Quiet Ops Log): an on-screen stream summarizing what the system has handled (“Handled”), what it’s watching (“Monitoring”), and what needs human attention (“Needs Attention”).
- **Alert**: a detected risk pattern bound to a place/time (e.g., ‘Potential bottleneck in Zone C’) with confidence + impact window.
- **Explainability (Glass-box)**: the ‘why’ behind an alert, expressed as data factors + spatial constraints + predicted impact.
- **Recommendation / Option**: a proposed intervention (resource move, reroute, delay wave) with estimated impact + cost.
- **Plan**: a concrete, executable set of changes (who/what/where/when) produced by the system as a recommended option.
- **Plan Tuning** (Natural-language constraints): the user edits a recommended plan by describing constraints or alternatives in plain language (e.g., “use 2 instead of 3”, “don’t move John”, “avoid Zone D”, “limit overtime to 30 mins”) and the system regenerates the plan + impact.
- **Timeline Replay**: playback of warehouse state over time (time scrubber + 1×/5×/10×).
- **Scenario**: a specific timeline dataset (e.g., ‘Base future’ vs ‘After intervention’) enabling side-by-side comparison.
- **Annotation**: a spatial note (text/photo/audio) anchored to a location and timestamp for shift handover / learning.
- **Demo Mode**: scripted autoplay sequence with controlled user inputs for reliability at ICON.
# 7. MVP Scope for ICON 2026 (April)

## Must-Have Capabilities

- **Warehouse creation**: upload blueprint → generate baseline 3D model (editable via prompt).
- **Data ingestion**: upload CSV snapshots/timelines to populate workers/equipment/inventory + metrics.
- Warehouse Health KPI Panel / Vitals: a role-based KPI strip/panel visible by default in Live view; selecting a KPI activates a matching overlay on the twin and opens drill-down.
- **Autonomous Micro-Actions + Activity Feed**: the system operates in a constant Monitoring State and quietly auto-handles low-impact issues; the user sees a feed of items marked “Handled” and “Monitoring”, plus an overall status.
- **Spatial monitoring**: heat map overlays + alert pins; camera focus to affected zone.
- **Explainability**: Alert panel that explains *why* the alert fired (data + geometry + impact).
- **Recommendations**: 2–3 options + ‘execute’ one option (simulated).
- **Plan ****tuning** via natural language — user can tweak a recommended option (constraints + “what if”) and instantly preview the updated plan + projected impact before executing.
- **Timeline replay**: scrub + play + jump to key moments.
- **What-if comparison**: side-by-side view of two scenarios (before vs after).
- **Conversational interface**: Q&A about the current state and ‘what are my options’ (can be Agent-backed or simulated fallback).
- **Collaboration-lite**: annotations for shift handover (stored in JSON); optional multi-user cursors if time permits.
- **Demo operations**: reset button, dataset selector, offline fallback if AI is down.
## Nice-to-Have (if time permits)

- **Multi-user real-time sync** (WebSocket) for ‘spatial collaboration’ moment.
- **Multi-device view simulation** (picture-in-picture) with static device frames and notifications.
# 8. User Experience Principles

- **Spatial-first**: the map is the home; panels and charts support—not replace—the twin.
- **Empowerment over automation**: recommendations should be editable; users can adjust constraints in natural language and see the trade-offs instantly, rather than accepting a “black-box” plan.
- Glanceable health: users should understand “how the warehouse is doing” within 3–5 seconds via a KPI/Vitals panel visible on top of the twin.
- Numbers ↔ spatial linkage: selecting a KPI should activate the relevant overlay on the map and show what’s driving the number.
- **Quiet autonomy**: the system should reduce operational noise by auto-handling low-impact issues and logging them clearly, so humans focus on exceptions that matter.
- **Always inform, never surprise**: every auto-action must leave an evidence trail (what/why/when) and be reversible in demo via scenario switch.
- Action first, explain later: every alert will show the AI recommended actions first, it will also have an accessible ‘why’ and a link to evidence.
- **Progressive disclosure**: overview → drill-down → operational detail; never a dead-end.
- **Confidence & transparency**: show data recency + confidence where relevant.
- **Performance over realism**: keep interactions fluid; prefer abstract visuals when necessary.

# 9. Functional Requirements (Detailed)

## 9.1 Warehouse Creation & Editing

- Upload: Accept blueprint image/PDF → generate a baseline warehouse layout in 3D.
- Edit via natural language: ‘add 3 dock doors on the south wall’, ‘make Zone C wider’, ‘add racks in Aisle 14’.
- Replace primitives with custom 3D models (GLB) for key objects (racks, forklifts, pallets).
- Persist a ‘Warehouse Project’ with layout + metadata + linked datasets.
## 9.2 Data Ingestion & State Model

- Upload CSV ‘snapshot’ to place entities (workers, forklifts, inventory, zones) on the model.
- Upload CSV ‘timeline’ to animate movement and state changes over time.
- Validate uploads: schema check + basic error messaging + sample template download.
- Map entities to spatial coordinates; support per-zone aggregation for heat map computation.
## 9.4 Warehouse Health KPI Panel/Vitals

- Always-visible (Live): Show a compact KPI Strip/Panel over or beside the twin that surfaces warehouse health immediately.
- Role-based defaults: KPI set differs by persona. For example,
- **Warehouse/Operations Manager**: Throughput, Orders at Risk, Labor Utilization, Dock Utilization, Inventory Accuracy (if available), Safety Incidents (if available).
- **Supervisor**: Active Tasks, Pick Rate, Congestion Hotspots, Equipment Availability, Exceptions Queue.
- KPI States:** **Each KPI can show value, trend/delta (↑/↓), status state (Normal /Watch /Critical), and timestamp/recency.
- KPI → Overlay linkage: selecting a KPI should: activate the corresponding overlay (heat map or lens),
- focus/highlight the top contributing zones/entities,
- open a drill-down panel showing the drivers and evidence.
- Drill-down evidence: include top drivers (zones/aisles), supporting metrics, and “view on map” interactions.
- Demo-friendly: allow KPI values to be driven by the same CSV/timeline datasets, with scripted ‘spikes’ at key moments for the narrative.
## 9.5 Spatial Monitoring (Overlays)

(Linked to KPIs) When a KPI is selected, the map should automatically switch to the most relevant overlay and emphasize the top drivers for that KPI.

- Heat map overlay for selected metric (utilization, congestion, dwell time, safety risk).
- Alert pins/badges anchored to zones/locations; clicking opens explainability panel.
- Focus behavior: clicking an alert animates camera to location + applies highlight boundary + fades relevant overlay in.
- Layer controls: toggle overlays, adjust transparency, filter entity types, time range.
## Alerts & Explainability (Lightweight AI Layer)

### 9.6.1 Monitoring & Triage

- Always-on monitoring: system continuously evaluates live signals in the background.
- Triage states: categorize items into Handled, Monitoring, or Needs Attention.
- Escalation rules: only promote to Needs Attention when impact/likelihood crosses thresholds.
- Noise reduction: prioritize auto-handling repetitive, low-impact issues.
- Overall health: show a simple status label (e.g., Stable / Watch / At Risk) derived from KPI thresholds.
### 9.6.2 Activity Feed UI

- Non-intrusive feed: compact stream (toast stack or right-side 'Ops Log') visible in Live.
- Each item shows: state badge + short title + location.
- Trust metadata: timestamp/recency + confidence.
- Map linkage: "View on map" focuses camera + highlights impacted area/entities.
- Filtering: quick toggle for Handled / Monitoring / Needs Attention (and optional search).
### 9.6.3 Auto-Action Explainability & Guardrails

- Mini-explain panel: click a feed item to see trigger signals + thresholds.
- What changed: before ‚Üí after summary of the micro-action (steps/entities).
- Expected impact: small KPI delta / risk reduction estimate.
- Reversible by design: provide undo (demo) via scenario switch or rollback state.
- Safety boundary: auto-actions limited to low-impact + reversible; anything higher-impact becomes a recommendation.
### 9.6.4 Actions requiring human intervention

- Rule-based detection for ICON (thresholds on utilization, worker density, staging capacity).
- Explainability panel content generated from templates with variables from CSV (data factors + spatial constraints + predicted impact).
- Evidence links: show the exact metric thresholds and the entities/areas contributing to the alert.
- Confidence score and impact window displayed with the alert.
## 9.7 Plan Tuning (Natural Language)

- Tweak in place: each recommendation includes a “Tweak plan” input (text/voice) for constraints and “what-if” changes.
- Support common edits: quantity changes, lock/unlock resources, spatial/time/policy constraints (ICON MVP set).
- Instant preview: regenerate the plan and show before/after diff + updated KPI deltas + map highlights.
- Guardrails: validate capacity/safety/SLA; if invalid, explain why and suggest an alternative tweak.
- Demo fallback: if live regeneration isn’t available, switch to the closest precomputed variant and label it clearly.
## 9.8 Recommendations, Execution, and Validation

- Show 2–3 interventions (‘Options’) with estimated impact, cost, and time-to-execute.
- Execute option: triggers scenario switch or transition CSV; map updates smoothly via interpolation.
- Outcome validation dashboard after execution: show KPIs and ‘bottleneck prevented’ style confirmation.
- Support ‘undo’ by switching back to baseline scenario.
## 9.9 Timeline Replay & What-if Comparison

- Timeline controller: play/pause, scrubber, 1×/5×/10×, jump-to-moment chips.
- Scenario comparison view: side-by-side twin render + synced timeline; show metric deltas.
- Markers for key events (alerts fired, decisions made, annotations).
## 9.10 Conversational UX (Agentic Flavor)

- Plan tuning in chat:  after options are shown, the user can say “change that plan to use 2 workers, not 3” or “avoid Zone D” and the system updates the plan + impact with clickable ‘Preview changes’ and ‘Apply’ actions.
- Chat panel can answer: ‘what’s happening’, ‘why is Zone C red’, ‘what are my options’, ‘show me where SKU 4472 is’ (at least partially).
- For ICON reliability: provide fallback ‘canned’ responses mapped to scenario state if API is unavailable.
- Chat actions: allow ‘highlight Zone C’, ‘open comparison’, ‘jump to 09:47’ as clickable action chips.
## 9.11 Collaboration & Shift Handover (Lite)

- Create spatial annotations: pin on map + text note + optional photo/audio (pre-recorded acceptable).
- Annotation timeline markers; clicking marker jumps timeline to that time/location.
- Basic change history: list of decisions taken in the scenario (who/when/what) — can be simulated for demo.
# 10. Data & Integration Contracts (Prototype-first)

## 10.1 CSV File Types (ICON)

Use these formats to drive the demo. Schemas can evolve, but keep them stable for ICON rehearsals.

- warehouse_layout.csv — defines zones/aisles/racks/docks + coordinates and dimensions.
- warehouse_state.csv — snapshot of entities at time T (workers/equipment/inventory).
- warehouse_timeline_{scenario}.csv — time-series states (movement + status changes).
- alerts.csv — alert definitions + thresholds + bindings to zones/metrics.
- annotations.json — collaboration artifacts (pins + media + timestamps).
## 10.2 Example Row (warehouse_state.csv)

timestamp,entity_type,entity_id,zone,x,y,z,status,task,metadata

2026-04-15T08:00:00,worker,W-042,Zone-C,245.5,112.3,0,active,picking,"{\"sku\":\"4472\"}"

# 11. Demo Storyline Mapping (What we show at ICON)

The ICON narrative should map to product capabilities so the build team can prioritize by scene.

Scene: Glanceable health → KPI/Vitals panel visible by default; user taps ‘Orders at Risk’ to activate overlay and focus.

Scene: Quiet autonomy → Activity Feed shows auto-handled items and an overall status.

- Scene: Proactive warning → Alert triggers + camera focus + heat map overlay.
- Scene: Visual explainability → Explainability panel with data + spatial constraints + predicted impact.
- Scene: Options → Recommendation cards + side-by-side comparison.
- Scene: Tweak the plan → user converses in natural language; system regenerates the plan, shows a diff + updated KPI deltas, then the user executes.
- Scene: Execute → scenario switch + multi-device simulation (optional).
- Scene: Validate & learn → outcomes dashboard + shift handover annotations.
- Scene: Ask anything → conversational Q&A + actionable chips.
# 12. Success Metrics (Prototype)

- Qualitative: ‘Wow’ reaction at proactive detection and explainability; visitors ask how it connects to their data.
- Demo reliability: no critical failures; reset-to-start in <30 seconds; 60 FPS on booth hardware.
- Sales enablement: clear articulation of differentiation (spatial + agentic + explainable + orchestration).
# 13. Risks & Mitigations

- Performance issues with large scenes → use abstract/hybrid rendering, LOD, reduce polycount, cap visible entities.
- AI unreliability at booth → provide offline fallback responses; precompute recommendations and explainability.
- Data confusion (CSV schemas) → ship templates + in-app validator + sample datasets.
- Scope creep → lock ICON MVP scope; everything else goes to post-ICON backlog.
# 14. Backlog Beyond ICON (North Star)

- Real integrations (WMS/WES/IoT), streaming updates, RBAC, multi-site views.
- Probabilistic forecasting and continuous learning (‘Adaptive Intelligence Service’).
- Autonomous agents for reconciliation and execution control (closed-loop action).
- Robotics orchestration and unified execution control as a cross-vendor layer.
# Appendix A — Use Cases (PRD-style)

## UC-01: Create Warehouse Digital Twin from Blueprint

**Goal**: Generate a usable spatial warehouse model quickly for monitoring and simulation.

**Primary Actor**: Warehouse Manager / IT Lead

Upload blueprint → baseline 3D layout generated; user can edit via natural language; project saved.

**Preconditions**

- Blueprint available (image/PDF).
- User has project permissions.
**Trigger**

User selects ‘Create Warehouse’ and uploads blueprint.

**Main Flow**

1. System generates baseline twin with zones, aisles, docks, racks (primitives).
2. System shows editable preview + quick fixes (rotate/scale/align).
3. User prompts edits (e.g., ‘add 6 receiving doors’); system applies and highlights changes.
4. User saves as a Warehouse Project.
**Postconditions**

- Warehouse Project saved with layout + coordinates; ready for CSV overlays.
**Alternate / Exception Flows**

- E1: Low-quality blueprint → ask for scale reference; allow manual calibration.
- E2: Generation fails → load a starter template warehouse.
## UC-02: Overlay Live/Snapshotted Warehouse State from CSV

**Goal**: Populate the twin with operational entities and make the ‘now’ visible.

**Primary Actor**: Ops Manager / Supervisor

Upload warehouse_state.csv → workers/equipment/inventory appear on the map; recency shown.

**Preconditions**

- Warehouse Project exists.
- CSV matches schema.
**Trigger**

User uploads a snapshot CSV.

**Main Flow**

1. System validates schema and reports row count / errors.
2. Entities are placed on the twin; legend appears.
3. User filters entity types and searches by ID (worker, forklift, SKU).
**Postconditions**

- Map reflects the uploaded snapshot; users can click entities for details.
**Alternate / Exception Flows**

- E1: Unknown entity IDs → show as ‘unmapped’ and prompt mapping.
- E2: Missing coords → place at zone centroid with warning.

## UC-02A: View Warehouse Health via KPI/Vitals Panel

Goal: Let the user gauge warehouse health instantly and connect numbers to spatial causes.

Primary Actor: Warehouse Manager / Shift Supervisor

Vitals panel is visible by default in Live; selecting a KPI activates an overlay and shows drivers.

**Preconditions**

- Warehouse Project exists.
- Snapshot or timeline data loaded with KPI fields.
**Trigger**

User enters Live view (or loads a dataset).

**Main Flow**

- System shows Vitals panel with role-based KPIs, each with value + trend + status state + recency.
- User taps a KPI (e.g., ‘Orders at Risk’).
- System activates the linked overlay (e.g., risk heat map) and focuses the top contributing zone(s).
- System opens a drill-down view listing drivers (zones/entities) with evidence and ‘view on map’ interactions.
- User optionally switches KPI (e.g., ‘Labor Utilization’) and sees the overlay/drivers update accordingly.
**Postconditions**

User understands overall health and can pinpoint spatial drivers for out-of-range KPIs.

**Alternate / Exception Flows**

- E1: KPI data missing → show ‘N/A’ with reason (no feed / schema missing) and keep overlay off.
- E2: Too many drivers → show top 5 plus ‘view all’ in drill-down.
## UC-02B: Auto-Handle Minor Fixes (AI Co-worker)

Goal: Demonstrate autonomous, low-impact decisioning that reduces operational noise.

Primary Actor: System (with visibility to Manager/Supervisor)

System detects a low-impact issue, applies a reversible fix, and logs it as “Handled” while keeping the user informed.

**Preconditions**

- Live view is active (Monitoring State).
- Rules/heuristics for micro-actions exist.
- Scenario/dataset supports a before/after state (or scripted change).
**Trigger**

A low-impact condition is detected (e.g., small queue imbalance, minor congestion, micro-priority conflict).

**Main Flow**

- System detects the condition and classifies it as low-impact.
- System applies a micro-action (e.g., reassign a small batch of tasks, re-route a short path, adjust a minor priority).
- Activity Feed shows an item marked Handled with a short summary + location.
- User clicks the feed item → mini-explain panel shows what/why + evidence and “View on map”.
- System keeps higher-risk items as Monitoring and escalates only when thresholds worsen.
**Postconditions**

Low-impact noise is resolved without human intervention, and trust is built through transparent logging.

**Alternate / Exception Flows**

- E1: Confidence low → mark as Monitoring (no auto-action).
- E2: Potential high-impact → escalate to Needs Attention with recommendations.
## UC-03: Detect a Bottleneck and Explain Why (Lightweight AI)

**Goal:** Surface emerging risk and build trust via glass-box explainability.

**Primary Actor:** Ops Manager

System triggers alert when thresholds exceeded; focuses map; explainability panel shows drivers.

**Preconditions**

- Alert rules exist (alerts.csv).
- Heat map metric available in data.
**Trigger**

Timeline reaches a moment where thresholds are crossed (or user scrubs to it).

**Main Flow**

1. Alert appears with confidence + impact window.
2. Camera glides to affected zone; heat map fades in; boundary pulses.
3. User opens explainability panel to see: data factors, spatial constraints, predicted impact.
4. User can click evidence rows to highlight contributing entities/paths.
**Postconditions**

- User understands where/why risk is forming and can act.
**Alternate / Exception Flows**

- E1: Missing data for a factor → show ‘not available’ and reduce confidence.
- E2: Too many alerts → collapse into grouped alert summary by zone.
## UC-04: Compare Options and Execute an Intervention

**Goal**: Let users choose an action and immediately see the effect.

**Primary Actor**: Ops Manager

Show 2–3 options; side-by-side comparison; execute triggers scenario switch and updates the map.

**Preconditions**

- At least 2 scenarios available (baseline + intervention).
**Trigger**

User clicks one of the alert recommendations or asks natural language questions.

**Main Flow**

1. System presents options with impact estimates + time + cost.
2. User opens side-by-side view (baseline vs option).
3. User clicks ‘Execute option’ → map transitions via transition CSV.
4. System shows outcome dashboard (orders saved, utilization peak reduced, SLA misses avoided).
**Postconditions**

- Intervention applied (simulated) and outcomes are visible.
**Alternate / Exception Flows**

- E1: Execute fails → stay in baseline and show error + retry.
- E2: Option data not loaded → show ‘loading’ and offer another option.
## UC-04A: Tweak a Recommended Plan via Natural Language

Goal: Empower the user to adjust a recommended plan (constraints + “what if”) and instantly see the trade-offs.

Primary Actor: Ops Manager / Shift Supervisor

User edits a recommended plan in plain language; system regenerates steps + projected impact + spatial highlights.

**Preconditions**

- A recommendation/option is available.
- Baseline + at least one scenario/variant can be previewed (generated or precomputed).
**Trigger**

User selects “Tweak plan” or types a constraint (e.g., “use 2 instead of 3”).

**Main Flow**

- System shows the recommended plan steps and projected impact.
- User enters a tweak (quantity/lock/spatial/time/policy).
- System validates the request and regenerates a modified plan.
- System shows a before/after diff (steps + KPIs) and updates map highlights.
- User chooses: Preview**, **Execute, or** **Revert**.**
**Postconditions**

User has a tailored plan they trust, with clear trade-offs.

**Alternate / Exception Flows**

- E1: Tweak violates constraints → explain failure + propose an alternative tweak.
- E2: Regen unavailable → switch to closest precomputed variant and clearly label it as such.

## UC-05: Timeline Replay + Shift Handover Notes

**Goal:** Review what happened and preserve learning across shifts.

**Primary Actor:** Shift Supervisor

User scrubs timeline, sees alert markers; adds annotations pinned to locations and times.

**Preconditions**

- Timeline dataset exists.
- Annotation storage (JSON) enabled.
**Trigger**

User turns on ‘Shift Handover Mode’.

**Main Flow**

1. Timeline shows markers for alerts and decisions.
2. User adds a pin at Zone C 09:47 with a note; attaches photo/audio (optional).
3. Clicking an annotation jumps timeline and highlights location.
4. System shows a handover summary (key events + actions + outcomes).
**Postconditions**

- Shift handover knowledge is stored and replayable in context.
**Alternate / Exception Flows**

- E1: No media permissions → allow text-only note.
- E2: Too many annotations → filter by tag or severity.
