import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToVec3 } from '../../utils/geoUtils';

const GLOBE_RADIUS = 1.0;

/**
 * Animated pulsing ring at a geographic location.
 * Used to mark attack sources (red) and the honeypot target (blue).
 */
export default function PulseMarker({ lat, lon, color = '#ef4444', size = 0.025 }) {
  const ringRef = useRef();
  const dotRef = useRef();

  const position = useMemo(
    () => latLonToVec3(lat, lon, GLOBE_RADIUS),
    [lat, lon],
  );

  // Normal direction (outward from sphere center)
  const normal = useMemo(() => position.clone().normalize(), [position]);

  // Create a quaternion to orient the ring to face outward
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    return q;
  }, [normal]);

  useFrame((state) => {
    if (!ringRef.current) return;

    const t = state.clock.getElapsedTime();
    const scale = 1 + 0.3 * Math.sin(t * 3);
    ringRef.current.scale.setScalar(scale);
    ringRef.current.material.opacity =
      0.6 * (1 - (scale - 1) / 0.3) * (0.7 + 0.3 * Math.sin(t * 2));
  });

  return (
    <group position={position} quaternion={quaternion}>
      {/* Outer ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[size, size * 1.6, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Center dot */}
      <mesh ref={dotRef}>
        <circleGeometry args={[size * 0.4, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
