# ViewGizmo Disappearing - Fix Summary

## Problem
The 3D ViewGizmo keeps disappearing from the bottom-right corner of the screen.

## Root Causes Identified

1. **Theme Visibility Issue**: The ViewGizmo was using Tailwind's `dark:` prefix classes which weren't being applied reliably, causing the component to be invisible or poorly visible in certain theme states.

2. **Z-Index Conflicts**: The original `z-50` was too low and could be covered by other UI elements.

3. **Panel Overlap**: DrillDownPanel and EntityDetailPanel could grow tall enough to physically overlap the gizmo's position.

## Fixes Applied

### 1. Theme-Aware Inline Styles
Replaced all Tailwind `dark:` classes with inline styles that directly use the theme state:

```tsx
// Before: bg-white/95 dark:bg-[#16181f]/98
// After: 
style={{
  backgroundColor: theme === 'dark' ? '#16181f' : '#ffffff'
}}
```

### 2. Increased Z-Index
Changed from `z-50` to `z-[99999]` with inline style backup:

```tsx
style={{ 
  zIndex: 99999,
  position: 'fixed',
  bottom: '24px',
  right: '24px'
}}
```

### 3. Panel Max-Height Constraints
Added scroll constraints to panels that could grow and cover the gizmo:

- **DrillDownPanel**: Added `max-h-[calc(100vh-14rem)] overflow-y-auto`
- **EntityDetailPanel**: Added `max-h-[calc(100vh-8rem)] overflow-y-auto`

### 4. Debug Elements
Added temporary debug elements to verify rendering:
- Red pulsing dot in top-right corner of gizmo
- Console logs showing when component renders

## Files Modified

1. `/src/components/UI/ViewGizmo.tsx` - Main fixes for theme and visibility
2. `/src/components/Panels/DrillDownPanel.tsx` - Added max-height constraint
3. `/src/components/Panels/EntityDetailPanel.tsx` - Added max-height constraint

## Testing

To verify the fix:

1. Open http://127.0.0.1:5178/
2. Look for bright red debug dot in bottom-right corner
3. Check browser console for "🔴 ViewGizmo RENDERING NOW" messages
4. Toggle between light/dark themes - gizmo should be visible in both
5. Open DrillDownPanel (click a KPI) - gizmo should remain visible
6. Open EntityDetailPanel (click an entity) - gizmo should remain visible

## Next Steps

Once confirmed working:
1. Remove debug red dot
2. Remove console.log statements  
3. Test across different screen sizes
4. Verify all buttons (Map View, Birds Eye, Ortho, Persp) work correctly

## Technical Details

- ViewGizmo now uses `isolation: 'isolate'` to create new stacking context
- All colors are now theme-aware using direct state access instead of CSS classes
- Positioning uses both Tailwind classes AND inline styles for redundancy
- `pointerEvents: 'auto'` ensures the gizmo remains interactive
