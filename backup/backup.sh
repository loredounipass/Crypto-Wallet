#!/bin/bash
set -e

BACKUP_DIR="/backups/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# MongoDB backup
echo "[$(date)] Dumping MongoDB..."
mongodump \
    --host mongodb:27017 \
    --username admin \
    --password "$MONGO_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --db brivotrust \
    --out "$BACKUP_DIR/mongodb" \
    --quiet

# Redis backup (trigger SAVE and copy dump)
echo "[$(date)] Saving Redis..."
redis-cli -h redis -a "$REDIS_PASSWORD" SAVE
cp /data/dump.rdb "$BACKUP_DIR/dump.rdb" 2>/dev/null || true

# Keep only last 7 days of backups
find /backups -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

echo "[$(date)] Backup completed: $BACKUP_DIR"
