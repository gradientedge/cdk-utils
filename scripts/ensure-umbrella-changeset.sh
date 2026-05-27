#!/usr/bin/env bash
# Ensures @gradientedge/cdk-utils (umbrella) is included in every changeset
# that bumps a sub-package. Uses the highest bump level found.

set -euo pipefail

UMBRELLA="@gradientedge/cdk-utils"

# Find staged changeset markdown files (excluding README and config)
changeset_files=$(git diff --cached --name-only --diff-filter=ACM -- '.changeset/*.md' | grep -v README || true)

if [ -z "$changeset_files" ]; then
  exit 0
fi

for file in $changeset_files; do
  # Skip if umbrella is already listed (match exact name, not sub-packages like cdk-utils-aws)
  if grep -qE "(@gradientedge/cdk-utils)['\"]:" "$file"; then
    continue
  fi

  # Extract the frontmatter (between --- markers)
  frontmatter=$(sed -n '/^---$/,/^---$/p' "$file")

  # Find the highest bump level in the changeset
  highest=""
  if echo "$frontmatter" | grep -q ": major"; then
    highest="major"
  elif echo "$frontmatter" | grep -q ": minor"; then
    highest="minor"
  elif echo "$frontmatter" | grep -q ": patch"; then
    highest="patch"
  fi

  if [ -z "$highest" ]; then
    continue
  fi

  # Insert the umbrella package line before the closing ---
  awk -v pkg="$UMBRELLA" -v level="$highest" '
    BEGIN { count = 0 }
    /^---$/ {
      count++
      if (count == 2) {
        print "'\''" pkg "'\'': " level
      }
    }
    { print }
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"

  echo "Auto-added $UMBRELLA ($highest) to $file"

  # Re-stage the modified file
  git add "$file"
done
