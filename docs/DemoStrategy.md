# Warehouse Live - Demo Mode & Offline Strategy

Version: 0.1  
Date: 2 Feb 2026  
Status: Draft

---

## Overview

This document defines the comprehensive strategy for:
1. **Demo Mode** - Scripted and interactive modes for ICON booth
2. **Offline Reliability** - Graceful degradation when APIs are unavailable
3. **Feedback Collection** - Capturing visitor reactions and questions at the booth

**Critical Success Factors:**
- 20+ consecutive demos without critical failure
- <10 second reset time
- Seamless offline operation
- Meaningful feedback captured for every engaged visitor

---

## 1. Demo Mode Architecture

### 1.1 Mode Types

**Auto Mode (Scripted)**
- **Purpose:** Reliable, repeatable demo for high-traffic booth moments
- **Duration:** 8-10 minutes (full story arc)
- **User Input:** Minimal (1-2 prompted interactions)
- **Use Case:** Attract mode, group presentations, when booth is busy

**Interactive Mode**
- **Purpose:** Deep-dive exploration for engaged prospects
- **Duration:** Flexible (15-30 minutes)
- **User Input:** Full control of all features
- **Use Case:** One-on-one conversations, technical evaluations, Q&A

**Hybrid Mode (Operator-Guided)**
- **Purpose:** Booth operator controls flow but can deviate from script
- **Duration:** 10-15 minutes
- **User Input:** Operator triggers scenes manually, visitor asks questions
- **Use Case:** Semi-structured demos with questions mid-flow

### 1.2 Demo State Machine

```
┌─────────────────────────────────────────────────────────┐
│                    Demo State Model                      │
└─────────────────────────────────────────────────────────┘

States:
┌──────────┐  Start Demo   ┌──────────────┐  Auto-advance
│  Idle    │─────────────>│ Scene Playing│───────────────┐
└──────────┘               └──────────────┘               │
     ▲                            │                        │
     │                            │ User Pause             │
     │ Reset                      ▼                        │
     │                      ┌──────────┐                   │
     │                      │  Paused  │                   │
     │                      └──────────┘                   │
     │                            │ Resume                 │
     │                            ▼                        │
     │                      ┌──────────────┐               │
     └──────────────────────│Scene Complete│◄──────────────┘
                            └──────────────┘
                                   │
                                   │ Next Scene or Loop
                                   ▼
                            ┌──────────────┐
                            │ Next Scene / │
                            │   End Demo   │
                            └──────────────┘
```

**State Transitions:**
- **Idle → Scene Playing:** User clicks "Start Demo" or auto-start after 30s inactivity
- **Scene Playing → Paused:** Booth operator hits pause or user clicks pause
- **Scene Playing → Scene Complete:** Scene duration elapsed or exit condition met
- **Scene Complete → Next Scene:** Auto-advance or manual advance
- **Any State → Idle:** Reset button pressed

### 1.3 Scene Structure

Each scene is a self-contained narrative beat with:
- **Setup** (0-5s): Load data, set camera, prepare UI
- **Execution** (10-50s): Timed actions + narration
- **Highlight** (5-10s): Key moment (alert fires, plan executes, etc.)
- **Transition** (2-5s): Smooth handoff to next scene

**Scene Timing Budget:**
- Scene overhead (setup/transition): <7 seconds
- Core content: 10-50 seconds
- Total scene: 15-60 seconds

**Scene Action Types:**

| Action Type | Description | Example |
|------------|-------------|---------|
| `load_dataset` | Switch scenario dataset | Load "scenario_congestion" |
| `advance_timeline` | Jump to specific timestamp | Jump to 09:47:00 |
| `trigger_alert` | Fire an alert | Show "congestion-zone-c-001" |
| `focus_camera` | Animate camera to location | Focus on Zone-C |
| `activate_overlay` | Enable heat map overlay | Show congestion heat map |
| `open_panel` | Open UI panel | Open explainability panel |
| `close_panel` | Close UI panel | Close alert panel |
| `select_entity` | Select and highlight entity | Select worker W-042 |
| `highlight_zone` | Pulse zone boundary | Highlight Zone-C |
| `show_activity_feed` | Display feed items | Show 3 feed items |
| `select_feed_item` | Click feed item | Open mini-explain for item |
| `open_mini_explain` | Open mini explanation | Show auto-action details |
| `expand_explainability` | Expand explanation section | Show all factors |
| `show_recommendations` | Display options | Show 3 recommendations |
| `select_recommendation` | Choose an option | Select "Reallocate 3 Workers" |
| `tweak_plan` | Simulate plan tuning | Type "use 2 workers instead of 3" |
| `preview_plan` | Show plan diff | Display before/after comparison |
| `execute_plan` | Trigger scenario transition | Apply intervention |
| `show_outcome` | Display validation dashboard | Show KPI improvements |
| `camera_tour` | Automated camera flythrough | Tour all zones |
| `play_timeline` | Start timeline playback | Play at 5× speed |
| `scrub_timeline` | Jump timeline to moment | Scrub to alert time |
| `add_annotation` | Create spatial note | Pin annotation in Zone C |
| `chat_query` | Simulate chat input | Ask "what's happening" |
| `wait` | Pause for duration | Wait 3 seconds |

