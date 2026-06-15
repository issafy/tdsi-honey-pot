import * as THREE from 'three';

/**
 * Convert latitude/longitude (degrees) to a 3D point on a sphere.
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {number} radius - Sphere radius
 * @returns {THREE.Vector3}
 */
export function latLonToVec3(lat, lon, radius = 1) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/**
 * Convert a 3D point on a sphere back to latitude/longitude.
 * @param {THREE.Vector3} point
 * @returns {{ lat: number, lon: number }}
 */
export function vec3ToLatLon(point) {
  const normalized = point.clone().normalize();
  const lat = 90 - THREE.MathUtils.radToDeg(Math.acos(normalized.y));
  const lon = THREE.MathUtils.radToDeg(Math.atan2(normalized.z, -normalized.x));
  return { lat, lon };
}
