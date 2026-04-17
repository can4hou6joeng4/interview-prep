#!/usr/bin/env bash
# 一键导入证书私钥 + 描述文件 + WWDR 中间证书
# 用法: ./ios/scripts/install-certs.sh
set -euo pipefail

CERT_ROOT="${CERT_ROOT:-$HOME/Documents/files/cert}"
PASSWORD="1"

DEV_DIR="$CERT_ROOT/证书_00008130-001219640A98001C"    # iPhone Distribution: Natalie Neuman (R36U8N6X48)
ENT_DIR="$CERT_ROOT/b0761d0d6bd48eae810adbd190674aa144524922"  # iPhone Distribution: XL AXIATA, PT TBK

log() { echo "[install-certs] $*"; }
err() { echo "[install-certs] ✗ $*" >&2; exit 1; }

[[ -d "$DEV_DIR" ]] || err "开发者证书目录不存在: $DEV_DIR"
[[ -d "$ENT_DIR" ]] || err "企业证书目录不存在: $ENT_DIR"

OSSL="$(command -v /opt/homebrew/opt/openssl@3/bin/openssl || true)"
[[ -x "$OSSL" ]] || OSSL="$(command -v openssl)"
[[ -x "$OSSL" ]] || err "openssl 未安装（建议 brew install openssl@3）"
log "使用 openssl: $OSSL ($($OSSL version))"

# === 1. 装 WWDR 中间证书链（首次必装，否则 CSSMERR_TP_NOT_TRUSTED） ===
log "检查 Apple WWDR 中间证书..."
WWDR_DIR="$(mktemp -d)"
for cer in AppleWWDRCAG2 AppleWWDRCAG3 AppleWWDRCAG4 AppleWWDRCAG5 AppleWWDRCAG6; do
  curl -fsSL -o "$WWDR_DIR/${cer}.cer" "https://www.apple.com/certificateauthority/${cer}.cer" || continue
  security import "$WWDR_DIR/${cer}.cer" -k ~/Library/Keychains/login.keychain-db 2>/dev/null | head -1 || true
done
rm -rf "$WWDR_DIR"

# === 2. 把 p12 转成 macOS security 能识别的 PKCS12 编码再导入 ===
import_p12() {
  local src="$1" label="$2"
  local tmp_pem="$(mktemp -t ip_pem).pem"
  local tmp_p12="$(mktemp -t ip_p12).p12"
  # legacy 模式读出原始 p12（LibreSSL 3.x 不支持 RC2，必须用 brew openssl@3）
  $OSSL pkcs12 -legacy -in "$src" -passin "pass:$PASSWORD" -nodes -out "$tmp_pem" 2>/dev/null
  # 用 SHA1+3DES 重新打包（macOS security 默认接受的古典 PKCS12）
  $OSSL pkcs12 -export -in "$tmp_pem" -out "$tmp_p12" -passout "pass:$PASSWORD" \
    -macalg sha1 -certpbe PBE-SHA1-3DES -keypbe PBE-SHA1-3DES 2>/dev/null
  security import "$tmp_p12" -k ~/Library/Keychains/login.keychain-db \
    -P "$PASSWORD" -T /usr/bin/codesign -T /usr/bin/security -A 2>&1 | head -1
  rm -f "$tmp_pem" "$tmp_p12"
  log "$label 导入完成"
}

log "导入开发者证书（Natalie Neuman / R36U8N6X48）..."
import_p12 "$DEV_DIR/证书文件.p12" "开发者 p12"

log "导入企业证书（XL AXIATA / Q6SJUT5K5D）..."
import_p12 "$ENT_DIR/cert.p12" "企业 p12"

# === 3. 描述文件安装到 Xcode ===
PROF_DIR="$HOME/Library/MobileDevice/Provisioning Profiles"
mkdir -p "$PROF_DIR"

install_profile() {
  local src="$1"
  local uuid
  uuid=$(security cms -D -i "$src" 2>/dev/null | python3 -c "import sys,plistlib;print(plistlib.loads(sys.stdin.buffer.read())['UUID'])")
  cp "$src" "$PROF_DIR/$uuid.mobileprovision"
  log "安装 profile → $uuid.mobileprovision"
}

install_profile "$DEV_DIR/描述文件.mobileprovision"
install_profile "$ENT_DIR/cert.mobileprovision"

# === 4. 校验 ===
echo ""
log "=== 签名身份校验 ==="
security find-identity -v -p codesigning

echo ""
log "完成。下一步可跑: ./scripts/build-ipa.sh dev"
