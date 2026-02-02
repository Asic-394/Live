# Warehouse Live - Slice 1: Foundation & Basic Spatial Monitoring

A spatial monitoring application for warehouse operations built with React, Three.js, and TypeScript.

## Features (Slice 1)

- **3D Warehouse Visualization**: View warehouse layout with zones, aisles, racks, and docks
- **Entity Rendering**: Visualize workers, forklifts, pallets, and inventory as 3D primitives
- **Interactive Controls**: Orbit, pan, and zoom camera controls
- **Entity Details**: Click on entities to view detailed information
- **Dataset Selector**: Switch between different operational scenarios
- **CSV-Driven**: Load warehouse data from CSV files (offline-first)

## Tech Stack

- React 18 + TypeScript (strict mode)
- Vite (build tool)
- Three.js + React Three Fiber (3D rendering)
- Zustand (state management)
- PapaParse (CSV parsing)
- Tailwind CSS (styling)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
/src
  /components
    /Scene              # Three.js scene components
    /Controls           # UI controls (dataset selector, reset)
    /Panels             # Entity detail panel
  /services
    DataService.ts      # CSV loading & validation
  /data
    /parsers            # CSV parsers
    /validators         # Schema validators
  /state
    store.ts            # Zustand state management
  /types
    index.ts            # TypeScript types
  /utils
    coordinates.ts      # Coordinate mapping helpers
/public
  /datasets
    scenario_normal/    # Sample dataset 1
    scenario_congestion/ # Sample dataset 2
    scenario_dock_delay/ # Sample dataset 3
```

## Sample Datasets

Three sample scenarios are included:

1. **Normal Operations** - Healthy warehouse operations with balanced load
2. **Zone C Congestion** - High worker density in Zone C
3. **Dock 2 Delay** - Capacity issues at shipping dock

### CSV Format

See `docs/DataContracts.md` for detailed schema documentation.

- `warehouse_layout.csv` - Defines zones, aisles, racks, docks
- `warehouse_state.csv` - Entity positions and states at a point in time

## Performance Targets

- Load warehouse layout in <2 seconds
- Maintain 60 FPS with 50+ entities
- Dataset switching with smooth transitions
- Offline operation (no network calls)

## Troubleshooting

- **Entities not visible**: Check CSV coordinates are within warehouse bounds
- **Camera stuck**: Press Reset button or reload page
- **CSV load fails**: Check browser console for validation errors
- **Performance issues**: Reduce entity count in CSV (<100 entities recommended)

## Next Steps (Future Slices)

- KPI/Vitals Panel with health monitoring
- Alert system with explainability
- Heat map overlays
- Recommendations and plan tuning
- Timeline replay and what-if comparison
- Conversational interface

## License

Proprietary - Warehouse Live MVP for ICON 2026
