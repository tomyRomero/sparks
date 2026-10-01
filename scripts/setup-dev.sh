#!/usr/bin/env bash
# One-time local setup. Generates local secrets and keeps them out of the repo:
#   .env                        .NET user-secrets (Sparks.Api)
#   ├ SA_PASSWORD               ├ ConnectionStrings:SparksDb
#   └ STORAGE_* (bucket keys)   ├ Jwt:Secret
#                               ├ Seed:Password (the demo accounts' password)
#                               └ Storage:S3:* (the local bucket, unless another is set)
#
# Safe to re-run: existing passwords and keys are kept, and the connection
# string and local bucket settings are rebuilt from .env. Never prints a secret.
set -euo pipefail
cd "$(dirname "$0")/.."

api_project=src/backend/Sparks.Api

if [[ ! -f .env ]]; then
  # "Sp-" plus hex covers SQL Server's password rules: upper and lower case,
  # digits and a symbol.
  printf 'SA_PASSWORD=Sp-%s\n' "$(openssl rand -hex 16)" > .env
  echo "Created .env with a generated SQL Server password."
fi

sa_password="$(grep -E '^SA_PASSWORD=' .env | cut -d= -f2-)"
if [[ -z "$sa_password" ]]; then
  echo "SA_PASSWORD is empty in .env. Set it or delete .env and re-run." >&2
  exit 1
fi

# The local bucket's key pair, which docker-compose.yml hands to SeaweedFS.
# An .env made before the bucket existed gets one added.
if ! grep -q '^STORAGE_ACCESS_KEY_ID=' .env; then
  # Start on a line of its own if .env doesn't end with one.
  [[ -z "$(tail -c 1 .env)" ]] || echo >> .env
  printf 'STORAGE_ACCESS_KEY_ID=sparks-%s\nSTORAGE_SECRET_ACCESS_KEY=%s\n' \
    "$(openssl rand -hex 4)" "$(openssl rand -hex 24)" >> .env
  echo "Added a key pair for the local bucket to .env."
fi

storage_key_id="$(grep -E '^STORAGE_ACCESS_KEY_ID=' .env | cut -d= -f2-)"
storage_secret="$(grep -E '^STORAGE_SECRET_ACCESS_KEY=' .env | cut -d= -f2- || true)"
if [[ -z "$storage_key_id" || -z "$storage_secret" ]]; then
  echo "The local bucket's keys are incomplete in .env. Remove both STORAGE_ lines and re-run." >&2
  exit 1
fi

dotnet user-secrets set "ConnectionStrings:SparksDb" \
  "Server=localhost,14332;Database=Sparks;User Id=sa;Password=${sa_password};TrustServerCertificate=True" \
  --project "$api_project" > /dev/null
echo "Stored the API connection string in .NET user-secrets."

# A new key would sign everyone out, so only create one when none exists.
if ! dotnet user-secrets list --project "$api_project" | grep -q '^Jwt:Secret = '; then
  dotnet user-secrets set "Jwt:Secret" "$(openssl rand -base64 48)" --project "$api_project" > /dev/null
  echo "Stored a new JWT signing key in .NET user-secrets."
fi

# The password every demo account gets from `dotnet run -- seed`. Read it
# with `dotnet user-secrets list --project src/backend/Sparks.Api`.
if ! dotnet user-secrets list --project "$api_project" | grep -q '^Seed:Password = '; then
  dotnet user-secrets set "Seed:Password" "demo-$(openssl rand -hex 6)" --project "$api_project" > /dev/null
  echo "Stored a demo account password in .NET user-secrets."
fi

# Pictures go to the local bucket unless another, such as Cloudflare R2, is
# set. Its keys follow .env, as the connection string does.
local_bucket=http://localhost:8333
service_url="$(dotnet user-secrets list --project "$api_project" | sed -n 's/^Storage:S3:ServiceUrl = //p')"
if [[ -z "$service_url" || "$service_url" == "$local_bucket" ]]; then
  dotnet user-secrets set "Storage:S3:ServiceUrl" "$local_bucket" --project "$api_project" > /dev/null
  dotnet user-secrets set "Storage:S3:Bucket" "sparks" --project "$api_project" > /dev/null
  dotnet user-secrets set "Storage:S3:AccessKeyId" "$storage_key_id" --project "$api_project" > /dev/null
  dotnet user-secrets set "Storage:S3:SecretAccessKey" "$storage_secret" --project "$api_project" > /dev/null
  echo "Pointed picture storage at the local bucket in .NET user-secrets."
fi

echo
echo "Next: docker compose up -d --wait, then dotnet run --project $api_project"
echo "Demo data (optional): dotnet run --project $api_project -- seed"
