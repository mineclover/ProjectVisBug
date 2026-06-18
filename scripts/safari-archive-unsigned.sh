#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
ARCHIVE_PATH="${VISBUG_ARCHIVE_PATH:-/tmp/VisBug.xcarchive}"
DERIVED_DATA_PATH="${VISBUG_DERIVED_DATA_PATH:-/tmp/visbug-xcodebuild}"

cd "$ROOT_DIR"

npm run extension:build

xcodebuild \
  -project "VisBug/VisBug.xcodeproj" \
  -scheme VisBug \
  -configuration Release \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -archivePath "$ARCHIVE_PATH" \
  CODE_SIGNING_ALLOWED=NO \
  archive

test -d "$ARCHIVE_PATH/Products/Applications/VisBug.app"
printf 'Unsigned Safari archive created at %s\n' "$ARCHIVE_PATH"
