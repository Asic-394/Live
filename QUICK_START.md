# Quick Start Guide - Slice 1

## 🚀 Getting Started (5 Minutes)

### 1. View the Application

The dev server is already running at:
**http://localhost:5173/**

Open this URL in Chrome, Edge, or Firefox.

### 2. Basic Navigation

**Camera Controls:**
- **Left-drag** = Rotate camera around warehouse
- **Right-drag** = Pan camera
- **Mouse wheel** = Zoom in/out

**UI Controls (Top-Left):**
- **Dataset dropdown** = Switch between scenarios
- **Reset button** = Return camera to default view

### 3. Try These Actions

1. **View the warehouse**
   - You should see zones (blue), aisles (yellow), racks (brown), and docks (green)
   - Labels show zone names

2. **Click an entity**
   - Click on an orange worker or yellow forklift
   - Detail panel opens on the right showing entity info
   - Click X to close

3. **Switch datasets**
   - Click dropdown, select "Zone C Congestion"
   - Watch entities change (Zone C will have many workers)
   - Try "Dock 2 Delay" to see pallets at shipping dock

4. **Reset view**
   - Move camera around
   - Click Reset button
   - Camera returns to birds-eye view

## 📊 Available Datasets

1. **Normal Operations** (default)
   - 15 entities
   - Balanced operations across all zones

2. **Zone C Congestion**
   - 27 entities
   - 10+ workers in Zone C (picking zone)
   - Demonstrates bottleneck scenario

3. **Dock 2 Delay**
   - 23 entities
   - 5+ pallets staged at Dock 2
   - Demonstrates capacity issues

## 🎨 Entity Colors

- **Orange cylinders** = Workers
- **Yellow boxes** = Forklifts
- **Brown boxes** = Pallets
- **Gray boxes** = Inventory (on racks)

## ⚡ Performance Tips

- Target: 60 FPS (check with browser dev tools)
- Close other browser tabs
- Enable hardware acceleration in browser settings
- Tested with up to 50 entities

## 🐛 Troubleshooting

**Entities not visible?**
- Press Reset button
- Check browser console (F12) for errors
- Verify you selected a dataset

**Camera stuck?**
- Press Reset button
- Reload page (Ctrl+R / Cmd+R)

**App won't load?**
- Check that dev server is running (see terminal)
- Verify port 5173 is not in use
- Clear browser cache

## 📝 What's Missing (By Design)

This is Slice 1 - foundation only. Not yet implemented:
- KPI/health metrics
- Alerts and notifications
- Heat maps / overlays
- Timeline playback
- Chat interface
- Recommendations

These features come in Slices 2-6.

## 📖 More Information

- **Full testing guide**: `TESTING_INSTRUCTIONS.md`
- **Manual acceptance tests**: `ACCEPTANCE_TESTS.md`
- **Implementation details**: `IMPLEMENTATION_SUMMARY.md`
- **Architecture docs**: `docs/Architecture.md`

## 🎯 Next Steps

1. Test the 10 acceptance tests in `ACCEPTANCE_TESTS.md`
2. Document any issues
3. Gather feedback
4. Plan Slice 2 (KPI panel & health monitoring)

---

**Need Help?**
- Check browser console (F12) for errors
- Review `TESTING_INSTRUCTIONS.md`
- Verify CSV files in `/public/datasets/`
