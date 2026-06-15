import { useMemo } from 'react';
import useStore from '../../store';
import Arc from './Arc';
import ParticleStream from './ParticleStream';
import PulseMarker from './PulseMarker';

/**
 * Manages the lifecycle of all attack arcs.
 * Reads the attack list from the Zustand store and maps to Arc components.
 * Limits visible arcs to prevent performance degradation.
 */
export default function ArcLayer() {
  const attacks = useStore((s) => s.attacks);
  const selectAttack = useStore((s) => s.selectAttack);

  // Keep the most recent attacks visible, with a hard cap
  const visibleAttacks = useMemo(() => {
    // Show most recent 30, but keep them for a few seconds
    return attacks.slice(-30);
  }, [attacks]);

  // Collect unique source countries for pulse markers (deduplicate)
  const pulseMarkers = useMemo(() => {
    const seen = new Set();
    const markers = [];
    // Take the most recent per source country
    for (let i = visibleAttacks.length - 1; i >= 0; i--) {
      const a = visibleAttacks[i];
      const key = `${a.sourceCountry}`;
      if (!seen.has(key)) {
        seen.add(key);
        markers.push(a);
      }
    }
    return markers;
  }, [visibleAttacks]);

  return (
    <group>
      {/* Arcs */}
      {visibleAttacks.map((attack) => (
        <Arc
          key={attack.id}
          attack={attack}
          onClick={() => selectAttack(attack)}
        />
      ))}

      {/* Particle streams along arcs */}
      {visibleAttacks.slice(-15).map((attack) => (
        <ParticleStream key={`ps-${attack.id}`} attack={attack} />
      ))}

      {/* Pulse markers at source countries */}
      {pulseMarkers.slice(0, 10).map((attack) => (
        <PulseMarker
          key={`pm-${attack.id}`}
          lat={attack.sourceLat}
          lon={attack.sourceLon}
          color="#ef4444"
        />
      ))}

      {/* Pulse marker at honeypot target */}
      {pulseMarkers.length > 0 && (
        <PulseMarker
          key="target"
          lat={pulseMarkers[0].destLat}
          lon={pulseMarkers[0].destLon}
          color="#00d4ff"
          size={0.04}
        />
      )}
    </group>
  );
}
