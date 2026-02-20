import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { WarehouseLayoutElement } from '../../types';
import { CoordinateMapper } from '../../utils/coordinates';
import { interpolateColor, type ColorStop } from '../../utils/heatmapMaterials';

interface ParticleHeatMapProps {
    zones: WarehouseLayoutElement[];
    intensityData: Record<string, number>;
    colorScale: ColorStop[];
    baseParticleCount?: number; // per zone at max intensity
    animate?: boolean;
}

export default function ParticleHeatMap({
    zones,
    intensityData,
    colorScale,
    baseParticleCount = 200,
    animate = true
}: ParticleHeatMapProps) {
    const pointsRef = useRef<THREE.Points>(null);

    // Generate particles based on zones and intensity
    const { positions, colors, sizes, randoms } = useMemo(() => {
        const allPositions: number[] = [];
        const allColors: number[] = [];
        const allSizes: number[] = [];
        const allRandoms: number[] = []; // For animation phase

        zones.forEach(zone => {
            const intensity = intensityData[zone.element_id] || 0;
            if (intensity < 0.1) return; // Skip very low intensity

            // Calculate particle count for this zone
            const count = Math.floor(baseParticleCount * intensity);

            // Get zone boundaries in Three.js coordinates
            // CoordinateMapper center
            const center = CoordinateMapper.csvToThree(zone.x, zone.y, zone.z || 0);
            const height = zone.height || 3;

            const colorHex = interpolateColor(colorScale, intensity);
            const color = new THREE.Color(colorHex);

            for (let i = 0; i < count; i++) {
                // Random position within zone
                const x = center.x + (Math.random() - 0.5) * zone.width;
                const z = center.z + (Math.random() - 0.5) * zone.depth;
                const y = (Math.random() * height * 0.8) + 0.5; // Lift off ground

                allPositions.push(x, y, z);
                allColors.push(color.r, color.g, color.b);
                allSizes.push(0.3 + Math.random() * 0.4 * intensity); // Size varies with intensity
                allRandoms.push(Math.random(), Math.random(), Math.random());
            }
        });

        return {
            positions: new Float32Array(allPositions),
            colors: new Float32Array(allColors),
            sizes: new Float32Array(allSizes),
            randoms: new Float32Array(allRandoms)
        };
    }, [zones, intensityData, colorScale, baseParticleCount]);

    // Custom shader for coloring and size
    const shaderArgs = useMemo(() => ({
        uniforms: {
            time: { value: 0 },
            pixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 2 }
        },
        vertexShader: `
      uniform float time;
      uniform float pixelRatio;
      attribute float size;
      attribute vec3 customColor;
      attribute vec3 randoms;
      varying vec3 vColor;
      
      void main() {
        vColor = customColor;
        
        vec3 pos = position;
        
        // Floating animation
        float yOffset = sin(time * (0.5 + randoms.y) + randoms.x * 6.28) * 0.2;
        pos.y += yOffset;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * pixelRatio * (20.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
        fragmentShader: `
      varying vec3 vColor;
      
      void main() {
        // Circular particle
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;
        
        // Soft edge
        float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
        
        gl_FragColor = vec4(vColor, alpha * 0.8);
      }
    `,
        transparent: true,
        depthWrite: false, // For transparency
        blending: THREE.AdditiveBlending
    }), []);

    // Update time uniform
    useFrame(({ clock }) => {
        if (!animate || !pointsRef.current) return;
        const material = pointsRef.current.material as THREE.ShaderMaterial;
        material.uniforms.time.value = clock.getElapsedTime();
    });

    if (positions.length === 0) return null;

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-customColor"
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={sizes.length}
                    array={sizes}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-randoms"
                    count={randoms.length / 3}
                    array={randoms}
                    itemSize={3}
                />
            </bufferGeometry>
            <shaderMaterial args={[shaderArgs]} />
        </points>
    );
}
