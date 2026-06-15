import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

// Custom shader material for atmospheric glow (Fresnel effect)
const AtmosphereMaterial = shaderMaterial(
  {
    glowColor: new THREE.Color('#00d4ff'),
    intensity: 0.6,
    time: 0,
  },
  // Vertex shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vPosition = worldPos.xyz;
      vNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  // Fragment shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 glowColor;
    uniform float intensity;
    uniform float time;
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float rim = 1.0 - abs(dot(viewDir, vNormal));
      rim = pow(rim, 3.5);
      float alpha = rim * intensity * (0.8 + 0.2 * sin(time * 0.5));
      gl_FragColor = vec4(glowColor, alpha);
    }
  `,
);

// Register with R3F so it can be used as <atmosphereMaterial />
extend({ AtmosphereMaterial });

export default function Atmosphere({ radius = 1.0 }) {
  const materialRef = useRef();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[radius * 1.06, 64, 64]} />
      <atmosphereMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
