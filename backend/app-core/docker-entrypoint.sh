#!/bin/sh
set -e

# Ensure the uploads directory is writable by the node user
if [ -d "/usr/src/app/uploads" ]; then
  chown -R node:node /usr/src/app/uploads
fi

exec su-exec node "$@"
