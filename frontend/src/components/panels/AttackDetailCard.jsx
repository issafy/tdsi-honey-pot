import useStore from '../../store';
import { AttackBadge, SeverityBadge } from '../ui/Badge';
import Card from '../ui/Card';

export default function AttackDetailCard() {
  const attack = useStore((s) => s.selectedAttack);
  const clearSelection = useStore((s) => s.clearSelection);

  if (!attack) return null;

  const formatTime = (ts) => {
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="absolute right-6 top-24 z-20 w-72 animate-in slide-in-from-right">
      <Card className="p-4 border-cyber-blue/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono font-bold text-white">
            Attack Details
          </h3>
          <button
            onClick={clearSelection}
            className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Info rows */}
        <div className="space-y-2 text-xs font-mono">
          <Row label="Source IP" value={attack.sourceIp} />
          <Row label="Country" value={attack.sourceCountryName} />
          <Row label="Type">
            <AttackBadge type={attack.attackType} />
          </Row>
          <Row label="Protocol" value={attack.protocol} />
          <Row label="Port" value={attack.port} />
          <Row label="Severity">
            <SeverityBadge severity={attack.severity} />
          </Row>
          <Row label="Time" value={formatTime(attack.timestamp)} />
        </div>

        {/* Source coordinates */}
        <div className="mt-3 pt-3 border-t border-gray-700/30">
          <div className="text-[10px] font-mono text-gray-500">
            Source: {attack.sourceLat.toFixed(2)}°, {attack.sourceLon.toFixed(2)}°
          </div>
          <div className="text-[10px] font-mono text-gray-500">
            Target: {attack.destLat.toFixed(2)}°, {attack.destLon.toFixed(2)}°
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, children }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      {children || <span className="text-gray-200">{value}</span>}
    </div>
  );
}
