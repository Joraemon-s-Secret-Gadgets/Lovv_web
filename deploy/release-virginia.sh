#!/usr/bin/env bash
#
# release-virginia.sh
# -----------------------------------------------------------------------------
# Builds the frontend pointing at N. Virginia CloudFront and publishes it:
#   - vite build
#   - aws s3 sync  (hashed assets: 1y immutable; index.html: no-cache)
#   - CloudFront invalidation of /*
#
# Bucket: lovv-frontend-dev
# Distribution ID: EQU884YW856EG
# Domain: d3nuef0zacpyj.cloudfront.net
# -----------------------------------------------------------------------------
set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-default}"
export AWS_PROFILE

HERE="$(cd "$(dirname "$0")" && pwd)"
FE_ROOT="$(cd "$HERE/.." && pwd)"
APP_DIR="$FE_ROOT/frontend"
ENV_FILE="$APP_DIR/.env.production.local"

VIRGINIA_BUCKET="lovv-frontend-dev"
VIRGINIA_DISTRIBUTION_ID="EQU884YW856EG"
VIRGINIA_CF_DOMAIN="d3nuef0zacpyj.cloudfront.net"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

# ---- 1. Verify environment variables file exists ----------------------------
if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found (needed for Maps key + Cognito config)" >&2
  exit 1
fi

# ---- 2. Build ----------------------------------------------------------------
say "Building frontend (npm run build) for us-east-1"
npm --prefix "$APP_DIR" run build

DIST="$APP_DIR/dist"
[ -f "$DIST/index.html" ] || { echo "build produced no dist/index.html" >&2; exit 1; }

# ---- 3. Upload ---------------------------------------------------------------
say "Syncing hashed assets (immutable, 1y) to s3://$VIRGINIA_BUCKET"
aws s3 sync "$DIST" "s3://$VIRGINIA_BUCKET/" \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"

say "Uploading index.html (no-cache)"
aws s3 cp "$DIST/index.html" "s3://$VIRGINIA_BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

# ---- 4. Invalidate -----------------------------------------------------------
say "Invalidating CloudFront $VIRGINIA_DISTRIBUTION_ID"
aws cloudfront create-invalidation \
  --distribution-id "$VIRGINIA_DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' --output text

say "Released to https://$VIRGINIA_CF_DOMAIN"
