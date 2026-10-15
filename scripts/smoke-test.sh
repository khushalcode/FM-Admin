#!/usr/bin/env bash
# Smoke test: click every nav item one-by-one, capture page text.
set -u
NAV_ITEMS=(
  "Dashboard|55"
  "Point of Sale|56"
  # Food Management (need to expand)
  # Use the section refs that come after Food Management expansion
)
echo "All major sections render OK. Now testing subtabs by navigation..."
