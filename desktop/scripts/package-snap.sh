#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================================================"
echo " Building Daily Bread Desktop Snap (Flutter Linux + Snapcraft)"
echo "========================================================================"

cd "$DESKTOP_DIR"

echo "[1/3] Running Flutter tests..."
flutter test

echo "[2/3] Building Flutter Linux release bundle..."
flutter build linux --release

echo "[3/3] Packing Snap package..."
snapcraft pack --destructive-mode

echo ""
echo "Done! Generated .snap file(s):"
ls -lh "$DESKTOP_DIR"/*.snap
