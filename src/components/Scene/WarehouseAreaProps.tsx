import * as THREE from 'three';
import { useSceneTheme } from '../../utils/useSceneTheme';
import { CoordinateMapper } from '../../utils/coordinates';
import type { WarehouseLayoutElement } from '../../types';
import BlobShadow from './BlobShadow';

interface WarehouseAreaPropsProps {
  zone: WarehouseLayoutElement;
  useRealShadows: boolean;
}

interface PropComponentProps {
  position: [number, number, number];
  useRealShadows: boolean;
}

// Packing Table - elevated work surface
function PackingTable({ position, useRealShadows }: PropComponentProps) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {/* Table legs */}
      {[[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.9, z]} castShadow={useRealShadows}>
          <cylinderGeometry args={[0.15, 0.15, 1.8, 8]} />
          <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      
      {/* Table top */}
      <mesh position={[0, 1.8, 0]} castShadow={useRealShadows} receiveShadow={useRealShadows}>
        <boxGeometry args={[4, 0.15, 3]} />
        <meshStandardMaterial color={theme.colors.dockPlatform} roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Blob shadow for grounding */}
      {!useRealShadows && (
        <BlobShadow width={4.5} depth={3.5} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.8} />
      )}
    </group>
  );
}

// Pallet Stack with boxes
function PalletStack({ position, useRealShadows, height = 1 }: PropComponentProps & { height?: number }) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {/* Pallet base */}
      <mesh position={[0, 0.15, 0]} castShadow={useRealShadows} receiveShadow={useRealShadows}>
        <boxGeometry args={[3.5, 0.3, 3.5]} />
        <meshStandardMaterial color={theme.colors.dockFrame} roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Pallet slats */}
      {[-1, 0, 1].map((offset, i) => (
        <mesh key={i} position={[0, 0.05, offset * 1]} castShadow={useRealShadows}>
          <boxGeometry args={[3.5, 0.1, 0.3]} />
          <meshStandardMaterial color={theme.colors.dockFrame} roughness={0.95} metalness={0.05} />
        </mesh>
      ))}
      
      {/* Stacked boxes - varying heights */}
      {Array.from({ length: height }).map((_, level) => (
        <group key={level} position={[0, 0.3 + level * 1.2, 0]}>
          {/* 4 boxes per level in 2x2 grid */}
          {[[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.6, z]} castShadow={useRealShadows}>
              <boxGeometry args={[1.5, 1.2, 1.5]} />
              <meshStandardMaterial 
                color={i % 3 === 0 ? theme.colors.boxLight : i % 3 === 1 ? theme.colors.boxMedium : theme.colors.boxDark} 
                roughness={0.8} 
                metalness={0.1} 
              />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Blob shadow */}
      {!useRealShadows && (
        <BlobShadow width={4} depth={4} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity} />
      )}
    </group>
  );
}

// Hand Cart/Dolly
function HandCart({ position, useRealShadows }: PropComponentProps) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {/* Cart platform */}
      <mesh position={[0, 0.3, 0]} castShadow={useRealShadows}>
        <boxGeometry args={[1.5, 0.15, 2]} />
        <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.6} metalness={0.3} />
      </mesh>
      
      {/* Wheels */}
      {[[-0.6, -0.8], [0.6, -0.8], [-0.6, 0.8], [0.6, 0.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.15, z]} rotation={[0, 0, Math.PI / 2]} castShadow={useRealShadows}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 12]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      
      {/* Handle */}
      <mesh position={[0, 1, -1]} castShadow={useRealShadows}>
        <cylinderGeometry args={[0.08, 0.08, 1.5, 8]} />
        <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.5} metalness={0.4} />
      </mesh>
      
      {!useRealShadows && (
        <BlobShadow width={2} depth={2.5} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.6} />
      )}
    </group>
  );
}

