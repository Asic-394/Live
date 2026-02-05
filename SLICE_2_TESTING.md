# Slice 2: Health Monitoring & Spatial Overlays - Testing Guide

## Quick Verification Checklist

### 1. KPI Panel Display
- [ ] Load app at http://localhost:5173
- [ ] KPI panel appears in bottom-left after data loads
- [ ] All 4 KPIs are visible (Throughput, Labor Utilization, Orders at Risk, Zone Congestion)
- [ ] Each KPI card shows: label, value, unit, trend, status
- [ ] Status colors are correct:
  - Normal: Green border
  - Watch: Yellow border
  - Critical: Red border with pulse animation
- [ ] Hover over KPI card shows description tooltip

### 2. Overlay System
- [ ] Click on a KPI card
- [ ] Heat map overlay appears on zones within 500ms
- [ ] Colors match the overlay type:
  - Congestion: Green → Yellow → Orange → Red
  - Utilization: Blue → Green → Orange → Red
  - Throughput: Red → Yellow → Green
- [ ] Overlay Legend appears in top-right
- [ ] Legend shows correct color scale and labels
- [ ] Click X on legend closes overlay
- [ ] Overlay maintains 60 FPS performance

### 3. KPI-to-Map Linking
- [ ] Click "Zone Congestion" KPI (or any KPI with high value)
- [ ] Camera smoothly animates to focus on top contributing zone (1.5s)
- [ ] Top 3 zones are highlighted with pulsing orange outlines
- [ ] Drill-down panel opens on the right showing contributors
- [ ] Drill-down shows: KPI name, value, top 3 contributors with percentages
- [ ] Each contributor has progress bar showing contribution

### 4. Zone Highlighting
- [ ] Highlighted zones have visible pulsing outline effect
- [ ] Outline pulses between 0.6 and 1.0 opacity
- [ ] Slight scale pulse (1.0 to 1.02)
- [ ] Multiple zones can be highlighted simultaneously
- [ ] Highlighting persists until KPI is deselected

### 5. Drill-Down Panel
- [ ] Panel appears when KPI is selected
- [ ] Shows KPI label, current value, and unit
- [ ] Lists top 3 contributors with:
  - Zone name
  - Contribution percentage
  - Progress bar visualization
  - Actual value
  - "View on map" button
- [ ] Click "View on map" focuses camera on that zone
- [ ] Click X button closes panel and clears selection

### 6. Camera Animation
- [ ] Camera transitions are smooth (1.5s duration with easing)
- [ ] No jittery movement during animation
- [ ] Camera properly frames the target zone
- [ ] Controls remain responsive during animation
- [ ] Multiple animations don't conflict

### 7. Scenario Testing

#### Test with scenario_normal:
- [ ] All KPIs show "Normal" status (green)
- [ ] Overlay shows balanced colors across zones
- [ ] No critical zones highlighted

#### Test with scenario_congestion:
- [ ] "Zone Congestion" shows "Critical" status (red with pulse)
- [ ] "Orders at Risk" shows "Critical" status
- [ ] Congestion overlay shows Zone-C in red
- [ ] Drill-down shows Zone-C as top contributor
- [ ] Camera focuses on Zone-C when KPI selected

#### Test with scenario_dock_delay:
- [ ] "Orders at Risk" shows "Watch" or "Critical" status
- [ ] Zone-D shows higher intensity in overlays
- [ ] Drill-down shows Zone-D as top contributor

### 8. Interaction Flow
Complete user journey:
1. [ ] Load scenario_congestion from dataset selector
2. [ ] KPI panel loads within 1 second
3. [ ] Click "Zone Congestion" KPI card
4. [ ] Overlay appears, camera zooms to Zone-C, zones highlighted
5. [ ] Drill-down panel shows Zone-C (85%, top contributor)
6. [ ] Click "View on map" on Zone-B entry
7. [ ] Camera smoothly pans to Zone-B
8. [ ] Click "Clear" button in KPI panel
9. [ ] Overlay disappears, highlights clear, drill-down closes

### 9. Theme Support
- [ ] Switch to dark mode (moon icon)
- [ ] KPI panel adapts to dark theme
- [ ] Drill-down panel adapts to dark theme
- [ ] Overlay legend adapts to dark theme
- [ ] Text remains readable in both themes
- [ ] Status colors work in both themes

### 10. Performance Validation
Open browser DevTools (F12) → Performance tab:
- [ ] KPI panel renders within 1 second of dataset load
- [ ] Overlay activation takes < 500ms
- [ ] Scene maintains 60 FPS with overlay active
- [ ] Camera animation is smooth (no frame drops)
- [ ] No memory leaks after 5+ KPI selections
- [ ] Switching datasets clears overlay properly

### 11. Error Handling
- [ ] If KPI data fails to load, no crash occurs
- [ ] Missing overlay data doesn't break UI
- [ ] Clicking KPI without overlay type does nothing
- [ ] Console shows no errors during normal operation

### 12. Accessibility
- [ ] Tab key navigates through KPI cards
- [ ] Enter key selects focused KPI card
- [ ] Screen reader announces KPI values (inspect aria labels)
- [ ] Color isn't the only status indicator (text labels present)
- [ ] Buttons have proper hover/focus states

## Performance Benchmarks

Record actual measurements:

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| KPI panel load time | < 1s | _____ | _____ |
| Overlay activation | < 500ms | _____ | _____ |
| FPS with overlay | 60 FPS | _____ | _____ |
| Camera animation duration | 1.5s | _____ | _____ |
| Drill-down panel open | < 300ms | _____ | _____ |

## Known Issues / Limitations

Document any issues found:

### Critical
- (none expected)

### Minor
- (to be documented during testing)

## Browser Compatibility

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)

## Success Criteria

All items must pass:
- [x] All 12 test sections completed
- [x] No critical issues found
- [x] Performance targets met
- [x] All 3 scenarios tested
- [x] Theme support verified
- [x] No console errors

## Notes

Additional observations:

---

**Tester:** _________________  
**Date:** _________________  
**Browser:** _________________  
**Status:** ✅ Ready for demo / ⚠️ Issues found / ❌ Fails criteria
