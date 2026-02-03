# Premium Light/Dark Mode Theme System

## Overview

A comprehensive theme system has been implemented for the warehouse digital twin, affecting both the UI layer and the 3D scene. The system provides two distinct visual experiences:

- **Dark Mode**: Moody "command center" atmosphere with dramatic lighting and strong shadows
- **Light Mode**: Bright "map/diagram" aesthetic with even illumination and soft shadows

## Architecture

### Theme Token System

All theme settings are centralized in `/src/utils/materials.ts` through the `ThemeConfig` interface:

```typescript
interface ThemeConfig {
  colors: { /* 40+ color tokens */ };
  materials: {
    floor: { roughness, metalness };
    wall: { roughness, metalness };
    rack: { roughness, metalness };
    entity: { roughness, metalness };
  };
  lighting: {
    ambient: { intensity, color };
    keyLight: { intensity, color, position };
    fillLight: { intensity, color, position };
    spotLight: { intensity, angle, penumbra, color };
    hemisphere: { intensity, skyColor, groundColor };
  };
  shadows: {
    blob: { opacity, sizeMultiplier };
    contact: { blur, opacity };
  };
  effects: {
    selection: { emissiveIntensity, glowColor };
    hover: { emissiveIntensity };
  };
}
```

### Key Function

Use `getThemeConfig(theme)` to access all theme tokens throughout the application.

## Dark Mode - "Command Center" Aesthetic

### Visual Characteristics
- **Dramatic lighting**: Low ambient (0.3), strong key light (1.4) for high contrast
- **Deep shadows**: 0.45 opacity for visible grounding
- **Matte materials**: 0.95 roughness on floors for industrial feel
- **Bright accents**: Cyan selection glow (#00D9FF) at 1.2 emissive intensity
- **Moody atmosphere**: Dark background (#1a1d22) with focused highlights

### Lighting Configuration
- Ambient: 0.3 intensity (low for drama)
- Key Light: 1.4 intensity (strong directional)
- Fill Light: 0.7 intensity (moderate shadows)
- Spot Light: 0.6 intensity (overhead grounding)
- Hemisphere: Sky-ground gradient for depth

### Material Properties
- Floor: roughness 0.95, metalness 0.02 (very matte concrete)
- Wall: roughness 0.95, metalness 0.05 (matte painted)
- Rack: roughness 0.45, metalness 0.2 (semi-matte metal)
- Entity: roughness 0.6, metalness 0.15 (worn equipment)

## Light Mode - "Map/Diagram" Aesthetic

### Visual Characteristics
- **Even illumination**: High ambient (0.55), softer key light (0.9)
- **Soft shadows**: 0.3 opacity for gentle depth
- **Smooth materials**: 0.8 roughness on floors for slight reflectivity
- **Clean contrast**: Darker objects on light background
- **Bright atmosphere**: Light background (#e8ebef) with high legibility

### Lighting Configuration
- Ambient: 0.75 intensity (very high for bright diagram)
- Key Light: 1.1 intensity (strong clear illumination)
- Fill Light: 0.7 intensity (strong fill to eliminate shadows)
- Spot Light: 0.6 intensity (noticeable overhead)
- Hemisphere: Sky-ground gradient for depth

### Material Properties
- Floor: roughness 0.6, metalness 0.12 (highly reflective polished concrete)
- Wall: roughness 0.65, metalness 0.15 (smooth reflective painted surface)
- Rack: roughness 0.25, metalness 0.4 (very reflective metal for brightness)
- Entity: roughness 0.4, metalness 0.2 (smooth reflective equipment)

## Implementation Details

### Files Modified

1. **`/src/utils/materials.ts`**
   - Added `ThemeConfig` interface
   - Created `DARK_THEME_CONFIG` and `LIGHT_THEME_CONFIG` objects
   - Added `getThemeConfig()` function
   - Updated material helper functions to use theme tokens

2. **`/src/components/Scene/WarehouseScene.tsx`**
   - Updated all lighting to use theme token intensities and colors
   - Applied theme material properties to floors
   - Added inline comments for theme tokens

3. **`/src/components/Scene/BlobShadow.tsx`**
   - Enhanced with theme-aware opacity from config
   - Adjusted gradient stops for better visibility per mode
   - Applied theme size multiplier for grounding emphasis

4. **`/src/components/Scene/EntityRenderer.tsx`**
   - Updated all entity types (worker, forklift, pallet, inventory)
   - Applied theme selection and hover emissive intensities
   - Used theme entity material properties

5. **`/src/components/Scene/RackFrame.tsx`**
   - Added theme parameter
   - Applied theme rack material properties (roughness/metalness)

6. **`/src/components/Scene/WarehouseLayout.tsx`**
   - Updated rack selection/hover effects with theme tokens
   - Applied theme glow colors to selection outlines
   - Added theme token comments to all labels

### Theme Token Comments

Throughout the codebase, inline comments mark where theme tokens are applied:

```typescript
// Theme token: ambient lighting for overall brightness and mood
// Theme token: floor roughness for aesthetic
// Theme token: shadow opacity for grounding
// Theme token: selection glow intensity
// Theme token: hover feedback
```

## Depth Cues Maintained

Both themes maintain strong depth perception through:

### Layering
- World floor at y=-0.2
- Blob shadows at y=0.005
- Warehouse floor at y=0.02
- Proper z-ordering with depthWrite/depthTest

### Shadow Contact
- Blob shadows directly under objects
- Theme-aware opacity (0.45 dark, 0.3 light)
- Size multiplier for grounding emphasis

### Material Variation
- Distinct roughness values between surfaces
- Appropriate metalness for different materials
- Color contrast between floors/walls/racks

### Lighting Gradient
- Hemisphere light provides sky-ground gradient
- Directional lights create form and separation
- Spot light adds overhead definition

## Performance Considerations

- No heavy postprocessing used
- Blob shadows use canvas texture (highly optimized)
- Theme tokens enable easy tweaking without performance cost
- Material properties cached in theme config

## Usage

The theme toggle button (`ThemeToggle.tsx`) switches between modes. The theme state is:
- Stored in Zustand store
- Persisted to localStorage
- Applied via `dark` class on document root
- Accessed throughout 3D scene via `getThemeConfig(theme)`

## Customization

To adjust the theme, edit the theme config objects in `/src/utils/materials.ts`:

```typescript
const DARK_THEME_CONFIG: ThemeConfig = {
  colors: { /* ... */ },
  materials: { /* adjust roughness/metalness */ },
  lighting: { /* adjust intensities/colors */ },
  shadows: { /* adjust opacity/size */ },
  effects: { /* adjust selection/hover intensity */ },
};
```

All components will automatically use the updated values.

## Result

The theme toggle now transforms the entire experience:

### Dark Mode
✓ Moody command center atmosphere
✓ Dramatic light/shadow contrast
✓ Objects clearly grounded on floor
✓ Cyan accents pop against dark background
✓ Premium matte materials
✓ Depth through lighting

### Light Mode
✓ Bright diagram clarity
✓ Soft shadows for gentle depth
✓ High legibility with strong contrast
✓ Clean minimal aesthetic
✓ Slightly reflective materials
✓ Depth through material contrast

Both modes maintain the premium, minimal, low-poly style while providing distinctly different visual experiences optimized for their respective use cases.