// Scanning Station
function ScanningStation({ position, useRealShadows }: PropComponentProps) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {/* Pedestal */}
      <mesh position={[0, 0.75, 0]} castShadow={useRealShadows}>
        <cylinderGeometry args={[0.25, 0.3, 1.5, 16]} />
        <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.5} metalness={0.4} />
      </mesh>
      
      {/* Scanner box */}
      <mesh position={[0, 1.6, 0]} castShadow={useRealShadows}>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color={theme.colors.boxBase} roughness={0.4} metalness={0.3} />
      </mesh>
      
      {/* Scanner screen/display */}
      <mesh position={[0, 1.75, 0.41]} castShadow={useRealShadows}>
        <boxGeometry args={[0.6, 0.15, 0.05]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.1} 
          metalness={0.8}
          emissive={theme.colors.accentCyan}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {!useRealShadows && (
        <BlobShadow width={1} depth={1} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.5} />
      )}
    </group>
  );
}

// Storage Bin
function StorageBin({ position, useRealShadows }: PropComponentProps) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow={useRealShadows} receiveShadow={useRealShadows}>
        <boxGeometry args={[1.2, 0.6, 0.8]} />
        <meshStandardMaterial color={theme.colors.boxMedium} roughness={0.7} metalness={0.2} />
      </mesh>
      
      {!useRealShadows && (
        <BlobShadow width={1.3} depth={0.9} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.4} />
      )}
    </group>
  );
}

// Safety Barrier
function SafetyBarrier({ position, useRealShadows, width = 8 }: PropComponentProps & { width?: number }) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {/* Posts */}
      {[-width / 2, width / 2].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0]} castShadow={useRealShadows}>
          <cylinderGeometry args={[0.12, 0.12, 1, 12]} />
          <meshStandardMaterial color={theme.colors.safetyYellow} roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      
      {/* Barrier tape/bar */}
      <mesh position={[0, 0.8, 0]} castShadow={useRealShadows}>
        <boxGeometry args={[width, 0.15, 0.15]} />
        <meshStandardMaterial color={theme.colors.safetyYellow} roughness={0.5} metalness={0.2} />
      </mesh>
      
      {!useRealShadows && (
        <BlobShadow width={width + 0.5} depth={0.5} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.5} />
      )}
    </group>
  );
}

// Conveyor Belt Section
function ConveyorBelt({ position, useRealShadows }: PropComponentProps) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {/* Conveyor frame/base */}
      <mesh position={[0, 0.4, 0]} castShadow={useRealShadows} receiveShadow={useRealShadows}>
        <boxGeometry args={[2, 0.8, 10]} />
        <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.6} metalness={0.3} />
      </mesh>
      
      {/* Belt surface */}
      <mesh position={[0, 0.85, 0]} castShadow={useRealShadows}>
        <boxGeometry args={[1.8, 0.1, 9.8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.05} />
      </mesh>
      
      {/* Rollers */}
      {Array.from({ length: 10 }).map((_, i) => {
        const z = -4.5 + i * 1;
        return (
          <mesh key={i} position={[0, 0.75, z]} rotation={[0, 0, Math.PI / 2]} castShadow={useRealShadows}>
            <cylinderGeometry args={[0.08, 0.08, 1.6, 8]} />
            <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.4} metalness={0.5} />
          </mesh>
        );
      })}
      
      {!useRealShadows && (
        <BlobShadow width={2.5} depth={10.5} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.9} />
      )}
    </group>
  );
}

// Stretch Wrap Dispenser Stand
function StretchWrapDispenser({ position, useRealShadows }: PropComponentProps) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.2, 0]} castShadow={useRealShadows}>
        <cylinderGeometry args={[0.4, 0.5, 0.4, 16]} />
        <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.6} metalness={0.3} />
      </mesh>
      
      {/* Post */}
      <mesh position={[0, 1, 0]} castShadow={useRealShadows}>
        <cylinderGeometry args={[0.15, 0.15, 2, 12]} />
        <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.5} metalness={0.4} />
      </mesh>
      
      {/* Wrap roll holder */}
      <mesh position={[0, 1.8, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow={useRealShadows}>
        <cylinderGeometry args={[0.3, 0.3, 0.8, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.4} 
          metalness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {!useRealShadows && (
        <BlobShadow width={1.2} depth={1.2} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.6} />
      )}
    </group>
  );
}

