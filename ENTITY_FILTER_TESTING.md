# Entity Filter Testing Guide

## Quick Test (2 minutes)

The entity filter feature is now live at **http://localhost:5173/**

### Visual Check
1. Open http://localhost:5173/ in your browser
2. Look for the new **Filter Entities** panel in the top-left (below the Dataset Selector)
3. Verify you see 4 entity types with icons:
   - 👷 Workers (orange dot)
   - 🚜 Forklifts (yellow dot)  
   - 📦 Pallets (amber dot)
   - 🗃️ Inventory (gray dot)

### Basic Functionality Test
1. **Uncheck "Workers"** → Orange cylinders should disappear from the scene
2. **Check "Workers"** again → They should reappear
3. **Uncheck "Forklifts"** → Yellow vehicles should disappear
4. **Uncheck "Pallets"** → Brown boxes should disappear
5. **Click "Hide All"** → Scene should be empty, warning should appear
6. **Click "Show All"** → Everything should reappear

### Status Bar Check
- When filtering is active, status bar should show: **"X / Y entities"**
  - X = visible count (blue)
  - Y = total count (gray)
- When not filtering, it shows: **"Y entities"**

### Interactive Test
1. Load "Zone C Congestion" dataset (should have ~27 entities)
2. Uncheck all except "Workers"
3. Count badges should update to show:
   - Workers: ~10+ (visible)
   - Others: varying counts (grayed out)
4. Status bar should show something like "10 / 27 entities"

## Expected Behavior

### ✅ What Should Happen
- Entities disappear/appear instantly when toggling
- No lag or performance issues
- Count badges update immediately
- Status bar reflects current state
- Filters persist when switching datasets
- Theme toggle works (light/dark mode support)

### ❌ What Should NOT Happen
- No errors in browser console (F12)
- No flickering or glitches
- No FPS drops (should maintain 60 FPS)
- Selected entities should not break filtering

## Edge Cases to Test (Optional)

1. **Select entity, then hide its type**
   - Selection should clear
   - Entity detail panel should close

2. **Hide all, then switch dataset**
   - Scene should remain empty
   - New dataset loads but entities stay hidden

3. **Rapid toggling**
   - No performance degradation
   - Scene updates smoothly

## Troubleshooting

### Filter panel not visible
- **Fix:** Refresh the page (Cmd+R or Ctrl+R)
- **Cause:** Hot reload might not have picked up new component

### Console errors
- **Check:** Browser console (F12) for any error messages
- **Report:** Share error message for debugging

### Checkboxes not working
- **Try:** Click directly on the checkbox, not the label
- **Verify:** Count badges are updating

## Success Criteria

✅ All 4 entity types can be toggled on/off  
✅ "Show All" / "Hide All" works  
✅ Count badges show correct numbers  
✅ Status bar shows filtered count  
✅ No performance issues  
✅ Works in both light and dark mode  

---

**Ready to test!** Visit http://localhost:5173/ now.

If everything looks good, Slice 1 is officially **100% complete** ✨
