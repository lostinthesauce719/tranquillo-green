#!/usr/bin/env bash
#
# One-command restore drill.
#
#   export CONVEX_DEPLOY_KEY='dev:your-drill-deployment|...'
#   export DRILL_URL='https://your-drill-deployment.convex.cloud'
#   npm run drill
#
# Deploys the schema to a THROWAWAY Convex deployment, restores a synthetic
# fixture into it, exports it back, and proves the graph survived. Prints PASS
# or FAIL and exits accordingly.
#
# Uses no real data and never contacts production.

set -uo pipefail

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BOLD=$'\033[1m'; OFF=$'\033[0m'
WORK="$(mktemp -d)"
SRC="$WORK/drill-source.ndjson"
DST="$WORK/drill-target.ndjson"

step() { printf '\n%s==> %s%s\n' "$BOLD" "$1" "$OFF"; }
die()  { printf '\n%sFAIL: %s%s\n' "$RED" "$1" "$OFF"; exit 1; }

# ── preflight ──────────────────────────────────────────────────────────
step "Checking configuration"

[ -n "${CONVEX_DEPLOY_KEY:-}" ] || die "CONVEX_DEPLOY_KEY is not set."
[ -n "${DRILL_URL:-}" ]        || die "DRILL_URL is not set (https://<deployment>.convex.cloud)."

# Refuse to run against anything that looks like production.
case "$CONVEX_DEPLOY_KEY$DRILL_URL" in
  *intent-condor-492*)
    die "This points at the production deployment. The drill must use a throwaway deployment."
    ;;
esac
case "$CONVEX_DEPLOY_KEY" in
  prod:*)
    printf '%sWARNING: this is a prod: deploy key. Continue only if it belongs to a throwaway project.%s\n' "$YELLOW" "$OFF"
    printf 'Type YES to continue: '
    read -r reply
    [ "$reply" = "YES" ] || die "Aborted."
    ;;
esac

export BACKUP_SECRET="${BACKUP_SECRET:-$(openssl rand -hex 32)}"
printf '  target:  %s\n' "$DRILL_URL"
printf '  workdir: %s\n' "$WORK"

# ── 1. deploy ──────────────────────────────────────────────────────────
step "1/6 Deploying schema and functions to the drill deployment"
npx convex dev --once || die "Deploy failed. Check the deploy key and that this is a Convex project."

step "2/6 Setting BACKUP_SECRET on the drill deployment"
npx convex env set BACKUP_SECRET "$BACKUP_SECRET" >/dev/null || die "Could not set BACKUP_SECRET."
echo "  set"

# ── 2. fixture ─────────────────────────────────────────────────────────
step "3/6 Generating and verifying the fixture snapshot"
npx tsx scripts/drill-fixture.ts --out "$SRC" || die "Fixture generation failed."
npx tsx scripts/verify-backup.ts "$SRC"       || die "Fixture failed verification."

# ── 3. restore ─────────────────────────────────────────────────────────
step "4/6 Dry run — planning the restore (nothing is written)"
npx tsx scripts/restore-backup.ts "$SRC" --url "$DRILL_URL" || die "Dry run failed."

step "5/6 Applying the restore"
npx tsx scripts/restore-backup.ts "$SRC" --url "$DRILL_URL" --yes || die "Restore failed."

# ── 4. export and compare ──────────────────────────────────────────────
step "6/6 Exporting from the drill deployment and comparing"
npx tsx scripts/backup-export.ts --url "$DRILL_URL" --out "$DST" || die "Export failed."
npx tsx scripts/verify-backup.ts "$DST" || die "Exported snapshot failed verification."

if npx tsx scripts/compare-snapshots.ts "$SRC" "$DST"; then
  printf '\n%s%sPASS%s — the restore preserved every document and every reference.\n' "$BOLD" "$GREEN" "$OFF"
  printf 'Recovery is proven end to end against a real Convex deployment.\n\n'
  printf '%sNow delete the drill project and revoke its deploy key.%s\n' "$YELLOW" "$OFF"
  printf 'Snapshots kept for inspection at: %s\n' "$WORK"
  exit 0
else
  printf '\n%s%sFAIL%s — the restored data does not match the source.\n' "$BOLD" "$RED" "$OFF"
  printf 'Do not rely on the backup until this is understood.\n'
  printf 'Snapshots kept for inspection at: %s\n' "$WORK"
  exit 1
fi
