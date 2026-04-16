#!/usr/bin/env bash
# 一键把两张证书 + 描述文件导入本机钥匙串 / Xcode
# 用法: ./ios/scripts/install-certs.sh
set -euo pipefail

CERT_ROOT="${CERT_ROOT:-$HOME/Documents/files/cert}"
PASSWORD="1"

DEV_DIR="$CERT_ROOT/b0761d0d6bd48eae810adbd190674aa144524922"
ENT_DIR="$CERT_ROOT/证书_00008130-001219640A98001C"

err() { echo "[install-certs] ✗ $*" >&2; exit 1; }
log() { echo "[install-certs] $*"; }

[[ -d "$DEV_DIR" ]] || err "开发者证书目录不存在: $DEV_DIR"
[[ -d "$ENT_DIR" ]] || err "企业证书目录不存在: $ENT_DIR"

# 1. 导入 .p12 到登录钥匙串
log "导入开发者 p12 ..."
security import "$ENT_DIR/证书文件.p12" -k ~/Library/Keychains/login.keychain-db -P "$PASSWORD" -T /usr/bin/codesign -T /usr/bin/security 2>&1 | grep -v "already exists" || true
log "导入企业 p12 ..."
security import "$DEV_DIR/cert.p12" -k ~/Library/Keychains/login.keychain-db -P "$PASSWORD" -T /usr/bin/codesign -T /usr/bin/security 2>&1 | grep -v "already exists" || true

# 2. 安装描述文件到 Xcode
PROF_DIR="$HOME/Library/MobileDevice/Provisioning Profiles"
mkdir -p "$PROF_DIR"

install_profile() {
  local src="$1"
  local uuid
  uuid=$(security cms -D -i "$src" 2>/dev/null | python3 -c "import sys,plistlib;print(plistlib.loads(sys.stdin.buffer.read())['UUID'])")
  cp "$src" "$PROF_DIR/$uuid.mobileprovision"
  log "安装 profile → $uuid.mobileprovision"
}

install_profile "$DEV_DIR/证书文件.p12" 2>/dev/null || true
install_profile "$ENT_DIR/描述文件.mobileprovision"
install_profile "$DEV_DIR/cert.mobileprovision"

log "完成。可用 \`security find-identity -p codesigning -v\` 验证证书已入链。"
