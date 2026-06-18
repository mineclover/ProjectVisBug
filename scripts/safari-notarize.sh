#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
ARCHIVE_PATH="${VISBUG_ARCHIVE_PATH:-/tmp/VisBug.xcarchive}"
EXPORT_PATH="${VISBUG_EXPORT_PATH:-/tmp/VisBugExport}"
EXPORT_OPTIONS="${VISBUG_EXPORT_OPTIONS:-/tmp/VisBugExportOptions.plist}"
ZIP_PATH="${VISBUG_ZIP_PATH:-/tmp/VisBug.zip}"

: "${APPLE_TEAM_ID:?Set APPLE_TEAM_ID for Developer ID signing}"
: "${APPLE_ID:?Set APPLE_ID for notarytool authentication}"
: "${APPLE_APP_PASSWORD:?Set APPLE_APP_PASSWORD for notarytool authentication}"

cd "$ROOT_DIR"

npm run extension:build

xcodebuild \
  -project "VisBug/VisBug.xcodeproj" \
  -scheme VisBug \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
  CODE_SIGN_STYLE=Automatic \
  archive

cat > "$EXPORT_OPTIONS" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>developer-id</string>
  <key>signingStyle</key>
  <string>automatic</string>
</dict>
</plist>
PLIST

rm -rf "$EXPORT_PATH" "$ZIP_PATH"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$EXPORT_PATH" \
  -allowProvisioningUpdates

ditto -c -k --keepParent "$EXPORT_PATH/VisBug.app" "$ZIP_PATH"

xcrun notarytool submit "$ZIP_PATH" \
  --apple-id "$APPLE_ID" \
  --team-id "$APPLE_TEAM_ID" \
  --password "$APPLE_APP_PASSWORD" \
  --wait

xcrun stapler staple "$EXPORT_PATH/VisBug.app"
printf 'Signed and notarized Safari app at %s/VisBug.app\n' "$EXPORT_PATH"
