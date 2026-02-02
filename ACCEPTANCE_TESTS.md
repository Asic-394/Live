# Slice 1 - Manual Acceptance Tests

## Prerequisites
- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Dev server running (`npm run dev`)

## Test 1: Warehouse Layout Load

**Objective:** Verify that the warehouse layout loads correctly and displays all elements.

**Steps:**
1. Open browser to `http://localhost:5173`
2. Wait for application to load

**Expected Results:**
- [ ] App loads without errors (check browser console)
- [ ] Default dataset (scenario_normal) loads automatically
- [ ] Warehouse zones visible (Zone-A, Zone-B, Zone-C, Zone-D)
- [ ] Zone labels rendered correctly above zones
- [ ] Aisles visible with yellow floor markings
- [ ] Racks visible as brown vertical boxes
- [ ] Docks visible as green platforms
- [ ] Load completes in <3 seconds

**Actual Results:**
- Status: [ ] Pass [ ] Fail
- Notes: 

---

## Test 2: Entity Rendering

**Objective:** Verify that all entities from CSV are rendered correctly.

**Steps:**
1. With scenario_normal loaded, observe the 3D scene
2. Count visible entities

**Expected Results:**
- [ ] All entities from CSV rendered on map (~15 entities)
- [ ] Workers appear as orange cylinders
- [ ] Forklifts appear as yellow boxes with fork attachments
- [ ] Pallets appear as brown boxes
- [ ] Inventory items appear as gray boxes at rack locations
- [ ] Entity positions match CSV coordinates (visually aligned with zones)
- [ ] Entity count in status bar shows correct number

**Actual Results:**
- Status: [ ] Pass [ ] Fail
- Entity count displayed: _____
- Notes:

---

## Test 3: Camera Controls

**Objective:** Verify that camera controls work smoothly.

**Steps:**
1. Left-click and drag to orbit camera
2. Right-click and drag to pan view
3. Scroll mouse wheel to zoom in/out
4. Test zoom limits (min/max)

**Expected Results:**
- [ ] Mouse drag orbits camera around warehouse center
- [ ] Mouse wheel zooms in/out smoothly
- [ ] Right-click + drag pans view
- [ ] Camera doesn't clip through warehouse geometry
- [ ] Camera movement feels smooth (no jank)
- [ ] Frame rate maintains 60 FPS during camera movement (check browser dev tools)
- [ ] Camera cannot go below ground plane

**Actual Results:**
- Status: [ ] Pass [ ] Fail
- FPS during movement: _____
- Notes:

---

## Test 4: Entity Selection

**Objective:** Verify entity click detection and detail panel.

**Steps:**
1. Click on a worker entity (orange cylinder)
2. Observe entity detail panel
3. Review displayed information
4. Click close button or background
5. Repeat with forklift, pallet, and inventory

**Expected Results:**
- [ ] Click entity highlights it (emissive glow effect)
- [ ] Entity detail panel opens on right side
- [ ] Panel shows: ID, type, zone, coordinates, status, task
- [ ] Metadata displayed as readable key-value pairs
- [ ] Click close button (X) deselects entity
- [ ] Panel closes smoothly
- [ ] Clicking background deselects entity
- [ ] Hover effect visible on entities (slight glow)

**Actual Results:**
- Status: [ ] Pass [ ] Fail
- Notes:

---

## Test 5: Dataset Selector

**Objective:** Verify dataset switching functionality.

**Steps:**
1. Click dataset dropdown (top-left)
2. Select "Zone C Congestion"
3. Wait for load
4. Observe changes
5. Switch to "Dock 2 Delay"

**Expected Results:**
- [ ] Dropdown lists 3 scenarios
- [ ] Selecting "Zone C Congestion" loads scenario
- [ ] Loading spinner shows during load
- [ ] New entities appear, old entities removed
- [ ] Camera resets to initial birds-eye view
- [ ] Dataset name updates in status bar
- [ ] Entity count updates correctly
- [ ] Zone C shows more workers (~10) in congestion scenario
- [ ] Dock 2 shows more pallets (~5) in dock delay scenario

