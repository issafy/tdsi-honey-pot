#!/usr/bin/env bash
# -------------------------------------------------------------------
# Honeypot Firewall — whitelist a single IP, block everyone else.
#
# Usage:  sudo ./firewall-up.sh <your-public-ip>
#
# This script:
#   1. Uses DOCKER-USER chain (applies BEFORE Docker's own rules)
#   2. Blocks ALL inbound traffic to honeypot ports (22, 80, 2222, 8080)
#   3. Whitelists YOUR IP so only you can reach them
#   4. Dashboard ports (3001, 5173) are NOT restricted
#   5. Works regardless of Docker networking mode (bridge/host)
#
# Why DOCKER-USER and not INPUT:
#   Docker's -p flag uses DNAT → FORWARD, which skips INPUT entirely.
#   DOCKER-USER is inserted before Docker's own DOCKER chain in FORWARD,
#   so our DROP rules take priority.
#
# Run firewall-down.sh to remove.
# -------------------------------------------------------------------
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: sudo $0 <your-public-ip>"
  echo "  Find your IP: curl -s ifconfig.me"
  exit 1
fi

TRUSTED_IP="$1"
CHAIN="DOCKER-USER"

# Validate IP
if ! echo "$TRUSTED_IP" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Error: '$TRUSTED_IP' doesn't look like a valid IPv4 address"
  exit 1
fi

echo "=== Honeypot Firewall ==="
echo "Trusted IP:  $TRUSTED_IP"
echo "Blocked:     everyone else (Docker-published ports)"
echo ""

# ---- Ensure DOCKER-USER chain exists (Docker creates it, but be safe) ----
iptables -N "$CHAIN" 2>/dev/null || true

# ---- Flush existing rules in DOCKER-USER (idempotent re-run) ----
iptables -F "$CHAIN"

# ---- Rules (order matters — first match wins) ----

# 1. Allow established/related connections (responses to outbound traffic)
iptables -A "$CHAIN" -m state --state ESTABLISHED,RELATED -j RETURN

# 2. Allow Docker inter-container communication
iptables -A "$CHAIN" -s 172.16.0.0/12 -j RETURN
iptables -A "$CHAIN" -s 10.0.0.0/8 -j RETURN
iptables -A "$CHAIN" -s 192.168.0.0/16 -j RETURN

# 3. Allow localhost
iptables -A "$CHAIN" -s 127.0.0.0/8 -j RETURN

# 4. Allow the trusted IP
iptables -A "$CHAIN" -s "$TRUSTED_IP" -j RETURN

# 5. Allow traffic to non-honeypot ports (dashboard, etc.) to pass through
iptables -A "$CHAIN" -p tcp ! --dport 22 ! --dport 80 ! --dport 2222 ! --dport 8080 -j RETURN

# 6. EVERYTHING ELSE to honeypot ports: DROP
iptables -A "$CHAIN" -j DROP

# ---- Also protect INPUT chain (defense in depth — catches host-network mode) ----
INPUT_CHAIN="HONEYPOT-INPUT"
iptables -N "$INPUT_CHAIN" 2>/dev/null || iptables -F "$INPUT_CHAIN"

iptables -A "$INPUT_CHAIN" -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A "$INPUT_CHAIN" -s 127.0.0.0/8 -j ACCEPT
iptables -A "$INPUT_CHAIN" -s "$TRUSTED_IP" -j ACCEPT
iptables -A "$INPUT_CHAIN" -j DROP

for PORT in 22 80 2222 8080; do
  if ! iptables -C INPUT -p tcp --dport "$PORT" -j "$INPUT_CHAIN" 2>/dev/null; then
    iptables -I INPUT 1 -p tcp --dport "$PORT" -j "$INPUT_CHAIN"
  fi
done

# ---- Persist ----
if command -v iptables-save &>/dev/null; then
  if [ -d /etc/iptables ]; then
    iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
  elif command -v netfilter-persistent &>/dev/null; then
    netfilter-persistent save 2>/dev/null || true
  fi
fi

echo "✓ Firewall active. Only $TRUSTED_IP can reach the honeypots."
echo ""
echo "Ports blocked for everyone else:"
echo "  22    — Cowrie SSH"
echo "  80    — Web honeypot"
echo "  2222  — Cowrie SSH (high port)"
echo "  8080  — Web honeypot (high port)"
echo ""
echo "Dashboard ports (3001, 5173) are NOT restricted."
echo ""
echo "Verify:  curl -s --connect-timeout 3 http://<vps>:80  # from another IP → timeout"
echo "Remove:  sudo ./scripts/firewall-down.sh"
