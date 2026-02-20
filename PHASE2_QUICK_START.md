# Phase 2: Multi-Agent Orchestration - Quick Start Guide

## Prerequisites

- Node.js installed
- Both frontend and backend servers running
- (Optional) OpenAI API key for real LLM mode

## Starting the Application

### 1. Start Backend Server

```bash
cd "Live Wip/server"
npm run dev
```

Server will start on `http://localhost:3001`

### 2. Start Frontend Server

```bash
cd "Live Wip"
npm run dev
```

Frontend will start on `http://localhost:5174`

## Testing Phase 2 Features

### Test 1: Equipment Maintenance Query

**Query**: "Show me equipment with low battery"

**Expected Behavior**:
1. Agent status indicator shows: idle → analyzing → delegating → responding
2. ActionFlow UI appears with:
   - **Signals**: Low battery warnings
   - **Context**: MaintenanceAgent analysis summary
   - **Intent**: "query (confidence: 80%)"
   - **Actions**: Camera focus on low battery equipment
3. Response message describes battery status

### Test 2: Shift Briefing

**Query**: "Give me a shift briefing"

**Expected Behavior**:
1. All 5 sub-agents execute in parallel
2. ActionFlow shows comprehensive analysis:
   - Maintenance summary
   - Inventory summary
   - Slotting summary
   - Safety summary
   - Labor summary
3. Response includes top 5 recommendations

### Test 3: Safety Check

**Query**: "Are there any safety hazards?"

**Expected Behavior**:
1. SafetyAgent analyzes congestion, proximity, speed
2. ActionFlow displays safety-specific signals
3. Response highlights any congestion zones or near-miss situations

### Test 4: Inventory Status

**Query**: "Check inventory levels"

**Expected Behavior**:
1. InventoryAgent analyzes stock levels
2. Identifies low stock or overstock items
3. Provides replenishment recommendations

### Test 5: Worker Allocation

**Query**: "How is the workforce allocated?"

**Expected Behavior**:
1. LaborAgent analyzes worker utilization
2. Identifies understaffed or overstaffed zones
3. Suggests reallocation strategies

## Observing Multi-Agent Orchestration

### Backend Console Logs

Watch for these log messages:

```
[OpsAgent] Processing intent: <your query>
[OpsAgent] Classified intent: { category: 'query', confidence: 0.8 }
[OpsAgent] Selected agents: [ 'safety', 'maintenance', ... ]
[OpsAgent] Delegating to 2 sub-agents in parallel
```

### Frontend UI

1. **Agent Status Indicator** (top-right of command bar):
   - Watch the multi-orbit animation during "delegating" state
   - Each colored dot represents a sub-agent

2. **ActionFlow Component** (above command bar):
   - Sections appear with 300ms stagger
   - Click section headers to collapse/expand
   - Click action buttons to execute recommendations

## Mock Mode vs Real LLM Mode

### Mock Mode (Default)
- No OpenAI API key required
- Sub-agents analyze data normally
- Intent classification uses pattern matching
- Response synthesis uses pre-scripted messages

### Real LLM Mode
1. Create `.env` file in `server/`:
   ```
   OPENAI_API_KEY=sk-...
   PORT=3001
   FRONTEND_URL=http://localhost:5174
   ```
2. Restart backend server
3. LLM will provide natural language responses with sub-agent context

## Debugging

### Backend Not Responding
```bash
# Check if server is running
curl http://localhost:3001/api/agent/query -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "context": {}}'
```

### ActionFlow Not Appearing
- Check browser console for errors
- Verify `showActionFlow` is true in agent store
- Ensure response has `actionFlow` property

### Sub-Agents Not Running
- Check backend console for delegation logs
- Verify all specialist files exist in `server/src/agents/specialists/`
- Check for TypeScript compilation errors

## Performance Monitoring

### Expected Response Times
- Rule engine (fast path): <100ms
- Sub-agent analysis: 50-200ms per agent
- Parallel execution: ~200ms total
- LLM synthesis (with API): 1-3s
- **Total**: 1.5-3.5s for complex queries

### Optimization Tips
1. Use rule engine for common queries
2. Limit sub-agent selection to relevant domains
3. Cache sub-agent results for repeated queries
4. Monitor LLM token usage

## Common Issues

### Issue: "Expected 1-2 arguments, but got 3"
**Solution**: Already fixed - `llmService.chatWithFunctions()` now accepts 3 parameters

### Issue: Framer-motion type warnings
**Impact**: None - cosmetic TypeScript warnings
**Solution**: Can be ignored or fixed by importing proper Easing types

### Issue: ActionFlow styles not applying
**Solution**: Ensure `framer-motion` is installed:
```bash
npm install framer-motion
```

## Next Steps

1. ✅ Test all 5 query types above
2. ✅ Verify ActionFlow UI animations
3. ✅ Check agent status indicator states
4. ✅ Monitor backend console logs
5. ✅ Test with real OpenAI API (optional)

## Success Indicators

You'll know Phase 2 is working correctly when:

- ✅ Multiple sub-agents log execution in parallel
- ✅ ActionFlow UI appears with 4 sections
- ✅ Agent status shows "delegating" with multi-orbit animation
- ✅ Response includes sub-agent analysis summaries
- ✅ Suggestions are context-aware based on issues detected

## Support

For issues or questions:
1. Check `PHASE2_IMPLEMENTATION_COMPLETE.md` for detailed architecture
2. Review backend console logs for errors
3. Inspect browser console for frontend errors
4. Verify all files were created correctly

---

**Ready to test!** Start with the shift briefing query to see all agents in action.
