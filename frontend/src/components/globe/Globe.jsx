import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { createLogger } from '../../utils/logger';

const log = createLogger('globe');

/**
 * Static Earth sphere with day + night textures.
 * - map: Blue Marble (day side)
 * - emissiveMap: city lights (visible on dark side)
 * Rotation is handled by OrbitControls orbiting the camera.
 */
export default function Globe() {
  const [dayMap, nightMap] = useLoader(TextureLoader, [
    '/textures/earth-blue-marble.jpg',
    '/textures/earth-night.jpg',
  ], undefined, (err) => {
    log.warn('Texture load failed, using fallback', err?.message);
  });

  const hasTextures = dayMap && nightMap;

  return (
    <mesh>
      <sphereGeometry args={[1.0, 128, 128]} />
      <meshPhongMaterial
        map={hasTextures ? dayMap : null}
        emissiveMap={hasTextures ? nightMap : null}
        emissive={hasTextures ? '#888888' : '#0a1a2e'}
        emissiveIntensity={hasTextures ? 0.55 : 1}
        specular={0x111111}
        shininess={5}
        color={hasTextures ? '#ffffff' : '#1a3a5c'}
      />
    </mesh>
  );
}
