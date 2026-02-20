# Phase 3 Quick Start Guide

## Testing the Phase 3 Backend

The Phase 3 backend is now fully implemented and ready to test. Here's how to verify the new features:

### Prerequisites

1. Make sure both servers are running:
   ```bash
   # Terminal 1: Frontend
   cd /Users/asichussain/Desktop/tests\ MAS/live/Live\ Wip
   npm run dev
   
   # Terminal 2: Backend
   cd /Users/asichussain/Desktop/tests\ MAS/live/Live\ Wip/server
   npm run dev
   ```

### API Endpoints Available

#### 1. Alert Management

**Get Active Alerts:**
```bash
curl http://localhost:3001/api/agent/alerts
```

**Get Filtered Alerts:**
```bash
curl "http://localhost:3001/api/agent/alerts?severity=critical&severity=high"
```

**Update Alert Status:**
```bash
curl -X PATCH http://localhost:3001/api/agent/alerts/ALERT_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "acknowledged"}'
```

#### 2. Recommendations

**Tune a Recommendation:**
```bash
curl -X POST http://localhost:3001/api/agent/recommendations/REC_ID/tune \
  -H "Content-Type: application/json" \
  -d '{
    "tuningInput": "Delay execution by 30 minutes",
    "context": {}
  }'
```

**Execute a Recommendation:**
```bash
curl -X POST http://localhost:3001/api/agent/recommendations/REC_ID/execute \
  -H "Content-Type: application/json" \
  -d '{"context": {}}'
```

#### 3. Gestation Management

**Get Pending Gestation Items:**
```bash
curl http://localhost:3001/api/agent/gestation/pending
```

**Object to a Gestation Action:**
```bash
curl -X POST http://localhost:3001/api/agent/gestation/ITEM_ID/object \
  -H "Content-Type: application/json" \
  -d '{"reason": "Need more time to review"}'
```

#### 4. Explainability

**Get Alert Explainability:**
```bash
curl http://localhost:3001/api/agent/explainability/ALERT_ID
```

#### 5. Outcome Tracking

**Get Outcomes:**
```bash
curl http://localhost:3001/api/agent/outcomes
```

**Get Outcome Statistics:**
```bash
curl http://localhost:3001/api/agent/outcomes/stats
```

### Integration with Existing Features

The Phase 3 backend integrates seamlessly with Phase 1 & 2:

1. **Command Bar Integration:**
   - When you send a query through the command bar, the OpsAgent will now:
     - Detect alerts from sub-agent analyses
     - Generate recommendations for those alerts
     - Classify actions by autonomy tier
     - Queue automated actions for gestation

2. **Briefing Integration:**
   - Shift briefings will include:
     - Active alerts summary
     - Pending gestation actions
     - Recent recommendations

### Testing Workflow

Here's a complete workflow to test Phase 3 features:

1. **Trigger Alert Detection:**
   ```bash
   curl -X POST http://localhost:3001/api/agent/query \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Give me a shift briefing",
       "context": {
         "entities": [
           {"id": "R-042", "type": "robot", "battery": 12},
           {"id": "R-103", "type": "robot", "battery": 8}
         ]
       }
     }'
   ```
   
   This will trigger the OpsAgent to analyze the context and potentially detect low battery alerts.

2. **View Generated Alerts:**
   ```bash
   curl http://localhost:3001/api/agent/alerts
   ```

3. **Get Explainability for an Alert:**
   ```bash
   # Use alert ID from step 2
   curl http://localhost:3001/api/agent/explainability/ALERT_ID
   ```

4. **Execute a Recommendation:**
   ```bash
   # Use recommendation ID from the alert
   curl -X POST http://localhost:3001/api/agent/recommendations/REC_ID/execute \
     -H "Content-Type: application/json" \
     -d '{"context": {}}'
   ```

5. **Monitor Gestation:**
   ```bash
   curl http://localhost:3001/api/agent/gestation/pending
   ```

6. **Object to Gestation (Optional):**
   ```bash
   curl -X POST http://localhost:3001/api/agent/gestation/ITEM_ID/object \
     -H "Content-Type: application/json" \
     -d '{"reason": "Testing objection mechanism"}'
   ```

7. **Check Outcomes:**
   ```bash
   curl http://localhost:3001/api/agent/outcomes
   curl http://localhost:3001/api/agent/outcomes/stats
   ```

### Expected Behavior

- **Automated Actions:** Will execute automatically after gestation period (10 seconds)
- **Semi-Automated Actions:** Will wait for acknowledgment (45 seconds gestation)
- **Assisted Actions:** Require explicit user approval (no gestation)

### Autonomy Tier Classification

Actions are classified based on:
- **Confidence:** From recommendation engine
- **Impact:** Calculated from affected entities, reversibility, cost

**Matrix:**
```
                    Impact
                Low         Medium      High
         ┌──────────────┼───────────┼──────────┐
    High │  Automated   │  Semi-    │  Semi-   │
Conf.    │              │  Auto     │  Auto    │
         ├──────────────┼───────────┼──────────┤
  Medium │  Automated   │  Semi-    │ Assisted │
         │              │  Auto     │          │
         ├──────────────┼───────────┼──────────┤
    Low  │  Assisted    │ Assisted  │ Assisted │
         └──────────────┴───────────┴──────────┘
```

### Debugging

Check server logs for detailed information:
```bash
# In the server terminal, you'll see:
[GestationManager] Queued action ACTION_ID for execution in 10000ms
[GestationManager] Executing action ACTION_ID
[GestationManager] Action ACTION_ID completed successfully
[OutcomeTracker] Started tracking outcome OUTCOME_ID for recommendation REC_ID
```

### Next Steps

Once you've verified the backend is working correctly:

1. **Phase 3B:** Build frontend components (AlertPanel, ActivityFeed, etc.)
2. **Phase 3C:** Integrate components with existing UI
3. **Phase 3D:** Testing and refinement

## Notes

- The backend is currently using in-memory storage, so data will reset on server restart
- Some services use mock data for demo purposes (e.g., outcome simulation)
- Real warehouse data integration can be added in future phases
- UUID package is installed and working (lint errors are temporary IDE caching issues)

## Troubleshooting

**If you see TypeScript errors:**
1. Restart the TypeScript server in your IDE
2. Run `npm install` in the server directory to ensure all dependencies are installed
3. Check that `uuid` and `@types/uuid` are in package.json

**If endpoints return errors:**
1. Check that both frontend and backend servers are running
2. Verify the port is correct (backend should be on 3001)
3. Check server logs for detailed error messages
