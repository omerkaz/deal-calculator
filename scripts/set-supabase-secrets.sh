#!/bin/bash
# Set required Supabase secrets for the manychat-webhook Edge Function.
# Run this once after `supabase login` and `supabase link --project-ref hbhepcucokwlagqygwrz`.
#
# Usage:
#   WEBHOOK_SECRET=<your-secret> PRACTITIONER_USER_ID=<uuid> ./scripts/set-supabase-secrets.sh
#
# Or interactive:
#   ./scripts/set-supabase-secrets.sh

set -e

PROJECT_REF="hbhepcucokwlagqygwrz"

if [ -z "$WEBHOOK_SECRET" ]; then
  read -rsp "Enter WEBHOOK_SECRET (shared secret for ManyChat auth): " WEBHOOK_SECRET
  echo
fi

if [ -z "$PRACTITIONER_USER_ID" ]; then
  read -rsp "Enter PRACTITIONER_USER_ID (Huseyin's auth.users UUID from Supabase dashboard): " PRACTITIONER_USER_ID
  echo
fi

echo "Setting secrets on project $PROJECT_REF..."
supabase secrets set WEBHOOK_SECRET="$WEBHOOK_SECRET" PRACTITIONER_USER_ID="$PRACTITIONER_USER_ID" \
  --project-ref "$PROJECT_REF"

echo "Done. Verifying function is reachable..."
curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  "https://$PROJECT_REF.supabase.co/functions/v1/manychat-webhook" \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"id":"deploy-verify-001","first_name":"Deploy","last_name":"Test"}' 2>&1

echo ""
echo "Expected: HTTP_STATUS:201 (new patient created) or HTTP_STATUS:200 (duplicate upsert)."
echo "If you see 500, check that PRACTITIONER_USER_ID is a valid UUID from auth.users."
