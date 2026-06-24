import { getAttackColor, getSeverityColor } from '../../utils/colors';

export function AttackBadge({ type }) {
  const color = getAttackColor(type);
  const label = String(type).replace(/_/g, ' ');
  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full border"
      style={{ color, borderColor: color, background: `${color}15` }}
    >
      {label}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const color = getSeverityColor(severity);
  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full border"
      style={{ color, borderColor: color, background: `${color}15` }}
    >
      {severity}
    </span>
  );
}

/**
 * Convert an ISO2 country code to a flag emoji.
 * e.g. "US" → 🇺🇸, "FR" → 🇫🇷
 */
function isoToFlag(iso) {
  if (!iso || iso.length !== 2) return '';
  const base = 0x1f1e6;
  const a = iso.charCodeAt(0) - 65;
  const b = iso.charCodeAt(1) - 65;
  return String.fromCodePoint(base + a, base + b);
}

export function CountryBadge({ country, iso, ip }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-300">
      <span className="text-sm leading-none">{isoToFlag(iso)}</span>
      <span>{country}</span>
      <span className="text-gray-500 text-[10px]">{ip}</span>
    </span>
  );
}