// Label Printer Stand
function LabelPrinterStand({ position, useRealShadows }: PropComponentProps) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {/* Post */}
      <mesh position={[0, 0.75, 0]} castShadow={useRealShadows}>
        <cylinderGeometry args={[0.12, 0.15, 1.5, 12]} />
        <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.5} metalness={0.4} />
      </mesh>
      
      {/* Printer box */}
      <mesh position={[0, 1.6, 0]} castShadow={useRealShadows}>
        <boxGeometry args={[0.8, 0.4, 0.6]} />
        <meshStandardMaterial color={theme.colors.boxBase} roughness={0.6} metalness={0.2} />
      </mesh>
      
      {/* Label slot */}
      <mesh position={[0, 1.4, 0.31]} castShadow={useRealShadows}>
        <boxGeometry args={[0.5, 0.05, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
      </mesh>
      
      {!useRealShadows && (
        <BlobShadow width={1} depth={0.8} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.5} />
      )}
    </group>
  );
}

// Shipping Cart with cargo
function ShippingCart({ position, useRealShadows }: PropComponentProps) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {/* Cart platform - larger than hand cart */}
      <mesh position={[0, 0.4, 0]} castShadow={useRealShadows}>
        <boxGeometry args={[2, 0.2, 2.5]} />
        <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.6} metalness={0.3} />
      </mesh>
      
      {/* Wheels */}
      {[[-0.8, -1], [0.8, -1], [-0.8, 1], [0.8, 1]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]} rotation={[0, 0, Math.PI / 2]} castShadow={useRealShadows}>
          <cylinderGeometry args={[0.2, 0.2, 0.25, 12]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      
      {/* Cargo boxes on cart */}
      <mesh position={[0, 1, 0]} castShadow={useRealShadows}>
        <boxGeometry args={[1.6, 1.2, 2.2]} />
        <meshStandardMaterial color={theme.colors.boxLight} roughness={0.8} metalness={0.1} />
      </mesh>
      
      {!useRealShadows && (
        <BlobShadow width={2.5} depth={3} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.7} />
      )}
    </group>
  );
}

// Scale Platform
function ScalePlatform({ position, useRealShadows }: PropComponentProps) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {/* Scale base */}
      <mesh position={[0, 0.1, 0]} castShadow={useRealShadows}>
        <boxGeometry args={[2.5, 0.2, 2.5]} />
        <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.5} metalness={0.4} />
      </mesh>
      
      {/* Scale platform */}
      <mesh position={[0, 0.25, 0]} castShadow={useRealShadows} receiveShadow={useRealShadows}>
        <boxGeometry args={[2.2, 0.08, 2.2]} />
        <meshStandardMaterial color={theme.colors.boxBase} roughness={0.6} metalness={0.3} />
      </mesh>
      
      {/* Display post */}
      <mesh position={[1.2, 0.8, 1.2]} castShadow={useRealShadows}>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
        <meshStandardMaterial color={theme.colors.rackDefault} roughness={0.5} metalness={0.4} />
      </mesh>
      
      {/* Display screen */}
      <mesh position={[1.2, 1.5, 1.2]} castShadow={useRealShadows}>
        <boxGeometry args={[0.5, 0.3, 0.1]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.2} 
          metalness={0.7}
          emissive={theme.colors.accentCyan}
          emissiveIntensity={0.15}
        />
      </mesh>
      
      {!useRealShadows && (
        <BlobShadow width={2.8} depth={2.8} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.7} />
      )}
    </group>
  );
}

