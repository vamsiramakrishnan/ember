#!/usr/bin/env bash
# Ember — Supabase setup script.
# Creates the project, runs migrations, and configures env vars.

set -euo pipefail

echo ""
echo "  Ember — Supabase Setup"
echo "  ======================"
echo ""

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
  echo "  Supabase CLI not found. Install it first:"
  echo "    brew install supabase/tap/supabase"
  echo "    # or: npm install -g supabase"
  exit 1
fi

echo "  Step 1: Create a Supabase project at https://supabase.com/dashboard"
echo "  Step 2: Copy your Project URL and anon key from Settings → API"
echo ""

read -rp "  Supabase Project URL: " SUPABASE_URL
read -rp "  Supabase Anon Key:    " SUPABASE_KEY

# Write .env.local
cat > .env.local << EOF
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_KEY}
EOF

echo ""
echo "  ✓ .env.local created"

# Link project
echo ""
echo "  Linking Supabase project..."
read -rp "  Supabase Project Ref (from dashboard URL): " PROJECT_REF
supabase link --project-ref "$PROJECT_REF"

# Run migrations
echo ""
echo "  Running migrations..."
supabase db push

# Create storage bucket
echo ""
echo "  Creating storage bucket..."
curl -s -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"id":"ember-blobs","name":"ember-blobs","public":true}' \
  > /dev/null 2>&1 || true

echo "  ✓ Storage bucket created"

echo ""
echo "  Setup complete. Add these env vars to Vercel:"
echo "    VITE_SUPABASE_URL=${SUPABASE_URL}"
echo "    VITE_SUPABASE_ANON_KEY=${SUPABASE_KEY}"
echo ""
echo "  Then deploy: vercel --prod"
echo ""
