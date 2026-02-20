# Phase 1: Command Bar & Agent Foundation

This implementation adds an AI-powered command bar to the Live Wip warehouse visualization application.

## What Was Built

### Backend (Express Server)
- **Location**: `Live Wip/server/`
- **Port**: 3001
- **Features**:
  - Rule-based query matching for common warehouse commands
  - OpenAI GPT-4 integration with mock fallback mode
  - Agent query, briefing, and suggestions endpoints
  - CORS configured for Vite frontend

### Frontend (React Components)
- **CommandBar**: Floating command interface at bottom-center
- **AgentAvatar**: Visual state indicator (idle/analyzing/acting)
- **SuggestionChips**: Context-aware quick action buttons
- **ResponseBubble**: Animated response display
- **AgentStore**: Separate Zustand store for agent state
- **CameraCommandService**: Bridges agent actions to camera controls

## Running the Application

### 1. Start Backend Server
```bash
cd "Live Wip/server"
npm run dev
```

The backend will start on port 3001. You should see:
```
🚀 Warehouse Live Backend Server
📡 Server running on port 3001
🔑 OpenAI API Key: ✗ Not set (mock mode)
```

### 2. Start Frontend (Already Running)
The frontend is already running on port 5174 from your previous session.

### 3. Test the Command Bar
Open http://localhost:5174 in your browser. You should see:
- A floating command bar at the bottom center of the screen
- Suggestion chips appear when you hover/focus on the bar
- RGB border animation when the bar is active

## Testing Commands

Try these example queries:

### Rule-Based (Fast Response)
- "Show me Zone A"
- "Go to overview"
- "Show shift briefing"
- "What alerts do we have?"
- "Check inventory status"

### LLM-Based (Mock Mode)
- "What's the overall status?"
- "Tell me about the warehouse"
- "How are operations going?"

## Mock Mode vs. API Key Mode

**Current Mode**: Mock (no API key required)
- Pre-scripted responses for demo purposes
- No OpenAI billing
- Perfect for development and testing

**To Enable Full AI**:
1. Edit `Live Wip/server/.env`
2. Uncomment and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Restart the backend server

## Architecture

```
User Query → CommandBar → AgentStore → AgentService (HTTP)
                                           ↓
Backend: Rule Engine → Match? → Return Response
                ↓ No Match
         OpsAgent → LLM → Synthesize Response
                                           ↓
Frontend: Response + Actions → CameraCommandService → Camera Animation
```

## Files Created

### Backend (7 files)
- `server/package.json` - Dependencies
- `server/tsconfig.json` - TypeScript config
- `server/.env` - Environment variables
- `server/src/index.ts` - Express server
- `server/src/routes/agent.ts` - API routes
- `server/src/services/llmService.ts` - OpenAI integration
- `server/src/agents/` - Rule engine & OpsAgent

### Frontend (11 files)
- `src/types/agent.ts` - Type definitions
- `src/state/agentStore.ts` - Zustand store
- `src/services/AgentService.ts` - API client
- `src/services/CameraCommandService.ts` - Camera integration
- `src/utils/cn.ts` - Utility function
- `src/components/CommandBar/` - UI components (5 files)
- `src/vite-env.d.ts` - Vite types

### Modified Files (2)
- `src/App.tsx` - Added CommandBarContainer
- `src/index.css` - Added RGB border animation

## Next Steps (Phase 2)

Phase 1 is complete! Future enhancements could include:
- Full sub-agent orchestration
- Multi-turn conversations with memory
- Advanced camera following for entities
- Alert highlighting and heatmap overlays
- Voice input support
- Proactive suggestions based on warehouse state

## Verification

### Backend Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "warehouse-live-backend"
}
```

### Test Agent Query
```bash
curl -X POST http://localhost:3001/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{"message":"show me zone A","context":{}}'
```

Expected: Response with camera action to fly to Zone A

## Troubleshooting

**Command bar not visible?**
- Check browser console for errors
- Verify frontend dependencies installed: `npm list framer-motion lucide-react`

**Backend not responding?**
- Check backend is running on port 3001
- Verify no CORS errors in browser console
- Check backend terminal for error messages

**Camera not moving?**
- Verify warehouse data is loaded
- Check browser console for CameraCommandService logs
- Ensure zones exist in the warehouse layout
