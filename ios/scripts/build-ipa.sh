#!/usr/bin/env bash
# Archive + 导出 .ipa
# 用法:
#   ./ios/scripts/build-ipa.sh dev         # 用开发者证书，仅指定设备
#   ./ios/scripts/build-ipa.sh enterprise  # 用企业证书，任意设备
set -euo pipefail

MODE="${1:-dev}"
cd "$(dirname "$0")/.."

command -v xcodegen >/dev/null || { echo "✗ 请先 brew install xcodegen"; exit 1; }

# 数据导出 + 工程生成
(cd .. && node scripts/export-ios-data.mjs)
xcodegen generate

BUILD_DIR="build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

case "$MODE" in
  dev)
    CONFIG="Release"
    METHOD="development"
    TEAM="R36U8N6X48"
    BUNDLE="app.yellow4516.serval5183"
    PROFILE="00008130-001219640A98001CDA524Y"
    ;;
  enterprise|ent)
    CONFIG="ReleaseEnterprise"
    METHOD="enterprise"
    TEAM="Q6SJUT5K5D"
    BUNDLE="com.xl.MyXL.Giant-staging"
    PROFILE="MyXL-UniversalDist"
    ;;
  *)
    echo "用法: $0 [dev|enterprise]"; exit 1;;
esac

cat > "$BUILD_DIR/ExportOptions.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>$METHOD</string>
  <key>teamID</key><string>$TEAM</string>
  <key>signingStyle</key><string>manual</string>
  <key>provisioningProfiles</key>
  <dict>
    <key>$BUNDLE</key><string>$PROFILE</string>
  </dict>
  <key>compileBitcode</key><false/>
  <key>stripSwiftSymbols</key><true/>
</dict>
</plist>
EOF

echo "==> Archive ($CONFIG)"
xcodebuild -project InterviewPrep.xcodeproj \
  -scheme InterviewPrep \
  -configuration "$CONFIG" \
  -archivePath "$BUILD_DIR/InterviewPrep.xcarchive" \
  -destination "generic/platform=iOS" \
  archive

echo "==> Export ipa"
xcodebuild -exportArchive \
  -archivePath "$BUILD_DIR/InterviewPrep.xcarchive" \
  -exportOptionsPlist "$BUILD_DIR/ExportOptions.plist" \
  -exportPath "$BUILD_DIR/ipa"

echo "✓ 产出: $(pwd)/$BUILD_DIR/ipa/InterviewPrep.ipa"
