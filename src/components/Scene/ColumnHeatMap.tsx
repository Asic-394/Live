import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import type { WarehouseLayoutElement } from '../../types';
import { CoordinateMapper } from '../../utils/coordinates';
import { interpolateColor, type ColorStop } from '../../utils/heatmapMaterials';

interface ColumnHeatMapProps {
    zones: WarehouseLayoutElement[];
    intensityData: Record<string, number>;
    colorScale: ColorStop[];
    maxHeight?: number;
    animationDuration?: number;
}

const ColumnMesh = ({
    zone,
    intensity,
    colorScale,
    maxHeight = 5,
    animationDuration = 0.8
}: {
    zone: WarehouseLayoutElement;
    intensity: number;
    colorScale: ColorStop[];
    maxHeight?: number;
    animationDuration?: number;
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    // Calculate base position
    const basePosition = useMemo(() => {
        const pos = CoordinateMapper.csvToThree(zone.x, zone.y, zone.z || 0);
        return new THREE.Vector3(pos.x, 0, pos.z);
    }, [zone.x, zone.y, zone.z]);

    // Target height based on intensity
    const targetHeight = useMemo(() => {
        // Minimum height of 0.1 so it's always visible as a floor plate
        return 0.2 + (intensity * maxHeight);
    }, [intensity, maxHeight]);

    // Target color
    const targetColor = useMemo(() => {
        return interpolateColor(colorScale, intensity);
    }, [intensity, colorScale]);

    // Animate height and color
    useEffect(() => {
        if (!meshRef.current || !materialRef.current) return;

        // Animate scale (height)
        gsap.to(meshRef.current.scale, {
            y: targetHeight,
            duration: animationDuration,
            ease: 'power2.inOut'
        });

        // Animate position Y to keep bottom anchored
        // The box geometry is centered, so y position needs to be height/2
        gsap.to(meshRef.current.position, {
            y: targetHeight / 2,
            duration: animationDuration,
            ease: 'power2.inOut'
        });

        // Animate color
        const colorProxy = { val: 0 }; // 0 to 1 interpolation
        const startColor = materialRef.current.color.clone();
        const endColor = new THREE.Color(targetColor);

        gsap.to(colorProxy, {
            val: 1,
            duration: animationDuration,
            ease: 'power2.inOut',
            onUpdate: () => {
                if (materialRef.current) {
                    materialRef.current.color.copy(startColor).lerp(endColor, colorProxy.val);
                    materialRef.current.emissive.copy(startColor).lerp(endColor, colorProxy.val);
                }
            }
        });

    }, [targetHeight, targetColor, animationDuration]);

    return (
        <mesh
            ref={meshRef}
            position={[basePosition.x, targetHeight / 2, basePosition.z]} // Initial pos
            scale={[1, 1, 1]} // Initial scale (will be animated)
            rotation={[0, (zone.rotation || 0) * Math.PI / 180, 0]}
        >
            {/* Box with unit dimensions, scaled by mesh.scale */}
            <boxGeometry args={[zone.width, 1, zone.depth]} />
            <meshStandardMaterial
                ref={materialRef}
                color={targetColor}
                emissive={targetColor}
                emissiveIntensity={0.5}
                transparent
                opacity={0.85}
                roughness={0.4}
                metalness={0.6}
            />
        </mesh>
    );
};

export default function ColumnHeatMap({
    zones,
    intensityData,
    colorScale,
    maxHeight = 8,
    animationDuration = 0.8
}: ColumnHeatMapProps) {

    // Filter zones that have valid dimensions
    const validZones = useMemo(() => {
        return zones.filter(z => z.width > 0 && z.depth > 0);
    }, [zones]);

    return (
        <group>
            {validZones.map(zone => (
                <ColumnMesh
                    key={zone.element_id}
                    zone={zone}
                    intensity={intensityData[zone.element_id] || 0}
                    colorScale={colorScale}
                    maxHeight={maxHeight}
                    animationDuration={animationDuration}
                />
            ))}
        </group>
    );
}
