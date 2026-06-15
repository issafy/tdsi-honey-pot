import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createArcFromCoords } from '../../utils/arcMath';
import { getAttackColor } from '../../utils/colors';

const GLOBE_RADIUS = 1.0;

/**
 * Renders a single animated attack arc on the globe.
 * Uses a dashed line with animated dashOffset for the "flowing" effect.
 */
export default function Arc({ attack, onClick }) {
  const lineRef = useRef();
  const lineMaterialRef = useRef();

  // Create the arc geometry once
  const { points, curve } = useMemo(() => {
    return createArcFromCoords(
      attack.sourceLat,
      attack.sourceLon,
      attack.destLat,
      attack.destLon,
      GLOBE_RADIUS,
    );
  }, [attack.sourceLat, attack.sourceLon, attack.destLat, attack.destLon]);

  // Create line geometry from points
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [points]);

  const color = getAttackColor(attack.attackType);

  // Animate dash offset each frame
  useFrame((state, delta) => {
    if (lineMaterialRef.current) {
      lineMaterialRef.current.dashOffset -= delta * 0.3;
      if (lineMaterialRef.current.dashOffset < -1) {
        lineMaterialRef.current.dashOffset += 1;
      }
    }
  });

  return (
    <group>
      {/* Dashed arc line */}
      <line geometry={geometry} ref={lineRef}>
        <lineDashedMaterial
          ref={lineMaterialRef}
          color={color}
          dashSize={0.12}
          gapSize={0.3}
          lineWidth={1}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </line>

      {/* Glow line behind it (slightly thicker, more transparent) */}
      <line geometry={geometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </line>
    </group>
  );
}
