import { useEffect, useRef } from 'react';
import { fetchStats } from '../../api/attacks';
import useStore from '../../store';

export default function TopBar() {
  const stats = useStore((s) => s.stats);
  const setStats = useStore((s) => s.setStats);
  const connected = useStore((s) => s.connected);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    fetchStats()
      .then(setStats)
      .catch(() => {});

    // Poll every 5s
    intervalRef.current = setInterval(() => {
      fetchStats()
        .then(setStats)
        .catch(() => {});
    }, 5000);

    return () => clearInterval(intervalRef.current);
  }, [setStats]);

  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-3 bg-gray-950/70 backdrop-blur-sm border-b border-gray-800/50">
      {/* Logo / Title */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🍯</span>
        <h1 className="text-lg font-bold font-mono tracking-wider text-white">
          HONEYPOT
        </h1>
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          Threat Intel
        </span>
      </div>

      {/* Live Stats */}
      <div className="flex items-center gap-8">
        <Stat label="Total Attacks" value={stats.totalAttacks.toLocaleString()} />
        <Stat label="Active Sources" value={stats.activeSources} />
        <Stat label="Last Hour" value={stats.attacksLastHour} />
        <Stat label="/min" value={stats.attacksPerMinute} />

        {/* Connection indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-[10px] font-mono text-gray-500 uppercase">
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-lg font-mono font-bold text-cyber-blue tabular-nums">
        {value}
      </div>
    </div>
  );
}
