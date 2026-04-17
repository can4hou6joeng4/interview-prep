#!/usr/bin/env bash
# 直接安装已签名 ipa 到通过 USB 连接的 iPhone（不重签、不降级）
# 用法:
#   ./ios/scripts/install-device.sh                    # 自动找第一个设备
#   ./ios/scripts/install-device.sh 00008130-00121964  # 指定 UDID
#   ./ios/scripts/install-device.sh dev                # 先构建再装
set -euo pipefail

cd "$(dirname "$0")/.."

IPA="$PWD/build/ipa/InterviewPrep.ipa"
TARGET_UDID="${1:-}"

# 如传参 dev/enterprise 则先构建
if [[ "$TARGET_UDID" == "dev" || "$TARGET_UDID" == "enterprise" ]]; then
  echo "==> 先构建 $TARGET_UDID ipa"
  ./scripts/build-ipa.sh "$TARGET_UDID"
  TARGET_UDID=""
fi

[[ -f "$IPA" ]] || { echo "✗ 未找到 ipa: $IPA（先跑 ./scripts/build-ipa.sh dev）"; exit 1; }

echo "==> ipa 签名校验"
TMP="$(mktemp -d)"
unzip -q "$IPA" -d "$TMP"
codesign -dvv "$TMP/Payload/InterviewPrep.app" 2>&1 | grep -E "(Authority|Identifier|TeamIdentifier)"
rm -rf "$TMP"
echo ""

echo "==> 探测设备"
if [[ -z "$TARGET_UDID" ]]; then
  TARGET_UDID=$(xcrun devicectl list devices --quiet 2>/dev/null | awk '/Connected|connected/ && /iPhone|iPad/ {print $NF; exit}')
fi

if [[ -z "$TARGET_UDID" ]]; then
  echo "✗ 未检测到通过 USB 连接的 iOS 设备"
  echo ""
  echo "请确认："
  echo "  1. iPhone 通过 USB 数据线连接 Mac（不是充电线）"
  echo "  2. iPhone 解锁并点过「信任此电脑」"
  echo "  3. 运行 'xcrun devicectl list devices' 能看到设备"
  exit 1
fi

echo "目标设备: $TARGET_UDID"
echo ""

echo "==> 安装到设备"
xcrun devicectl device install app --device "$TARGET_UDID" "$IPA"

echo ""
echo "✓ 安装完成。在 iPhone 主屏找「面经刷题」图标启动。"
