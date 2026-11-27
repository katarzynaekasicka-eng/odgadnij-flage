#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p .local
if [ ! -f .local/debug.keystore ]; then
  keytool -genkeypair -noprompt -keystore .local/debug.keystore -storepass android -alias androiddebugkey -keypass android -dname 'CN=Android Debug,O=Android,C=US' -keyalg RSA -keysize 2048 -validity 10000
fi