### 1.4 Scene Sequencer Implementation

**Core Logic:**
```typescript
class DemoSceneSequencer {
  private currentScene: number = 0;
  private sceneStartTime: number = 0;
  private isPaused: boolean = false;
  private actions: ScriptedAction[] = [];
  
  async playScene(scene: DemoScene) {
    this.sceneStartTime = Date.now();
    this.actions = scene.actions;
    
    // Execute actions based on timestamp
    for (const action of this.actions) {
      const delay = action.timestamp * 1000; // convert to ms
      await this.sleep(delay - this.getElapsedTime());
      
      if (this.isPaused) {
        await this.waitForResume();
      }
      
      await this.executeAction(action);
      
      if (action.waitForCompletion) {
        await this.waitForActionComplete(action);
      }
    }
    
    // Check exit condition
    if (scene.exitCondition === 'timer') {
      await this.sleep(scene.duration * 1000 - this.getElapsedTime());
    } else if (scene.exitCondition === 'user_action') {
      await this.waitForUserInput();
    }
    
    this.onSceneComplete();
  }
  
  async executeAction(action: ScriptedAction) {
    switch (action.type) {
      case 'load_dataset':
        await DataService.loadDataset(action.params.datasetId);
        break;
      case 'focus_camera':
        await CameraController.focusOn(action.params.zone, action.params);
        break;
      case 'trigger_alert':
        MonitoringService.triggerAlert(action.params.alertId);
        break;
      // ... handle all action types
    }
  }
}
```

**Action Orchestration:**
- Actions scheduled by relative timestamp
- Support for blocking actions (waitForCompletion: true)
- Pause/resume preserves action queue
- Skip action if elapsed time exceeds action timestamp

---

## 2. Offline Reliability Strategy

### 2.1 Failure Scenarios

**Potential Points of Failure:**
1. **AI/LLM API unavailable** (OpenAI, custom backend)
2. **Network connectivity lost**
3. **Cloud storage/CDN unreachable**
4. **Third-party service timeout**

**Mitigation: Offline-First Architecture**

### 2.2 Pre-Computation Strategy

**What to Pre-Compute:**

| Feature | Online Approach | Offline Fallback |
|---------|----------------|------------------|
| Alert Explanations | LLM-generated text | Template-based from explainability_templates.json |
| Recommendations | Dynamic generation | Pre-defined options in recommendations_{type}.json |
| Plan Tuning | LLM re-planning | Match to pre-computed variants |
| Chat Responses | Conversational AI | Pattern-matched from chat_fallback.json |
| Impact Estimates | Real-time simulation | Pre-computed in recommendation.impact |
| KPI Computation | Live aggregation | Pre-computed in timeline CSV |

**Pre-Computation Workflow:**

```
Before ICON:
1. Generate all alert explanations for demo scenarios (template render)
2. Create 3 recommendation options per alert type
3. Generate 2-3 plan variants per recommendation
4. Author 20-30 chat Q&A pairs covering expected questions
5. Pre-compute KPI values for all timeline timestamps
6. Bundle all data as static JSON/CSV in app build
```

### 2.3 Fallback Detection

