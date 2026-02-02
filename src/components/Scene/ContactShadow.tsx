import * as THREE from 'three';

interface ContactShadowProps {
  width: number;
  depth: number;
  position?: [number, number, number];
  opacity?: number;
}

/**
 * Simple contact shadow for better object grounding
 * Creates a soft radial gradient shadow beneath objects
 */
export default function ContactShadow({ 
  width, 
  depth, 
  position = [0, 0.01, 0],
  opacity = 0.3 
}: ContactShadowProps) {
  // Create radial gradient texture
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width * 1.2, depth * 1.2]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.MultiplyBlending}
      />
    </mesh>
  );
}
