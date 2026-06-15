import { useEffect, useRef } from 'react';
import useStore from '../../store';
import { AttackBadge, SeverityBadge, CountryBadge } from '../ui/Badge';

export default function LeftSidebar() {
  const recentAttacks = useStore((s) => s.recentAttacks);
  const selectedAttack = useStore((s) => s.selectedAttack);
  const selectAttack = useStore((s) => s.selectAttack);
  const clearSelection = useStore((s) => s.clearSelection);
  const listRef = useRef(null);

  // Auto-scroll to top when new attacks arrive
  useEffect(() => {
    if (listRef.current && recentAttacks.length > 0) {
      // Only scroll if user is near the top
      if (listRef.current.scrollTop < 60) {
        listRef.current.scrollTop = 0;
      }
    }
  }, [recentAttacks.length]);

  const formatTime = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="absolute left-0 top-16 bottom-24 z-10 w-80 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-950/60 backdrop-blur-sm border-b border-gray-800/30">
        <h2 className="text-xs font-mono uppercase tracking-wider text-gray-400">
          Live Attack Feed
        </h2>
      </div>

      {/* Scrollable feed */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto scrollbar-thin"
        style={{ scrollBehavior: 'smooth' }}
      >
        {recentAttacks.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs font-mono">
            Waiting for attacks...
          </div>
        ) : (
          recentAttacks.slice(0, 50).map((attack) => (
            <button
              key={attack.id}
              onClick={() =>
                selectedAttack?.id === attack.id
                  ? clearSelection()
                  : selectAttack(attack)
              }
              className={`w-full text-left px-4 py-3 border-b border-gray-800/20 transition-colors hover:bg-gray-800/30 ${
                selectedAttack?.id === attack.id
                  ? 'bg-gray-800/50 border-l-2 border-l-cyber-blue'
                  : 'border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <CountryBadge country={attack.sourceCountryName} iso={attack.sourceCountry} ip={attack.sourceIp} />
                <span className="text-[10px] font-mono text-gray-500">
                  {formatTime(attack.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <AttackBadge type={attack.attackType} />
                <SeverityBadge severity={attack.severity} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
