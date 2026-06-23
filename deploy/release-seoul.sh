#!/usr/bin/env bash
#
# release-seoul.sh
# -----------------------------------------------------------------------------
# Builds the frontend pointing Cognito redirect/logout at the new Seoul domain
# (API base URL stays on the existing US backend) and publishes it:
#   - vite build
#   - aws s3 sync  (hashed assets: 1y immutable; index.html: no-cache)
#   - CloudFront invalidation of /*
#
# Reads deploy/.seoul-cdn.env (written by provision-seoul-cdn.sh /
# configure-new-domain.sh): SEOUL_BUCKET, SEOUL_DISTRIBUTION_ID, SEOUL_CF_DOMAIN
#
# Re-run this any time you want to ship a new frontend build to Seoul.
# -----------------------------------------------------------------------------
set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-default}"
export AWS_PROFILE

HERE="$(cd "$(dirname "$0")" && pwd)"
FE_ROOT="$(cd "$HERE/.." && pwd)"
APP_DIR="$FE_ROOT/frontend"
ENV_FILE="$APP_DIR/.env.production.local"

# shellcheck disable=SC1091
[ -f "$HERE/.seoul-cdn.env" ] && source "$HERE/.seoul-cdn.env"
: "${SEOUL_BUCKET:?set SEOUL_BUCKET or run provision-seoul-cdn.sh first}"
: "${SEOUL_DISTRIBUTION_ID:?set SEOUL_DISTRIBUTION_ID or run provision-seoul-cdn.sh first}"
: "${SEOUL_CF_DOMAIN:?set SEOUL_CF_DOMAIN or run configure-new-domain.sh first}"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

# ---- 1. Point Cognito redirect/logout at the Seoul domain (temporary) --------
if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found (needed for Maps key + Cognito config)" >&2
  exit 1
fi
cp "$ENV_FILE" "$ENV_FILE.release-bak"
restore() { mv -f "$ENV_FILE.release-bak" "$ENV_FILE"; }
trap restore EXIT

python3 - "$ENV_FILE" "$SEOUL_CF_DOMAIN" <<'PY'
import sys
path, domain = sys.argv[1], sys.argv[2]
redirect = f"https://{domain}/auth/callback/cognito"
logout   = f"https://{domain}/"
overrides = {"VITE_COGNITO_REDIRECT_URI": redirect, "VITE_COGNITO_LOGOUT_URI": logout}
seen = set()
out = []
for line in open(path):
    k = line.split("=", 1)[0].strip()
    if k in overrides:
        out.append(f"{k}={overrides[k]}\n"); seen.add(k)
    else:
        out.append(line)
for k, v in overrides.items():
    if k not in seen:
        out.append(f"{k}={v}\n")
open(path, "w").writelines(out)
print("seoul redirect:", redirect)
PY

# ---- 2. Build ----------------------------------------------------------------
say "Building frontend (npm run build)"
npm --prefix "$APP_DIR" run build

DIST="$APP_DIR/dist"
[ -f "$DIST/index.html" ] || { echo "build produced no dist/index.html" >&2; exit 1; }

# ---- 3. Upload ---------------------------------------------------------------
say "Syncing hashed assets (immutable, 1y) to s3://$SEOUL_BUCKET"
aws s3 sync "$DIST" "s3://$SEOUL_BUCKET/" \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"

say "Uploading index.html (no-cache)"
aws s3 cp "$DIST/index.html" "s3://$SEOUL_BUCKET/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"

# ---- 4. Invalidate -----------------------------------------------------------
say "Invalidating CloudFront $SEOUL_DISTRIBUTION_ID"
aws cloudfront create-invalidation \
  --distribution-id "$SEOUL_DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' --output text

say "Released to https://$SEOUL_CF_DOMAIN"
