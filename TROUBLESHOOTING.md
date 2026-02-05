# Troubleshooting: Boxes Not Visible

## Issue
Inventory boxes are not rendering in the 3D scene after optimization.

## Quick Fixes

### 1. Check Port and Restart Server

The server now runs on **port 5174** (changed from 5173 due to permission issues):

```bash
# Kill any running process on port 5174
lsof -ti:5174 | xargs kill -9

# Start dev server
npm run dev
```

Open browser to: **http://127.0.0.1:5174**

### 2. Check Browser Console

Open browser DevTools (F12) and look for:

**Expected logs:**
```
📦 Box counts: { total: 1512, stored: 1200, staged: 100, ... }
✅ Updating 1200 instances for mesh stored
✅ Updated 1200 box instances at positions
```

**If you see errors:**
- `❌ Cannot update instances` → Boxes or warehouse layout not loaded
- THREE.js errors → Instancing issue

### 3. Verify Data is Loading

In browser console, type:
```javascript
// Check if boxes are loaded
window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.findFiberByHostInstance?.(document.querySelector('canvas'))?.memoizedProps?.children?.props?.boxes?.length
```

Or simpler - look for these console logs when you load a dataset:
```
✅ Loaded 1512 boxes with ...
```

### 4. Temporary Fallback: Use Original Box Renderer

If instanced boxes still don't show, temporarily switch back to the original renderer:

**Edit `src/components/Scene/RackInventory.tsx`:**

Find line ~185 and uncomment the InventoryBox component:
```tsx
{/* Real inventory boxes rendered via InstancedInventoryBoxes in parent component */}
// TEMPORARY: Uncomment this to use original box renderer
{rackBoxes.map((box) => (
  <InventoryBox
    key={box.box_id}
    box={box}
    isSelected={selectedBox === box.box_id}
    isDimmed={isDimmed}
    onClick={() => selectBox(box.box_id)}
    scale={boxScale}
  />
))}
```

## Common Causes

### 1. Boxes Not Loading
**Symptom:** Console shows `Box counts: { total: 0, ... }`

**Solution:** 
- Ensure you selected a dataset (e.g., "Congestion Scenario")
- Check that CSV files exist in `public/datasets/`
- Check browser Network tab for failed file loads

### 2. Warehouse Layout Missing
**Symptom:** Console shows `❌ Cannot update instances: hasLayout: false`

**Solution:**
- Warehouse layout CSV not loading
- Check `public/datasets/[scenario]/warehouse_layout.csv` exists

### 3. InstancedMesh Not Initializing
**Symptom:** Boxes count > 0 but no visual rendering

**Solution:**
- Geometry or material issue
- Check browser console for THREE.js errors
- Try disabling frustum culling (already done in latest code)

### 4. Boxes Positioned Outside View
**Symptom:** Scene loads but boxes not visible

**Solution:**
- Reset camera (click reset button in UI)
- Zoom out to see full warehouse
- Check box positions in console logs

## Debug Commands

Add these to browser console to inspect:

```javascript
// Check store state
const state = window.__warehouse_store_debug__;
console.log('Boxes:', state?.boxes?.length);
console.log('Layout:', state?.warehouseLayout);

// Check if InstancedMesh exists
const canvas = document.querySelector('canvas');
console.log('Canvas:', canvas);
```

## If All Else Fails

Revert to original rendering temporarily:

```bash
# Checkout original files
git checkout HEAD~1 src/components/Scene/WarehouseScene.tsx
git checkout HEAD~1 src/components/Scene/RackInventory.tsx

# Restart server
npm run dev
```

Then boxes should render using the original (slower but proven) method.

## Need Help?

Check these files for the optimization implementation:
- `src/components/Scene/InstancedInventoryBoxes.tsx` - Main instanced renderer
- `src/components/Scene/WarehouseScene.tsx` - Scene integration
- `src/components/Scene/RackInventory.tsx` - Rack box setup

The debug logs added will help identify exactly where the issue is.
