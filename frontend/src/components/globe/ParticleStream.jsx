import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createArcFromCoords } from '../../utils/arcMath';
import { getAttackColor } from '../../utils/colors';

const GLOBE_RADIUS = 1.0;
const PARTICLE_COUNT = 12;

/**
 * Flowing particles along a single arc path.
 * Each particle traverses the Bezier curve at a slightly different speed,
 * creating a continuous stream effect.
 */
export default function ParticleStream({ attack }) {
  const pointsRef = useRef();
  const particlesRef = useRef([]);

  // Create the arc curve once
  const curve = useMemo(() => {
    const { curve: c } = createArcFromCoords(
      attack.sourceLat,
      attack.sourceLon,
      attack.destLat,
      attack.destLon,
      GLOBE_RADIUS,
    );
    return c;
  }, [attack.sourceLat, attack.sourceLon, attack.destLat, attack.destLon]);

  // Initialize particles with staggered starting positions
  const particleData = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      t: i / PARTICLE_COUNT + (Math.random() - 0.5) * 0.1,
      speed: 0.15 + Math.random() * 0.35,
    }));
  }, []);

  const color = getAttackColor(attack.attackType);

  useFrame((state, delta) => {
    if (!pointsRef.current || !curve) return;

    const positions = pointsRef.current.geometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particleData[i];
      p.t += p.speed * delta;
      if (p.t > 1) p.t -= 1;
      if (p.t < 0) p.t += 1;

      const pt = curve.getPoint(Math.max(0, Math.min(1, p.t)));
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={new Float32Array(PARTICLE_COUNT * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.015}
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
