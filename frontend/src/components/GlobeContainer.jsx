import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Globe from './globe/Globe';
import Atmosphere from './globe/Atmosphere';
import ArcLayer from './globe/ArcLayer';
import GlobeControls from './globe/GlobeControls';
import Spinner from './ui/Spinner';
import ErrorBoundary from './ErrorBoundary';
import FlatGlobe from './FlatGlobe';
import { createLogger } from '../utils/logger';

const log = createLogger('globe-container');

/**
 * Full-viewport globe container.
 * Always attempts 3D first. The ErrorBoundary catches any WebGL crash
 * and falls back to the 2D FlatGlobe.
 */
export default function GlobeContainer() {
  return (
    <div className="absolute inset-0 z-0">
      <ErrorBoundary
        fallback={<FlatGlobe />}
        onError={(err) => log.error('3D globe crashed, showing 2D fallback', err.message)}
      >
        <Canvas
          camera={{ position: [0, 0, 3.8], fov: 45, near: 0.1, far: 20 }}
          gl={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false,
          }}
          style={{ background: 'radial-gradient(circle at center, #0a1628 0%, #050a14 100%)' }}
        >
          <ambientLight intensity={0.15} />
          <directionalLight position={[5, 3, 5]} intensity={0.8} />
          <directionalLight position={[-5, -2, -3]} intensity={0.3} color="#4444aa" />

          <Suspense fallback={null}>
            <Globe />
            <Atmosphere />
            <ArcLayer />
            <GlobeControls />
            <Stars />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}

function Stars() {
  const positions = [];
  for (let i = 0; i < 600; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 8 + Math.random() * 4;
    positions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    );
  }

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={new Float32Array(positions)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.015}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </points>
  );
}
