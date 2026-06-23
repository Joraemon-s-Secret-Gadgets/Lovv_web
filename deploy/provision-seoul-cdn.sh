#!/usr/bin/env bash
#
# provision-seoul-cdn.sh
# -----------------------------------------------------------------------------
# Creates a NEW static-hosting stack for the Lovv frontend in Seoul:
#   - S3 bucket (ap-northeast-2), all public access blocked
#   - CloudFront Origin Access Control (OAC, SigV4)
#   - CloudFront distribution (SPA error responses, OAC -> S3 REST origin)
#   - S3 bucket policy that allows ONLY this distribution to read the bucket
#
# This script does NOT touch the existing US (us-east-1) bucket/distribution.
# Run it yourself with credentials that can manage S3 + CloudFront.
#
# Usage:
#   ./deploy/provision-seoul-cdn.sh
#
# Outputs (also written to deploy/.seoul-cdn.env):
#   SEOUL_BUCKET, SEOUL_DISTRIBUTION_ID, SEOUL_CF_DOMAIN
# -----------------------------------------------------------------------------
set -euo pipefail

# ---- Config (override via environment) --------------------------------------
AWS_PROFILE="${AWS_PROFILE:-default}"
ACCOUNT_ID="${ACCOUNT_ID:-925273580929}"
REGION="ap-northeast-2"
# S3 bucket names are globally unique -> suffix with the account id.
BUCKET="${SEOUL_BUCKET:-lovv-frontend-dev-seoul-${ACCOUNT_ID}}"
OAC_NAME="lovv-frontend-dev-seoul-oac"
CALLER_REF="lovv-frontend-dev-seoul-$(date +%s)"
OUT_ENV="$(cd "$(dirname "$0")" && pwd)/.seoul-cdn.env"

export AWS_PROFILE
say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

say "Using profile=$AWS_PROFILE account=$ACCOUNT_ID region=$REGION bucket=$BUCKET"
aws sts get-caller-identity --query Account --output text >/dev/null

# ---- 1. S3 bucket ------------------------------------------------------------
if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  say "Bucket $BUCKET already exists, reusing."
else
  say "Creating bucket $BUCKET in $REGION"
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration "LocationConstraint=$REGION"
fi

say "Blocking all public access on $BUCKET"
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

say "Enabling default SSE-S3 encryption"
aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# ---- 2. Origin Access Control -----------------------------------------------
say "Ensuring Origin Access Control: $OAC_NAME"
OAC_ID="$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='${OAC_NAME}'].Id | [0]" \
  --output text 2>/dev/null || true)"

if [ -z "$OAC_ID" ] || [ "$OAC_ID" = "None" ]; then
  OAC_ID="$(aws cloudfront create-origin-access-control \
    --origin-access-control-config \
      "Name=${OAC_NAME},Description=Lovv FE Seoul,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
    --query 'OriginAccessControl.Id' --output text)"
fi
say "OAC_ID=$OAC_ID"

# ---- 3. CloudFront distribution ---------------------------------------------
ORIGIN_DOMAIN="${BUCKET}.s3.${REGION}.amazonaws.com"
DIST_CONFIG="$(mktemp)"
cat > "$DIST_CONFIG" <<JSON
{
  "CallerReference": "${CALLER_REF}",
  "Comment": "Lovv frontend dev (Seoul)",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "s3-seoul",
        "DomainName": "${ORIGIN_DOMAIN}",
        "OriginAccessControlId": "${OAC_ID}",
        "S3OriginConfig": { "OriginAccessIdentity": "" }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-seoul",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
    },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      { "ErrorCode": 403, "ResponseCode": "200", "ResponsePagePath": "/index.html", "ErrorCachingMinTTL": 10 },
      { "ErrorCode": 404, "ResponseCode": "200", "ResponsePagePath": "/index.html", "ErrorCachingMinTTL": 10 }
    ]
  },
  "PriceClass": "PriceClass_200"
}
JSON

say "Creating CloudFront distribution"
CREATE_OUT="$(aws cloudfront create-distribution --distribution-config "file://${DIST_CONFIG}")"
DIST_ID="$(echo "$CREATE_OUT" | python3 -c 'import sys,json;print(json.load(sys.stdin)["Distribution"]["Id"])')"
CF_DOMAIN="$(echo "$CREATE_OUT" | python3 -c 'import sys,json;print(json.load(sys.stdin)["Distribution"]["DomainName"])')"
rm -f "$DIST_CONFIG"
say "DIST_ID=$DIST_ID  CF_DOMAIN=$CF_DOMAIN"

# ---- 4. Bucket policy (ACCESS CONTROL — review before applying) --------------
DIST_ARN="arn:aws:cloudfront::${ACCOUNT_ID}:distribution/${DIST_ID}"
POLICY="$(mktemp)"
cat > "$POLICY" <<JSON
{
  "Version": "2008-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET}/*",
      "Condition": { "StringEquals": { "AWS:SourceArn": "${DIST_ARN}" } }
    }
  ]
}
JSON
say "Applying bucket policy (CloudFront-only read)"
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "file://${POLICY}"
rm -f "$POLICY"

# ---- 5. Persist outputs ------------------------------------------------------
cat > "$OUT_ENV" <<ENV
# Generated by provision-seoul-cdn.sh on $(date -u +%FT%TZ)
SEOUL_BUCKET=${BUCKET}
SEOUL_DISTRIBUTION_ID=${DIST_ID}
SEOUL_CF_DOMAIN=${CF_DOMAIN}
ENV

say "Done. Wrote $OUT_ENV"
echo
echo "  New origin URL: https://${CF_DOMAIN}"
echo
echo "Next:"
echo "  1) ./deploy/configure-new-domain.sh https://${CF_DOMAIN}"
echo "  2) (Lovv_BE) sam deploy --config-env default        # applies Cognito + CORS"
echo "  3) ./deploy/release-seoul.sh                          # build + upload + invalidate"
echo
echo "CloudFront takes ~5-15 min to finish deploying. Track with:"
echo "  aws cloudfront wait distribution-deployed --id ${DIST_ID}"