// Cardboard Box Stack
function CardboardBoxStack({ position, useRealShadows, height = 2 }: PropComponentProps & { height?: number }) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {Array.from({ length: height }).map((_, i) => (
        <mesh key={i} position={[0, 0.4 + i * 0.8, 0]} castShadow={useRealShadows}>
          <boxGeometry args={[1.2, 0.8, 1.2]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? theme.colors.boxLight : theme.colors.boxMedium} 
            roughness={0.85} 
            metalness={0.05} 
          />
        </mesh>
      ))}
      
      {!useRealShadows && (
        <BlobShadow width={1.5} depth={1.5} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.6} />
      )}
    </group>
  );
}

// Safety Cone
function SafetyCone({ position, useRealShadows }: PropComponentProps) {
  const theme = useSceneTheme();
  
  return (
    <group position={position}>
      {/* Cone base */}
      <mesh position={[0, 0.05, 0]} castShadow={useRealShadows}>
        <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Cone */}
      <mesh position={[0, 0.4, 0]} castShadow={useRealShadows}>
        <coneGeometry args={[0.2, 0.7, 16]} />
        <meshStandardMaterial color="#ff6600" roughness={0.6} metalness={0.1} />
      </mesh>
      
      {/* Reflective stripe */}
      <mesh position={[0, 0.5, 0]} castShadow={useRealShadows}>
        <cylinderGeometry args={[0.15, 0.18, 0.1, 16]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.3} 
          metalness={0.5}
          emissive="#ffffff"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {!useRealShadows && (
        <BlobShadow width={0.6} depth={0.6} position={[0, 0.01, 0]} opacity={theme.shadows.blob.opacity * 0.4} />
      )}
    </group>
  );
}

// Receiving Area Props Layout
function ReceivingAreaProps({ 
  zone, 
  useRealShadows 
}: { 
  zone: WarehouseLayoutElement; 
  useRealShadows: boolean;
}) {
  const pos = CoordinateMapper.csvToThree(zone.x, zone.y, 0);
  
  // Calculate positions relative to zone center
  const zoneWidth = zone.width;
  const zoneDepth = zone.depth;
  
  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Scanning stations - front area */}
      <ScanningStation position={[-zoneWidth / 4, 0, -zoneDepth / 3]} useRealShadows={useRealShadows} />
      <ScanningStation position={[0, 0, -zoneDepth / 3]} useRealShadows={useRealShadows} />
      
      {/* Conveyor belt - side area */}
      <ConveyorBelt position={[zoneWidth / 3, 0, -zoneDepth / 4]} useRealShadows={useRealShadows} />
      
      {/* Packing tables - middle row */}
      <PackingTable position={[-zoneWidth / 3, 0, 0]} useRealShadows={useRealShadows} />
      <PackingTable position={[0, 0, 0]} useRealShadows={useRealShadows} />
      <PackingTable position={[zoneWidth / 4, 0, 0]} useRealShadows={useRealShadows} />
      
      {/* Hand carts - front corner */}
      <HandCart position={[-zoneWidth / 3, 0, -zoneDepth / 3]} useRealShadows={useRealShadows} />
      <HandCart position={[-zoneWidth / 3 + 3, 0, -zoneDepth / 3]} useRealShadows={useRealShadows} />
      
      {/* Pallet stacks with boxes - back area grid */}
      {[-1, 0, 1].map((col) => 
        [0, 1].map((row) => (
          <PalletStack 
            key={`pallet-${col}-${row}`}
            position={[col * 12 - 8, 0, zoneDepth / 4 + row * 8]} 
            useRealShadows={useRealShadows}
            height={row === 0 ? 2 : 1}
          />
        ))
      )}
      
      {/* Storage bins - organized row */}
      {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
        <StorageBin 
          key={`bin-${i}`}
          position={[i * 4 - 8, 0, zoneDepth / 3]} 
          useRealShadows={useRealShadows}
        />
      ))}
      
      {/* Safety barriers - perimeter */}
      <SafetyBarrier position={[0, 0, zoneDepth / 2 - 2]} useRealShadows={useRealShadows} width={zoneWidth - 20} />
    </group>
  );
}

