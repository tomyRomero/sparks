#!/usr/bin/env bash
# One-time local setup. Generates local secrets and keeps them out of the repo:
#   .env                .NET user-secrets (Sparks.Api)
#   └ SA_PASSWORD       ├ ConnectionStrings:SparksDb
#                       └ Jwt:Secret
#
# Safe to re-run: an existing .env and JWT key are kept, and the connection
# string is rebuilt from .env. Never prints a secret.
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

dotnet user-secrets set "ConnectionStrings:SparksDb" \
  "Server=localhost,14332;Database=Sparks;User Id=sa;Password=${sa_password};TrustServerCertificate=True" \
  --project "$api_project" > /dev/null
echo "Stored the API connection string in .NET user-secrets."

# A new key would sign everyone out, so only create one when none exists.
if ! dotnet user-secrets list --project "$api_project" | grep -q '^Jwt:Secret = '; then
  dotnet user-secrets set "Jwt:Secret" "$(openssl rand -base64 48)" --project "$api_project" > /dev/null
  echo "Stored a new JWT signing key in .NET user-secrets."
fi

echo
echo "Next: docker compose up -d --wait, then dotnet run --project $api_project"
