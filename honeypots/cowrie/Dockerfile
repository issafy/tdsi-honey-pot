FROM cowrie/cowrie:latest

# Cowrie SSH/Telnet honeypot
# Configuration is mounted at runtime via docker-compose volume
# Logs are written to /cowrie/cowrie-git/var/log/cowrie/

EXPOSE 2222 2223

CMD ["cowrie", "start", "-n"]
