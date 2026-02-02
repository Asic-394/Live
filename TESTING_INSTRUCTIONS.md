# Testing Instructions for Slice 1

## Quick Start

### 1. Install Dependencies

```bash
cd /Users/rahulkrishnan/Documents/Cursor/Live
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
npm run preview
```

Production build will be available at `http://localhost:4173`

## Manual Testing Checklist

Follow the detailed acceptance tests in `ACCEPTANCE_TESTS.md`.

### Quick Smoke Test (5 minutes)

1. **Launch Application**
   - Open `http://localhost:5173`
   - Verify warehouse loads with 3D view
   - Check browser console for errors

2. **Test Dataset Switching**
   - Click dataset dropdown (top-left)
   - Switch between "Normal Operations", "Zone C Congestion", "Dock 2 Delay"
   - Verify entities change

3. **Test Entity Interaction**
   - Click on an orange worker
   - Verify detail panel opens on right
   - Click X to close

4. **Test Camera Controls**
   - Left-drag to orbit
   - Right-drag to pan
   - Scroll to zoom

5. **Test Reset**
   - Click Reset button
   - Verify camera returns to default position

## Performance Testing

### Check FPS (Frame Rate)

1. Open browser dev tools (F12)
2. In Console, type:
   ```javascript
   let lastTime = performance.now();
   let frames = 0;
   function measureFPS() {
     frames++;
     const now = performance.now();
     if (now >= lastTime + 1000) {
       console.log(`FPS: ${frames}`);
       frames = 0;
       lastTime = now;
     }
     requestAnimationFrame(measureFPS);
   }
   measureFPS();
   ```
3. Move camera around and observe FPS in console
4. Target: 60 FPS sustained

### Check Memory

1. Open dev tools → Performance tab
2. Click "Record"
3. Interact with app for 30 seconds
4. Stop recording
5. Check memory usage stays stable

## Troubleshooting

### Issue: Application doesn't start

**Solution:**
- Verify Node.js version: `node --version` (should be 18+)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for port conflicts on 5173

### Issue: Entities not visible

**Solution:**
- Open browser console and check for errors
- Verify CSV files exist in `/public/datasets/`
- Check camera position (try Reset button)

### Issue: CSV load fails

**Solution:**
- Check browser console for validation errors
- Verify CSV files have correct format (see DataContracts.md)
- Check file paths in DataService.ts

### Issue: Performance issues (low FPS)

**Solution:**
- Check entity count (should be <100)
- Disable browser extensions
- Try in Chrome/Edge (better WebGL performance)
- Check GPU acceleration is enabled

### Issue: TypeScript errors

**Solution:**
- Run `npm install` again to ensure all types are installed
- Check `tsconfig.json` is present
- Restart VS Code / editor

## Browser Compatibility

**Recommended:**
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

**Minimum Requirements:**
- WebGL 2.0 support
- ES2020 support

## Offline Testing

To test offline mode:

1. Build production version:
   ```bash
   npm run build
   ```

2. Serve locally without network:
   ```bash
   cd dist
   python3 -m http.server 8080
   ```

3. In browser dev tools, enable "Offline" mode
4. Navigate to `http://localhost:8080`
5. Test all functionality

## Test Data

Three datasets are provided in `/public/datasets/`:

1. **scenario_normal** - 15 entities, balanced operations
2. **scenario_congestion** - 27 entities, Zone C has 10+ workers
3. **scenario_dock_delay** - 23 entities, Dock 2 has 5+ pallets

### Adding New Test Data

1. Create folder in `/public/datasets/YOUR_SCENARIO/`
2. Add `warehouse_layout.csv` (copy from existing)
3. Add `warehouse_state.csv` with your entities
4. Update `DataService.ts` to include new dataset
5. Refresh app and select from dropdown

## Known Limitations (Slice 1)

- No KPI/metrics display (coming in Slice 2)
- No alerts or monitoring (coming in Slice 3)
- No timeline playback (coming in Slice 5)
- No chat interface (coming in Slice 6)
- Static warehouse layout (no editing)
- Single timestamp (no time-series animation)

## Next Steps

After completing Slice 1 acceptance tests:

1. Document any issues in GitHub/Jira
2. Gather performance metrics
3. Review with stakeholders
4. Plan Slice 2 implementation (KPI panel & health monitoring)

## Contact

For issues or questions, contact the development team.
