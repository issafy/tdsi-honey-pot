import { useEffect, useState } from 'react';
import useStore from '../store';
import { getAttackColor } from '../utils/colors';

// Simplified flat world map background (CSS-only, no WebGL needed)
// Renders attack arcs as angled lines on a 2D plane

const MAP_WIDTH = 800;
const MAP_HEIGHT = 400;

function projectPoint(lat, lon) {
  // Mercator-ish projection for 2D map
  const x = ((lon + 180) / 360) * MAP_WIDTH;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = MAP_HEIGHT / 2 - (mercN / Math.PI) * (MAP_HEIGHT / 2);
  return { x: Math.max(0, Math.min(MAP_WIDTH, x)), y: Math.max(0, Math.min(MAP_HEIGHT, y)) };
}

export default function FlatGlobe() {
  const attacks = useStore((s) => s.attacks);
  const [arcs, setArcs] = useState([]);

  useEffect(() => {
    if (attacks.length === 0) return;
    const visible = attacks.slice(-20).map((a) => ({
      id: a.id,
      src: projectPoint(a.sourceLat, a.sourceLon),
      dst: projectPoint(a.destLat, a.destLon),
      color: getAttackColor(a.attackType),
      srcCountry: a.sourceCountryName,
    }));
    setArcs(visible);
  }, [attacks]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-950/50">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full max-w-3xl opacity-60"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Stylized grid lines */}
        {[0, 60, 120, 180, 240, 300, 360, 420].map((y) => (
          <line key={`h-${y}`} x1={0} y1={y} x2={MAP_WIDTH} y2={y} stroke="#1e293b" strokeWidth={0.5} />
        ))}
        {[...Array(19)].map((_, i) => (
          <line
            key={`v-${i}`}
            x1={(i + 1) * (MAP_WIDTH / 18)}
            y1={0}
            x2={(i + 1) * (MAP_WIDTH / 18)}
            y2={MAP_HEIGHT}
            stroke="#1e293b"
            strokeWidth={0.5}
          />
        ))}

        {/* World outline (simplified continent shapes as ellipses) */}
        {/* North America */}
        <ellipse cx={170} cy={130} rx={110} ry={80} fill="none" stroke="#1e3a5c" strokeWidth={1.5} />
        {/* South America */}
        <ellipse cx={190} cy={280} rx={40} ry={60} fill="none" stroke="#1e3a5c" strokeWidth={1.5} />
        {/* Europe */}
        <ellipse cx={410} cy={100} rx={55} ry={45} fill="none" stroke="#1e3a5c" strokeWidth={1.5} />
        {/* Africa */}
        <ellipse cx={420} cy={230} rx={50} ry={95} fill="none" stroke="#1e3a5c" strokeWidth={1.5} />
        {/* Asia */}
        <ellipse cx={550} cy={120} rx={130} ry={80} fill="none" stroke="#1e3a5c" strokeWidth={1.5} />
        {/* Australia */}
        <ellipse cx={620} cy={300} rx={30} ry={20} fill="none" stroke="#1e3a5c" strokeWidth={1.5} />

        {/* Attack arcs */}
        {arcs.map((arc) => (
          <g key={arc.id}>
            {/* Arc line */}
            <line
              x1={arc.src.x}
              y1={arc.src.y}
              x2={arc.dst.x}
              y2={arc.dst.y}
              stroke={arc.color}
              strokeWidth={1.5}
              strokeOpacity={0.7}
              strokeDasharray="4 6"
            >
              <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
            </line>
            {/* Source dot */}
            <circle cx={arc.src.x} cy={arc.src.y} r={3} fill={arc.color} opacity={0.8}>
              <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* Target dot (Paris) */}
            <circle cx={arc.dst.x} cy={arc.dst.y} r={4} fill="#00d4ff" opacity={0.8}>
              <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>

      {/* Overlay: warning banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-900/60 border border-yellow-500/40 text-yellow-200 text-xs font-mono px-4 py-2 rounded-lg backdrop-blur-sm">
        ⚠ WebGL unavailable — showing 2D fallback
      </div>
    </div>
  );
}