**API Health Check:**
```typescript
class OfflineService {
  private isOnline: boolean = true;
  private apiTimeout: number = 2000; // 2 seconds
  
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(this.apiTimeout)
      });
      this.isOnline = response.ok;
      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      this.activateOfflineMode();
      return false;
    }
  }
  
  activateOfflineMode() {
    console.warn('Offline mode activated');
    AppState.demo.offlineMode = true;
    // Show subtle indicator in UI (optional)
  }
  
  async fetchWithFallback<T>(
    apiFn: () => Promise<T>,
    fallbackData: T
  ): Promise<T> {
    if (!this.isOnline) {
      return fallbackData;
    }
    
    try {
      return await apiFn();
    } catch (error) {
      this.activateOfflineMode();
      return fallbackData;
    }
  }
}
```

**Usage Example:**
```typescript
// Get recommendations with fallback
const recommendations = await OfflineService.fetchWithFallback(
  () => AIService.getRecommendations(alertId),
  PrecomputedData.recommendations[alertId]
);
```

### 2.4 Graceful Degradation

**UI Behavior in Offline Mode:**

| Feature | Online Behavior | Offline Behavior |
|---------|----------------|------------------|
| Plan Tuning | Free-text constraints, live regeneration | Structured inputs only, closest variant match |
| Chat | Natural language Q&A | Pattern-matched responses + suggestion chips |
| Explainability | Dynamic detail generation | Template-rendered with alert data |
| Recommendations | Personalized options | Pre-defined options for alert type |
| Impact Preview | Real-time simulation | Pre-computed scenario switch |

**Offline Mode Indicators:**
- **Subtle approach:** Small "Limited Mode" badge in footer (optional)
- **No approach:** Fully transparent fallback; user never knows (preferred for demo)

**Best Practice:** Make offline mode indistinguishable from online for demo scenarios

### 2.5 Asset Bundling

**Critical Assets to Bundle:**
- All CSV datasets (3+ scenarios)
- All JSON configs (KPIs, alerts, recommendations, etc.)
- 3D models (GLB files)
- Textures and materials
- UI assets (icons, images)
- Demo script JSON

**Build Configuration:**
```json
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'data': ['papaparse'],
          'demo': ['./src/demo/**']
        }
      }
    }
  },
  assetsInlineLimit: 0, // Don't inline; keep as separate files for caching
  publicDir: 'public' // Bundle datasets from public/
}
```

**Pre-Event Checklist:**
- [ ] Build production bundle
- [ ] Verify all datasets included in dist/
- [ ] Test app with network disabled
- [ ] Confirm <10s reset time
- [ ] Verify 60 FPS on booth hardware

---

## 3. Feedback Collection Strategy

### 3.1 Feedback Touchpoints

**During Demo:**
- Implicit tracking: scenes viewed, interactions, time spent
- No interruptions to flow

**End of Demo:**
- Quick feedback prompt (5-10 seconds)
- Optional: leave contact info for follow-up

**Post-Demo:**
- QR code for detailed survey
- Business card collection with "Learn more" URL

### 3.2 Feedback Data Model

```json
{
  "feedbackId": "fb-20260415-001",
  "sessionId": "session-20260415-shift1",
  "timestamp": "2026-04-15T10:35:00Z",
  "demoMode": "auto",
  "scenesCompleted": [
    "scene-1-glanceable-health",
    "scene-2-quiet-autonomy",
    "scene-3-proactive-warning",
    "scene-4-explainability",
    "scene-5-options",
    "scene-6-tweak-plan",
    "scene-7-execute"
  ],
  "totalDuration": 478,
  "interactions": [
    {
      "timestamp": "2026-04-15T10:32:15Z",
      "type": "click",
      "target": "alert_pin_zone_c"
    },
    {
      "timestamp": "2026-04-15T10:33:42Z",
      "type": "chat_query",
      "query": "where is worker W-042"
    }
  ],
  "quickRating": 5,
  "quickComment": "Explainability panel is impressive. How does this connect to SAP?",
  "visitorInfo": {
    "name": "Jane Doe",
    "company": "Acme Corp",
    "role": "VP Operations",
    "email": "jane.doe@acme.com",
    "consent": true
  },
  "boothOperatorNotes": "Very engaged. Interested in multi-site rollout. Follow up with solution architect.",
  "tags": ["high-priority", "multi-site", "integration-questions"]
}
```

### 3.3 Feedback Collection UI

**End-of-Demo Prompt:**
```
┌────────────────────────────────────────────────┐
│  Thank you for experiencing Warehouse Live!     │
│                                                 │
│  How would you rate this demo?                  │
│  ☆ ☆ ☆ ☆ ☆  (1-5 stars, tap to rate)          │
│                                                 │
│  [Optional: Leave a quick comment]              │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Want to learn more?                            │
│  [📧 Leave your email] [📱 Scan QR for survey] │
│                                                 │
│  [Skip]  [Submit Feedback]                      │
└────────────────────────────────────────────────┘
```

