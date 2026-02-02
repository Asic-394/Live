# Changelog

## [Unreleased] - 2026-02-02

### Added - Rack Inventory System

#### New Components
- **RackInventory.tsx** - Renders inventory boxes on rack shelves
  - Procedurally generates box positions on 3 shelf levels per rack
  - Uses uniform grey boxes (3 per shelf maximum)
  - Includes wooden pallets on each shelf beam
  - Variable fill percentage (60-90%) for realistic randomness
  - Optimized rendering with ~75% fewer boxes than initial implementation

#### Features
- **Realistic Shelf Stacking**
  - Boxes positioned on shelf beams at 10%, 35%, and 65% of rack height
  - Pallets extend beyond rack width/depth to rest on beams
  - Boxes sit on top of pallets with proper vertical positioning
  
- **Visual Design**
  - Single grey box color (#6a6e75) matching rack aesthetic
  - Dark grey pallets (#3a3e42) for industrial look
  - Boxes sized to fit exactly 3 per shelf
  - Minimal rotation (±2 degrees) for slight realism

#### Technical Implementation
- **Performance Optimizations**
  - Reduced box count through larger box sizing (4.4 units -> calculated per rack)
  - Single row depth to minimize mesh count
  - Shared geometry for better memory usage
  - No shadow casting on boxes for performance

- **Configuration**
  - Box size dynamically calculated: `(rackWidth - spacing) / 3`
  - 3 shelf levels using bottom 3 beams (not top beam)
  - 60-90% random fill rate per shelf

### Modified

#### WarehouseLayout.tsx
- Added `RackInventory` component integration
- Renders inventory boxes and pallets for each rack
- Passes rack dimensions, camera distance, and dimming state

#### WarehouseScene.tsx
- Fixed floor z-fighting issues
- Adjusted world floor position (y=-0.2)
- Raised warehouse floor position (y=0.02)
- Improved floor layer separation

### Performance Impact
- Approximately 3-9 boxes per rack (depending on fill percentage)
- 100 racks × ~6 average boxes = ~600 total boxes
- Maintained 60 FPS target with optimized rendering

### Design Decisions
1. **Single box type** - Simplifies visual appearance and allows for future expansion
2. **Grey color scheme** - Matches industrial warehouse aesthetic
3. **3 boxes per shelf** - Balances visual fullness with performance
4. **Variable fill rate** - Adds realism (some shelves fuller than others)

---

## Notes
- All boxes use primitive geometry (BoxGeometry) for performance
- Future: Can add multiple box types, colors, or sizes
- Future: Can implement instanced rendering for even better performance
