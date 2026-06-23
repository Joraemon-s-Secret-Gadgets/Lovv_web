#!/usr/bin/env bash
#
# configure-new-domain.sh <https://NEW_CF_DOMAIN>
# -----------------------------------------------------------------------------
# Registers the new Seoul CloudFront domain everywhere the app needs it:
#   - Lovv_BE/parameters/dev.yaml : AllowedCorsOrigin, CognitoCallbackUrls,
#                                   CognitoLogoutUrls   (idempotent append)
# Does NOT deploy anything. After running, redeploy the backend:
#   (cd ../Lovv_BE && sam deploy --config-env default)
#
# The frontend build picks up the domain from deploy/.seoul-cdn.env via
# release-seoul.sh, so no frontend file is edited here.
# -----------------------------------------------------------------------------
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 https://dXXXX.cloudfront.net" >&2
  exit 1
fi

ORIGIN="${1%/}"                      # strip trailing slash
case "$ORIGIN" in
  https://*) : ;;
  *) echo "error: domain must start with https:// (got '$ORIGIN')" >&2; exit 1 ;;
esac

HERE="$(cd "$(dirname "$0")" && pwd)"
FE_ROOT="$(cd "$HERE/.." && pwd)"
BE_DEV_YAML="$(cd "$FE_ROOT/.." && pwd)/Lovv_BE/parameters/dev.yaml"

if [ ! -f "$BE_DEV_YAML" ]; then
  echo "error: backend params not found at $BE_DEV_YAML" >&2
  echo "       adjust the path or connect the Lovv_BE repo." >&2
  exit 1
fi

# Persist the domain for release-seoul.sh
echo "SEOUL_CF_DOMAIN=${ORIGIN#https://}" >> "$HERE/.seoul-cdn.env"

python3 - "$BE_DEV_YAML" "$ORIGIN" <<'PY'
import sys, re

path, origin = sys.argv[1], sys.argv[2]
additions = {
    "AllowedCorsOrigin":   origin,
    "CognitoCallbackUrls": origin + "/auth/callback/cognito",
    "CognitoLogoutUrls":   origin + "/",
}

with open(path) as f:
    lines = f.readlines()

cur_key = None
changed = []
for i, line in enumerate(lines):
    m = re.match(r"\s*-?\s*ParameterKey:\s*(\S+)", line)
    if m:
        cur_key = m.group(1)
        continue
    vm = re.match(r"(\s*ParameterValue:\s*)\"(.*)\"\s*$", line)
    if vm and cur_key in additions:
        prefix, val = vm.group(1), vm.group(2)
        add = additions[cur_key]
        parts = [p for p in val.split(",") if p]
        if add not in parts:
            parts.append(add)
            lines[i] = f'{prefix}"{",".join(parts)}"\n'
            changed.append(cur_key)
        cur_key = None

if changed:
    with open(path, "w") as f:
        f.writelines(lines)
    print("updated:", ", ".join(changed))
else:
    print("no changes (domain already present)")
PY

echo
echo "Backend params updated: $BE_DEV_YAML"
echo "Next: cd ../Lovv_BE && sam deploy --config-env default"
echo
echo "NOTE: If the Cognito user pool is managed OUTSIDE this SAM stack, also add"
echo "      ${ORIGIN}/auth/callback/cognito (callback) and ${ORIGIN}/ (sign-out)"
echo "      to the app client in the Cognito console, then verify with:"
echo "      aws cognito-idp describe-user-pool-client --user-pool-id <POOL_ID> --client-id 68mlrdhc5rjkjm6nsacqg429sj"
