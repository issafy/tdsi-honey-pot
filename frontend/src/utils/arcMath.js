import * as THREE from 'three';
import { latLonToVec3 } from './geoUtils';

/**
 * Generate an elevated Bezier arc curve between two points on a sphere.
 * The arc rises above the surface proportionally to the distance between points.
 *
 * @param {THREE.Vector3} start - Start point on sphere surface
 * @param {THREE.Vector3} end - End point on sphere surface
 * @param {number} radius - Sphere radius
 * @returns {{ points: THREE.Vector3[], curve: THREE.QuadraticBezierCurve3 }}
 */
export function createArcCurve(start, end, radius = 1) {
  const startN = start.clone().normalize();
  const endN = end.clone().normalize();

  // Midpoint direction (bisector of the angle)
  const midDir = startN.clone().add(endN).normalize();

  // Angular distance between start and end
  const dot = THREE.MathUtils.clamp(startN.dot(endN), -1, 1);
  const angle = Math.acos(dot);

  // Arc height: taller for longer distances, with a minimum
  const heightFactor = 0.25 + angle * 0.45;

  // Control point elevated above the surface
  const cp = midDir.clone().multiplyScalar(radius * (1 + heightFactor));

  // Create quadratic Bezier curve
  const curve = new THREE.QuadraticBezierCurve3(start.clone(), cp, end.clone());

  // Sample points along the curve for line rendering
  const numSegments = 64;
  const points = curve.getPoints(numSegments);

  return { points, curve };
}

/**
 * Create an arc from lat/lon coordinates.
 */
export function createArcFromCoords(srcLat, srcLon, dstLat, dstLon, radius = 1) {
  const start = latLonToVec3(srcLat, srcLon, radius);
  const end = latLonToVec3(dstLat, dstLon, radius);
  return createArcCurve(start, end, radius);
}

/**
 * Get a point along an arc curve at parameter t.
 * @param {THREE.QuadraticBezierCurve3} curve
 * @param {number} t - Parameter 0..1
 * @returns {THREE.Vector3}
 */
export function sampleArc(curve, t) {
  return curve.getPoint(THREE.MathUtils.clamp(t, 0, 1));
}
