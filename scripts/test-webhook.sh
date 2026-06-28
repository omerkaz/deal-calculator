#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# test-webhook.sh — Test the ManyChat webhook Edge Function
#
# Sends realistic ManyChat "Full Contact Data" payloads to the manychat-webhook
# Supabase Edge Function and prints the HTTP status + response body.
#
# Usage:
#   ./scripts/test-webhook.sh                          # Uses defaults
#   WEBHOOK_URL=https://my.supabase.co/functions/v1/manychat-webhook \
#   WEBHOOK_SECRET=my-prod-secret \
#   ./scripts/test-webhook.sh
#
# Prerequisites:
#   - curl installed
#   - Supabase local dev running (npx supabase start) if using default URL
#   - WEBHOOK_SECRET env var set in the Edge Function runtime
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configurable variables ──
WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:54321/functions/v1/manychat-webhook}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-test-secret-change-me}"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

# ── Helper: run a test case ──
run_test() {
  local label="$1"
  local expected_status="$2"
  local auth_header="$3"
  local payload="$4"

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${YELLOW}TEST: ${label}${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  local http_code
  local response_body

  response_body=$(curl -s -w "\n%{http_code}" \
    -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: $auth_header" \
    -d "$payload" 2>&1) || true

  # Last line is the HTTP status code
  http_code=$(echo "$response_body" | tail -1)
  response_body=$(echo "$response_body" | sed '$d')

  echo "  Status:   $http_code"
  echo "  Expected: $expected_status"
  echo "  Body:     $response_body"

  if [ "$http_code" = "$expected_status" ]; then
    echo -e "  Result:   ${GREEN}✅ PASS${NC}"
    ((pass_count++)) || true
  else
    echo -e "  Result:   ${RED}❌ FAIL (expected $expected_status, got $http_code)${NC}"
    ((fail_count++)) || true
  fi
}

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        ManyChat Webhook Integration Test Suite              ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  URL:    $WEBHOOK_URL"
echo "║  Secret: ${WEBHOOK_SECRET:0:4}****"
echo "╚══════════════════════════════════════════════════════════════╝"

# ── Test 1: Full Contact Data payload (new patient) ──
run_test \
  "1. Full Contact Data — Create new Lead patient" \
  "201" \
  "Bearer $WEBHOOK_SECRET" \
  '{
    "id": 12345678,
    "key": "mc_key_abc123",
    "page_id": 98765,
    "status": "active",
    "first_name": "Test",
    "last_name": "Subscriber",
    "name": "Test Subscriber",
    "gender": "male",
    "profile_pic": "https://example.com/pic.jpg",
    "locale": "en_US",
    "language": "en",
    "timezone": "3",
    "live_chat_url": "https://manychat.com/live/12345678",
    "last_input_text": "hair transplant info",
    "optin_phone": true,
    "phone": "+905551234567",
    "optin_email": true,
    "email": "test@example.com",
    "subscribed": "2024-01-15T10:30:00Z",
    "last_interaction": "2024-06-27T14:00:00Z",
    "last_seen": "2024-06-27T14:00:00Z",
    "is_followup_enabled": true,
    "ig_username": "test_subscriber_ig",
    "ig_id": 444555666,
    "whats_app_phone": "+905551234567",
    "optin_whats_app_phone": true,
    "custom_fields": {}
  }'

# ── Test 2: Duplicate payload (upsert — same manychat id) ──
run_test \
  "2. Duplicate payload — Idempotent upsert (same id=12345678)" \
  "200" \
  "Bearer $WEBHOOK_SECRET" \
  '{
    "id": 12345678,
    "first_name": "Test",
    "last_name": "Subscriber Updated",
    "phone": "+905559999999",
    "email": "updated@example.com",
    "ig_username": "test_subscriber_ig_v2"
  }'

# ── Test 3: Wrong secret (auth failure) ──
run_test \
  "3. Wrong secret — Should return 401 Unauthorized" \
  "401" \
  "Bearer wrong-secret-value" \
  '{
    "id": 99999999,
    "first_name": "Hacker",
    "last_name": "Attempt"
  }'

# ── Test 4: Missing secret (no auth header) ──
run_test \
  "4. Missing auth — Should return 401 Unauthorized" \
  "401" \
  "" \
  '{
    "id": 88888888,
    "first_name": "NoAuth",
    "last_name": "Test"
  }'

# ── Test 5: Minimal payload (only id and first_name) ──
run_test \
  "5. Minimal payload — Defaults applied (last_name=Lead, phone=unknown, language=tr)" \
  "201" \
  "Bearer $WEBHOOK_SECRET" \
  '{
    "id": 55555555,
    "first_name": "MinimalTest"
  }'

# ── Test 6: Missing id field (validation error) ──
run_test \
  "6. Missing id field — Should return 400 Bad Request" \
  "400" \
  "Bearer $WEBHOOK_SECRET" \
  '{
    "first_name": "NoId",
    "last_name": "ShouldFail"
  }'

# ── Summary ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Results: ${GREEN}${pass_count} passed${NC}, ${RED}${fail_count} failed${NC} out of $((pass_count + fail_count)) tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$fail_count" -gt 0 ]; then
  exit 1
fi
