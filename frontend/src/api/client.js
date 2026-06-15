const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchJSON(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
