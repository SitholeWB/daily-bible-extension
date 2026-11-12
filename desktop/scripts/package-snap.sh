#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================================================"
echo " Building Daily Bread Desktop Snap (Flutter + GNOME Extension / core24)"
echo "========================================================================"

cd "$DESKTOP_DIR"

if ! command -v lxc >/dev/null 2>&1; then
  echo "LXD is required for clean core24 + gnome extension Snap builds."
  echo "Install once with:"
  echo "  sudo snap install lxd && sudo lxd init --auto"
  exit 1
fi

echo "[1/2] Running Flutter tests..."
flutter test

echo "[2/2] Packing Snap inside isolated core24 container..."
snapcraft pack

echo ""
echo "Done! Generated .snap file(s):"
ls -lh "$DESKTOP_DIR"/*.snap
