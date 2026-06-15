import { fetchJSON } from './client';

export async function fetchAttacks(limit = 100) {
  return fetchJSON(`/api/attacks?limit=${limit}`);
}

export async function fetchStats() {
  return fetchJSON('/api/stats');
}
