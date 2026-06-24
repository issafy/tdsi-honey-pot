FROM cowrie/cowrie:latest

# Cowrie SSH/Telnet honeypot
# Base image entrypoint: python3
# Base image cmd: twistd -n --umask=0022 --pidfile= cowrie
# (twistd reads cowrie.tac from the working dir /cowrie/cowrie-git)
#
# Configuration is mounted at runtime via docker-compose volume
# Logs are written to /cowrie/cowrie-git/var/log/cowrie/

EXPOSE 2222 2223
