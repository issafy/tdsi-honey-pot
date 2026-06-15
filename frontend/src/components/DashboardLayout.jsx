import GlobeContainer from './GlobeContainer';
import TopBar from './panels/TopBar';
import LeftSidebar from './panels/LeftSidebar';
import BottomBar from './panels/BottomBar';
import AttackDetailCard from './panels/AttackDetailCard';
import useStore from '../store';

/**
 * Main dashboard layout.
 * Globe fills the entire viewport, panels are overlaid on top.
 */
export default function DashboardLayout() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-cyber-dark">
      {/* 3D Globe — full viewport background */}
      <GlobeContainer />

      {/* Overlaid panels */}
      <TopBar />
      <LeftSidebar />
      <BottomBar />
      <AttackDetailCard />

      {/* Error banner */}
      <ErrorBanner />
    </div>
  );
}

function ErrorBanner() {
  const error = useStore((s) => s.error);
  if (!error) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-red-900/80 border border-red-500/50 rounded-lg text-xs font-mono text-red-200 backdrop-blur-sm">
      ⚠ {error} —{' '}
      <button
        onClick={() => window.location.reload()}
        className="underline hover:text-white"
      >
        Retry
      </button>
    </div>
  );
}
