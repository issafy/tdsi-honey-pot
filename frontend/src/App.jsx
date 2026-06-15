import { useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import useWebSocket from './hooks/useWebSocket';
import { fetchAttacks } from './api/attacks';
import useStore from './store';
import { createLogger } from './utils/logger';

const log = createLogger('app');

export default function App() {
  const setAttacks = useStore((s) => s.setAttacks);
  const setRecentAttacks = useStore((s) => s.setRecentAttacks);

  // Connect WebSocket for real-time updates
  useWebSocket();

  // Load initial attack data on mount
  useEffect(() => {
    log.info('Fetching initial attacks...');
    fetchAttacks(100)
      .then(({ data }) => {
        log.info(`Loaded ${data.length} historical attacks`);
        setAttacks(data);
        setRecentAttacks(data);
      })
      .catch((err) => {
        log.error('Failed to load initial attacks', err.message);
      });
  }, [setAttacks, setRecentAttacks]);

  return <DashboardLayout />;
}
