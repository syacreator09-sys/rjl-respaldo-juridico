#!/bin/bash
# Fix missing GoTrue boolean env vars
cat >> /opt/supabase-rjl/.env << 'ENVEOF'
DISABLE_SIGNUP=false
GOTRUE_DISABLE_SIGNUP=false
ENABLE_SIGNUP=true
SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION=false
RATE_LIMIT_ENABLED=false
DOUBLE_CONFIRM_CHANGES=true
MAILER_SECURE_EMAIL_CHANGE_ENABLED=true
ENVEOF

echo "Env updated"

# Fix pooler port conflict (127.0.0.1:5432 already used by ORION postgres)
sed -i 's|127.0.0.1:5432|127.0.0.2:5433|g' /opt/supabase-rjl/docker-compose.yml
echo "Port fixed"

# Full restart
cd /opt/supabase-rjl
docker compose --env-file .env up -d --force-recreate 2>&1 | tail -25

sleep 18

echo "=== FINAL STATUS ==="
docker ps --filter name=supa-rjl --format "table {{.Names}}\t{{.Status}}"

echo "=== AUTH LOG ==="
docker logs supa-rjl-auth --tail 5 2>&1

echo "=== KONG TEST ==="
curl -s --max-time 5 http://localhost:54341/rest/v1/ 2>&1 | head -2