**Timing:**
- Auto-appears 5 seconds after demo ends
- Auto-dismisses after 30 seconds if no interaction
- Can be manually dismissed

**Booth Operator Panel:**
```
┌────────────────────────────────────────────────┐
│  Operator Notes (private)                       │
│  ┌─────────────────────────────────────────┐   │
│  │ Very engaged visitor. Asked about       │   │
│  │ SAP integration and multi-site support. │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Tags:  [+ Add tag]                             │
│  ☑ High Priority  ☑ Integration Questions      │
│  ☐ Technical Eval  ☐ Budget Authority          │
│                                                 │
│  [Save Notes]                                   │
└────────────────────────────────────────────────┘
```

### 3.4 Offline Feedback Storage

**Local Storage (IndexedDB):**
```typescript
class FeedbackService {
  private db: IDBDatabase;
  
  async saveFeedback(feedback: FeedbackEntry) {
    // Save to IndexedDB immediately
    await this.db.put('feedback', feedback);
    
    // Try to sync to cloud (fire-and-forget)
    this.syncToCloud().catch(() => {
      console.log('Feedback will sync later');
    });
  }
  
  async syncToCloud() {
    const pending = await this.db.getAll('feedback', 'unsynced');
    
    for (const item of pending) {
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          body: JSON.stringify(item),
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Mark as synced
        item.synced = true;
        await this.db.put('feedback', item);
      } catch (error) {
        console.warn('Sync failed, will retry later');
      }
    }
  }
  
  // Auto-sync every 5 minutes
  startAutoSync() {
    setInterval(() => this.syncToCloud(), 5 * 60 * 1000);
  }
}
```

**Backup Strategy:**
- IndexedDB as primary storage (persists across page reloads)
- Export to JSON at end of each day (booth operator button)
- Email JSON export to team
- Manual upload to CRM if needed

### 3.5 Analytics Tracking

**Event Types to Track:**

| Event | Data Captured | Purpose |
|-------|--------------|---------|
| `demo_started` | timestamp, mode, scenario | Track demo sessions |
| `scene_completed` | scene_id, duration | Identify drop-off points |
| `scene_skipped` | scene_id, reason | Understand operator behavior |
| `interaction_click` | target, timestamp | Heatmap of user interest |
| `chat_query` | query_text, response_type | Common questions |
| `recommendation_viewed` | option_id, alert_type | Which options resonate |
| `plan_tweaked` | constraint, variant_matched | Plan tuning usage |
| `demo_reset` | reason | Reliability issues |
| `error_occurred` | error_type, stack_trace | Debug failures |
| `feedback_submitted` | rating, has_comment | Engagement quality |

**Implementation:**
```typescript
class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  
  track(eventName: string, data: any) {
    const event: AnalyticsEvent = {
      id: generateId(),
      name: eventName,
      timestamp: Date.now(),
      sessionId: AppState.demo.sessionId,
      data: data
    };
    
    this.events.push(event);
    this.saveToStorage(event);
    
    // Optional: send to analytics platform (with offline tolerance)
    this.sendToAnalytics(event).catch(() => {});
  }
  
  async exportAnalytics(): Promise<string> {
    return JSON.stringify(this.events, null, 2);
  }
}
```

**Privacy Considerations:**
- No PII tracked without consent
- Clear opt-in for email/contact info
- Analytics data anonymized
- Export capability for transparency

### 3.6 Post-Event Analysis

**Key Metrics to Analyze:**

1. **Engagement Metrics**
   - Total demos run
   - Average demo duration
   - Scene completion rates
   - Repeat demos (same visitor)

2. **Interest Signals**
   - Interactions per demo
   - Chat queries asked
   - Plan tuning attempts
   - Feedback ratings (avg)

3. **Content Performance**
   - Which scenes had highest engagement (dwell time)
   - Which features were clicked most
   - Common questions asked
   - Drop-off points

4. **Technical Performance**
   - Demo resets / failures
   - Offline mode activations
   - Average FPS
   - Load times

5. **Lead Quality**
   - Feedback rating distribution
   - High-priority tags
   - Email capture rate
   - Follow-up requests

