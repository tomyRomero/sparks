#!/usr/bin/env bash
# One-time local setup. Generates local secrets and keeps them out of the repo:
#   .env                .NET user-secrets (Sparks.Api)
#   └ SA_PASSWORD       └ ConnectionStrings:SparksDb
#
# Safe to re-run: an existing .env is kept, and the connection string is
# rebuilt from it. Never prints a secret.
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

echo
echo "Next: docker compose up -d --wait, then dotnet run --project $api_project"
