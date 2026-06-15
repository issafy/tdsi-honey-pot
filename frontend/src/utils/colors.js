// Color mapping for attack types — used for arcs, markers, and badges
export const ATTACK_COLORS = {
  ssh_bruteforce: '#ef4444', // red
  port_scan: '#f59e0b', // amber
  web_exploit: '#a855f7', // purple
  sql_injection: '#ef4444', // red
  credential_stuffing: '#f97316', // orange
  telnet_bruteforce: '#ef4444', // red
  dns_amplification: '#3b82f6', // blue
  ftp_anonymous: '#22c55e', // green
  rdp_bruteforce: '#ef4444', // red
  smb_exploit: '#dc2626', // dark red
};

export const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

/**
 * Get the display color for an attack type.
 * Falls back to cyber blue for unknown types.
 */
export function getAttackColor(attackType) {
  return ATTACK_COLORS[attackType] || '#00d4ff';
}

export function getSeverityColor(severity) {
  return SEVERITY_COLORS[severity] || '#00d4ff';
}