**Analysis Dashboard (Post-Event):**
```
Warehouse Live - ICON 2026 Results

Total Demos: 127
Avg Duration: 7m 42s
Feedback Rating: 4.6 / 5.0
Email Captures: 43

Top Scenes (by engagement time):
1. Scene 6: Plan Tuning (avg 98s)
2. Scene 4: Explainability (avg 76s)
3. Scene 7: Execute & Validate (avg 65s)

Most Clicked Features:
1. Alert Explainability Panel (89 clicks)
2. Plan Diff Preview (67 clicks)
3. KPI Drill-Down (54 clicks)

Common Questions:
1. "How does this connect to our WMS?" (31 times)
2. "Can we use our own data?" (22 times)
3. "What's the pricing?" (19 times)

Technical Performance:
- 0 critical failures ✓
- 2 demo resets (user requested)
- Avg FPS: 61
- Offline mode: activated 3 times (brief network blip)

High-Priority Leads: 18
Follow-up Meetings Booked: 12
```

---

## 4. Booth Operator Guide

### 4.1 Operator Controls

**Booth Operator Panel (accessible via keyboard shortcut or hidden button):**

```
┌────────────────────────────────────────────────┐
│  Warehouse Live - Operator Panel               │
├────────────────────────────────────────────────┤
│  Demo Control:                                  │
│  [Start Auto Demo] [Reset to Idle] [Skip Scene]│
│                                                 │
│  Current Scene: Scene 3 - Proactive Warning     │
│  Time Remaining: 38s                            │
│  [Pause] [Resume] [Jump to Scene ▼]            │
│                                                 │
│  Mode:  ⦿ Auto  ○ Interactive  ○ Hybrid         │
│                                                 │
│  System Status:                                 │
│  FPS: 60  |  Network: ✓ Online  |  API: ✓ OK   │
│                                                 │
│  Quick Actions:                                 │
│  [Load Scenario ▼] [Trigger Alert ▼]           │
│  [Focus Zone ▼] [Open Panel ▼]                 │
│                                                 │
│  Notes for this visitor:                        │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│  [Save Notes]                                   │
│                                                 │
│  [Export Feedback] [End Shift]                  │
└────────────────────────────────────────────────┘
```

### 4.2 Operator Workflows

**Workflow 1: Attract Mode (Auto Demo)**
1. Keep demo running in auto mode on loop
2. When visitor approaches, let current scene finish
3. Greet visitor, ask if they'd like to see a full demo or explore
4. If "full demo": restart auto from Scene 1
5. If "explore": switch to interactive mode

**Workflow 2: Interactive Demo**
1. Ask visitor: "What aspects of warehouse operations are you most interested in?"
2. Jump to relevant scene or feature:
   - "Proactive alerts" → Scene 3
   - "Decision support" → Scene 5 (Options)
   - "What-if analysis" → Scene 8 (Timeline)
3. Let visitor explore; be ready to answer questions
4. Highlight plan tuning and explainability features
5. End with feedback prompt

**Workflow 3: Technical Evaluation**
1. Switch to interactive mode
2. Show data ingestion (CSV upload concept)
3. Explain architecture briefly (spatial twin + intelligence layer)
4. Demonstrate API extensibility talking points
5. Offer to connect with solution architect

**Workflow 4: Handling Failures**
1. If demo freezes or crashes: hit Reset (should take <10s)
2. If offline mode activates: continue demo (should be seamless)
3. If visitor asks about missing feature: note in feedback, pivot to strengths
4. If hardware overheats / slows: close other apps, reduce entity count (if possible)

### 4.3 Talking Points by Scene

**Scene 1: Glanceable Health**
> "Warehouse Live gives you a complete view of your operation at a glance. The KPI panel shows real-time health metrics, and you can drill into any number to see what's driving it."

**Scene 2: Quiet Autonomy**
> "The system continuously monitors operations and automatically handles minor issues—like rebalancing task queues—so your team can focus on exceptions that actually matter."

**Scene 3: Proactive Warning**
> "Here's where it gets interesting. The system detected a potential bottleneck forming in Zone C before it caused delays. Notice how the map immediately focuses on the problem area."

**Scene 4: Explainability**
> "We believe AI should be transparent. This explainability panel shows exactly why the alert fired—the data factors, spatial constraints, and predicted impact. No black boxes."

**Scene 5: Options**
> "Rather than just telling you there's a problem, the system gives you actionable options with clear trade-offs. You're always in control."