**Actual Results:**
- Status: [ ] Pass [ ] Fail
- Zone C Congestion entity count: _____
- Dock 2 Delay entity count: _____
- Notes:

---

## Test 6: Reset Functionality

**Objective:** Verify reset button functionality.

**Steps:**
1. Zoom in on a specific zone
2. Pan camera to different location
3. Select an entity
4. Click "Reset" button
5. Observe changes

**Expected Results:**
- [ ] Click reset button
- [ ] Camera returns to initial birds-eye view
- [ ] Selected entity clears
- [ ] Entity detail panel closes
- [ ] Current dataset reloads (same entities appear)
- [ ] Reset completes in <2 seconds

**Actual Results:**
- Status: [ ] Pass [ ] Fail
- Reset time: _____ seconds
- Notes:

---

## Test 7: CSV Validation

**Objective:** Verify CSV validation and error handling.

**Setup:** This test requires modifying CSV files temporarily.

**Steps:**
1. Create a test CSV with missing required field (e.g., remove `x` column)
2. Try to load it via browser dev tools console: 
   ```js
   window.store.getState().loadDataset('scenario_normal')
   ```
3. Observe error message

**Expected Results:**
- [ ] Error message displays in red banner at bottom
- [ ] Error shows specific field missing and row number
- [ ] Error message is readable and helpful
- [ ] Error suggests fix (e.g., "Missing required field: x")
- [ ] Can close error banner

**Actual Results:**
- Status: [ ] Pass [ ] Fail
- Notes:

---

## Test 8: Performance

**Objective:** Verify performance meets targets.

**Steps:**
1. Load "Zone C Congestion" scenario (~27 entities)
2. Open browser dev tools (F12)
3. Go to Performance tab
4. Start recording
5. Orbit, pan, zoom camera for 10 seconds
6. Stop recording
7. Check FPS stats

**Expected Results:**
- [ ] 60 FPS sustained with 50+ entities visible
- [ ] No frame drops (jank) during camera movement
- [ ] Dataset switch completes in <2 seconds
- [ ] Memory usage stable (check Memory tab)
- [ ] No memory leaks after 10 dataset switches

**Actual Results:**
- Status: [ ] Pass [ ] Fail
- Average FPS: _____
- Min FPS: _____
- Dataset switch time: _____ seconds
- Notes:

---

## Test 9: Offline Operation

**Objective:** Verify app works without internet connection.

**Steps:**
1. Open browser dev tools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Reload page
5. Test dataset switching

**Expected Results:**
- [ ] App runs without internet connection
- [ ] All datasets load from bundled files
- [ ] No console errors about network failures
- [ ] All functionality works (dataset selector, reset, entity selection)

**Actual Results:**
- Status: [ ] Pass [ ] Fail
- Notes:

---

## Test 10: Responsive Layout

**Objective:** Verify UI works on different screen sizes.

**Steps:**
1. Test on 1920x1080 resolution
2. Test on 4K display (3840x2160) if available
3. Resize browser window

**Expected Results:**
- [ ] App works on 4K display (booth demo target)
- [ ] UI controls readable at 1920x1080
- [ ] Entity labels scale appropriately
- [ ] Detail panel doesn't cover scene inappropriately
- [ ] Controls remain accessible at different sizes

**Actual Results:**
- Status: [ ] Pass [ ] Fail
- Tested resolutions: _____
- Notes:

---

## Summary

**Total Tests:** 10
**Passed:** _____
**Failed:** _____
**Pass Rate:** _____%

**Critical Issues:**


**Minor Issues:**


**Notes:**


**Tester Name:** _________________
**Date:** _________________
**Browser:** _________________
**OS:** _________________
