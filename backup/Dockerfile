FROM alpine:3.21

RUN apk upgrade --no-cache && \
    apk add --no-cache mongodb-tools redis bash

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Daily backup at 3:00 AM
RUN echo "0 3 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" > /var/spool/cron/crontabs/root

CMD ["crond", "-f", "-l", "2"]