**Scene 6: Plan Tuning**
> "And here's what makes this truly powerful: you can tweak the recommended plan in plain language. Say 'use 2 workers instead of 3,' and the system instantly shows you the updated impact before you commit."

**Scene 7: Execute & Validate**
> "Once you execute, the system orchestrates the changes across the floor—and shows you the outcome. Orders saved, congestion cleared, SLAs protected."

**Scene 8: Timeline & Collaboration**
> "You can replay history, compare scenarios side-by-side, and leave notes for the next shift. It's a complete decision and learning loop."

**Scene 9: Ask Anything**
> "And if you ever need help, just ask. The system can answer questions about what's happening, where things are, and what you should do next."

### 4.4 Common Questions & Responses

| Visitor Question | Recommended Response |
|-----------------|---------------------|
| "How does this connect to our WMS?" | "We're designed to integrate with existing systems via APIs. We can ingest data from SAP, Manhattan, Oracle, or any system with a data feed. Let's connect you with our integration team to discuss your specific setup." |
| "Is this real-time or simulated?" | "What you're seeing is simulated data for demo purposes, but the platform is designed to handle real-time feeds. In production, we connect to your WMS, IoT sensors, and other data sources to maintain a live view." |
| "Can we upload our own data?" | "Absolutely. The system accepts CSV files or API feeds. We also offer professional services to help with data mapping and integration." |
| "What's the ROI?" | "Our customers typically see a 15-25% reduction in order delays and a 10-15% improvement in labor utilization within the first quarter. Let's connect you with our team to model your specific environment." |
| "Do you support multi-site?" | "Yes, the architecture is designed to scale from a single warehouse to a network of facilities. We can show you multi-site dashboards in a follow-up conversation." |
| "What about security?" | "Security is a top priority. We support SSO, RBAC, encrypted data storage, and SOC 2 compliance. Happy to provide a detailed security brief." |
| "Can we customize this?" | "Definitely. The KPI panel, alerts, and workflows are all configurable to match your operations. We also offer custom development for unique requirements." |
| "What hardware do we need?" | "The platform runs in a web browser, so any modern laptop or tablet works. For floor displays, we recommend large touchscreens or projectors. No specialized hardware required." |

### 4.5 Escalation Paths

**Immediate (at booth):**
- Technical questions → Connect with solution architect (booth staff)
- Pricing questions → Schedule follow-up call with sales
- Integration details → Provide architecture diagram + integration guide

**Post-Event:**
- High-priority leads → Sales email within 24 hours
- Technical evaluations → Solution architect demo within 1 week
- General interest → Add to nurture campaign

---

## 5. Pre-Event Checklist

### 5.1 Technical Setup

**1 Week Before:**
- [ ] Build production app with all datasets
- [ ] Test on booth hardware (60 FPS sustained)
- [ ] Verify offline mode with network disabled
- [ ] Run 20+ consecutive demos (no critical failures)
- [ ] Test reset time (<10 seconds)
- [ ] Export and back up all feedback data structure
- [ ] Print QR codes for surveys (10+ copies)

**1 Day Before:**
- [ ] Install app on booth laptop(s)
- [ ] Confirm network access (WiFi credentials)
- [ ] Test API connectivity (if using live services)
- [ ] Load demo script (auto mode)
- [ ] Test booth operator panel access
- [ ] Print backup materials (one-pagers, business cards)

**Morning of Event:**
- [ ] Launch app and verify load time
- [ ] Run one full auto demo (8-10 min)
- [ ] Test interactive mode
- [ ] Confirm FPS and performance
- [ ] Verify feedback submission and storage
- [ ] Charge all devices (laptops, tablets, backup battery)

### 5.2 Content Preparation

- [ ] Narrator script rehearsed (for auto mode)
- [ ] Operator talking points memorized
- [ ] Common Q&A reviewed
- [ ] Integration architecture diagram available
- [ ] Pricing tiers (if shareable) on hand
- [ ] Follow-up process defined

### 5.3 Staffing

- [ ] 2-3 booth operators trained on controls
- [ ] 1 technical expert (solution architect) on call
- [ ] Shift schedule defined (operators swap every 2-3 hours)
- [ ] Escalation contacts confirmed

---

## 6. Post-Event Workflow

### 6.1 Day-of-Event