// Shipping Area Props Layout
function ShippingAreaProps({ 
  zone, 
  useRealShadows 
}: { 
  zone: WarehouseLayoutElement; 
  useRealShadows: boolean;
}) {
  const pos = CoordinateMapper.csvToThree(zone.x, zone.y, 0);
  
  const zoneWidth = zone.width;
  const zoneDepth = zone.depth;
  
  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* Packing stations - front row (enhanced workstations) */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <PackingTable 
          key={`station-${i}`}
          position={[i * 15 - 15, 0, -zoneDepth / 3]} 
          useRealShadows={useRealShadows}
        />
      ))}
      
      {/* Scales - middle area */}
      <ScalePlatform position={[-zoneWidth / 4, 0, 0]} useRealShadows={useRealShadows} />
      <ScalePlatform position={[zoneWidth / 4, 0, 0]} useRealShadows={useRealShadows} />
      
      {/* Label printer stands */}
      <LabelPrinterStand position={[-zoneWidth / 6, 0, -zoneDepth / 5]} useRealShadows={useRealShadows} />
      <LabelPrinterStand position={[0, 0, -zoneDepth / 5]} useRealShadows={useRealShadows} />
      <LabelPrinterStand position={[zoneWidth / 6, 0, -zoneDepth / 5]} useRealShadows={useRealShadows} />
      
      {/* Stretch wrap dispensers */}
      <StretchWrapDispenser position={[-zoneWidth / 4, 0, zoneDepth / 6]} useRealShadows={useRealShadows} />
      <StretchWrapDispenser position={[zoneWidth / 4, 0, zoneDepth / 6]} useRealShadows={useRealShadows} />
      
      {/* Shipping carts with cargo */}
      {[-2, -1, 0, 1].map((i) => (
        <ShippingCart 
          key={`cart-${i}`}
          position={[i * 10 - 15, 0, zoneDepth / 4]} 
          useRealShadows={useRealShadows}
        />
      ))}
      
      {/* Cardboard box stacks - ready for packing */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <CardboardBoxStack 
          key={`boxes-${i}`}
          position={[i * 8 - 16, 0, zoneDepth / 3]} 
          useRealShadows={useRealShadows}
          height={i % 3 + 1}
        />
      ))}
      
      {/* Safety cones - perimeter markers */}
      {[-3, -2, 2, 3].map((i) => (
        <SafetyCone 
          key={`cone-${i}`}
          position={[i * 12, 0, zoneDepth / 2 - 3]} 
          useRealShadows={useRealShadows}
        />
      ))}
      
      {/* Additional safety barriers */}
      <SafetyBarrier position={[-zoneWidth / 3, 0, -zoneDepth / 2 + 2]} useRealShadows={useRealShadows} width={20} />
      <SafetyBarrier position={[zoneWidth / 3, 0, -zoneDepth / 2 + 2]} useRealShadows={useRealShadows} width={20} />
    </group>
  );
}

// Main Component
export default function WarehouseAreaProps({ zone, useRealShadows }: WarehouseAreaPropsProps) {
  const zoneName = zone.name?.toLowerCase() || '';
  const isReceiving = zoneName.includes('receiving');
  const isShipping = zoneName.includes('shipping');
  
  if (!isReceiving && !isShipping) {
    return null;
  }
  
  return (
    <>
      {isReceiving && <ReceivingAreaProps zone={zone} useRealShadows={useRealShadows} />}
      {isShipping && <ShippingAreaProps zone={zone} useRealShadows={useRealShadows} />}
    </>
  );
}
