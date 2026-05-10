#!/bin/bash
# Check Kong status
echo "=== Services ==="
docker ps --filter name=supa-rjl --filter name=realtime --format "{{.Names}} | {{.Status}}"

# Fix pooler - just remove the port binding entirely (pooler internal use only)
sed -i '/127.0.0.1:5432/d' /opt/supabase-rjl/docker-compose.yml
sed -i '/127.0.0.2:5433/d' /opt/supabase-rjl/docker-compose.yml
echo "Pooler port binding removed"

# Check storage logs
echo "=== Storage log ==="
docker logs supa-rjl-storage --tail 8 2>&1

# Restart pooler without port binding
cd /opt/supabase-rjl
docker compose --env-file .env up -d --force-recreate supavisor 2>&1 | tail -5

sleep 5

# Test Kong
echo "=== Kong API test ==="
curl -s --max-time 5 http://localhost:54341/ 2>&1 | head -5

# Run RJL migrations via psql
echo ""
echo "=== Applying RJL migrations ==="
for mig in /tmp/rjl_mig_*.sql; do
    echo "Running $mig..."
    docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" supa-rjl-db \
        psql -U postgres -d postgres -f "$mig" 2>&1 | grep -v "^$" | tail -3
done

# Verify RJL tables
echo ""
echo "=== RJL tables ==="
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" supa-rjl-db \
    psql -U postgres -d postgres -c "\dt public.*" 2>&1 | grep -E "cases|profiles|evidence|tickets|subscriptions|chat_messages|system_config"