**End of Each Shift:**
- Export feedback from IndexedDB (JSON download)
- Email JSON to team (backup)
- Review operator notes for high-priority leads
- Charge devices for next shift

**End of Day:**
- Consolidate feedback from all shifts
- Tag high-priority leads
- Export analytics (events log)
- Back up to cloud storage

### 6.2 Post-Event Analysis

**Within 3 Days:**
- [ ] Analyze feedback ratings and comments
- [ ] Identify top 10 high-priority leads
- [ ] Review analytics (scenes, interactions, questions)
- [ ] Document technical issues (if any)
- [ ] Compile lessons learned

**Within 1 Week:**
- [ ] Create post-event report (metrics + insights)
- [ ] Schedule follow-up calls with high-priority leads
- [ ] Update demo script based on feedback
- [ ] Prioritize feature requests from visitor questions
- [ ] Share analytics dashboard with product team

### 6.3 Lead Follow-Up

**High-Priority Leads (18+):**
- Personal email within 24 hours
- Schedule demo or call within 1 week
- Assign account executive

**Medium-Priority Leads:**
- Add to nurture email campaign
- Follow up in 2 weeks

**General Interest:**
- Add to mailing list
- Quarterly check-in

---

## 7. Continuous Improvement

### 7.1 Demo Script Iteration

**After ICON:**
- Review scene completion rates
- Identify scenes with low engagement (consider shortening or cutting)
- Expand scenes with high engagement
- Refine timing based on actual durations

**Iterate on:**
- Scene order (does flow make sense?)
- Action timing (too fast/slow?)
- Narration clarity
- Visual highlights (are they obvious?)

### 7.2 Feedback Loop to Product

**Questions asked frequently → Potential product gaps:**
- "How does this connect to X?" → Integration guide needed
- "Can we customize Y?" → Highlight configurability better
- "What about Z?" → Feature request or messaging gap

**Low ratings or negative feedback → Issues to address:**
- Performance (FPS drops, slow load)
- Confusing UI (explainability panel too dense?)
- Missing features (multi-site view, RBAC)

### 7.3 Offline Mode Refinement

**Post-event:**
- Review offline mode activations (how often? why?)
- Check if visitors noticed degradation
- Improve fallback responses based on actual questions
- Add more pre-computed variants if plan tuning failed to match

---

## 8. Risk Mitigation Summary

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API fails during demo | Medium | High | Offline fallback pre-computed, seamless switch |
| Demo crashes | Low | High | Reset in <10s, 20+ pre-event tests |
| Booth hardware overheats | Low | Medium | Cap entity count, optimize rendering, backup laptop |
| Network drops | Medium | Medium | Offline-first architecture, all assets bundled |
| Visitor confused by UI | Medium | Low | Booth operator guidance, clear visual hierarchy |
| Feedback not captured | Low | Medium | IndexedDB storage, manual export backup |
| High booth traffic | High | Low | Auto mode for attract, fast reset between demos |

---

## Appendix A: Demo Script (Full Text)

*See `/docs/DataContracts.md` Section 10 for complete demo_script.json structure*

**Scene Breakdown:**
1. Glanceable Health (30s)
2. Quiet Autonomy (45s)
3. Proactive Warning (60s)
4. Visual Explainability (45s)
5. Options (60s)
6. Tweak the Plan (90s)
7. Execute & Validate (45s)
8. Timeline & Annotations (45s)
9. Ask Anything (60s)

**Total Duration:** ~8 minutes

---

## Appendix B: Booth Operator Cheat Sheet

**Keyboard Shortcuts:**
- `Ctrl+Shift+O`: Open operator panel
- `Ctrl+R`: Reset demo
- `Ctrl+N`: Next scene
- `Ctrl+P`: Pause/Resume
- `Ctrl+1-9`: Jump to scene 1-9
- `Ctrl+I`: Switch to interactive mode
- `Ctrl+A`: Switch to auto mode

**Quick Troubleshooting:**
- **Demo frozen:** Hit `Ctrl+R` to reset (<10s)
- **Low FPS:** Close other apps, refresh page
- **Offline mode:** Continue normally (fallbacks active)
- **Visitor asking hard questions:** Note in feedback, offer follow-up

**End of Shift:**
1. Export feedback (Operator Panel → Export)
2. Email JSON to team
3. Tag high-priority leads in notes
4. Hand off to next operator

---

**End of Demo & Offline Strategy Document**
