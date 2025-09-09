FROM ubuntu/squid:latest

# Copy your custom configuration
COPY squid.conf /etc/squid/squid.conf
COPY passwd /etc/squid/passwd

# Set proper permissions
RUN chown proxy:proxy /etc/squid/passwd && \
    chmod 640 /etc/squid/passwd && \
    mkdir -p /var/spool/squid && \
    chown -R proxy:proxy /var/spool/squid /var/log/squid

# Initialize cache (this might already be done in base image)
RUN squid -z -N || true