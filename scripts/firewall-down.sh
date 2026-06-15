#!/usr/bin/env bash
# -------------------------------------------------------------------
# Remove honeypot firewall rules.
# Usage:  sudo ./firewall-down.sh
# -------------------------------------------------------------------
set -euo pipefail

echo "=== Removing Honeypot Firewall ==="

# ---- DOCKER-USER chain ----
echo "Clearing DOCKER-USER chain..."
iptables -F DOCKER-USER 2>/dev/null || true

# ---- INPUT chain ----
INPUT_CHAIN="HONEYPOT-INPUT"
for PORT in 22 80 2222 8080; do
  if iptables -C INPUT -p tcp --dport "$PORT" -j "$INPUT_CHAIN" 2>/dev/null; then
    iptables -D INPUT -p tcp --dport "$PORT" -j "$INPUT_CHAIN"
    echo "Removed: INPUT port $PORT → $INPUT_CHAIN"
  fi
done
iptables -F "$INPUT_CHAIN" 2>/dev/null || true
iptables -X "$INPUT_CHAIN" 2>/dev/null || true

# ---- Persist ----
if command -v iptables-save &>/dev/null; then
  if [ -d /etc/iptables ]; then
    iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
  elif command -v netfilter-persistent &>/dev/null; then
    netfilter-persistent save 2>/dev/null || true
  fi
fi

echo ""
echo "✓ Firewall removed. All honeypot ports are open again."
echo ""
echo "Verify:"
echo "  iptables -L DOCKER-USER -n -v   # should show empty or default rules"
echo "  iptables -L INPUT -n -v | grep HONEYPOT   # should show nothing"
