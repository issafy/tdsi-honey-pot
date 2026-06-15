import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import useStore from '../../store';

/**
 * Camera controls for the globe.
 * Wraps drei's OrbitControls with auto-rotation and interaction detection.
 */
export default function GlobeControls() {
  const controlsRef = useRef();
  const globeAutoRotate = useStore((s) => s.globeAutoRotate);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      minDistance={2.2}
      maxDistance={6}
      autoRotate={globeAutoRotate}
      autoRotateSpeed={0.4}
      onStart={() => useStore.getState().setInteraction(true)}
      onEnd={() => {
        // Re-enable auto-rotate if no attack is selected
        const state = useStore.getState();
        if (!state.selectedAttack) {
          state.clearSelection();
        }
      }}
      target={[0, 0, 0]}
    />
  );
}
