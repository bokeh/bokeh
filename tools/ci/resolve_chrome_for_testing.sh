#!/usr/bin/env bash

set -euo pipefail

channel=$(printf '%s' "${1:-BETA}" | tr '[:lower:]' '[:upper:]')
platform=${2:-linux64}

case "$channel" in
  STABLE|BETA|DEV|CANARY) ;;
  *)
    echo "unsupported Chrome for Testing channel: $channel" >&2
    exit 2
    ;;
esac

case "$platform" in
  linux-arm64|linux64|mac-arm64|mac-x64|win32|win64) ;;
  *)
    echo "unsupported Chrome for Testing platform: $platform" >&2
    exit 2
    ;;
esac

version_url="https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_${channel}"
version=$(curl --fail --location --silent --show-error "$version_url")

if ! [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "invalid Chrome for Testing version: $version" >&2
  exit 1
fi

archive="chrome-${platform}.zip"
url="https://storage.googleapis.com/chrome-for-testing-public/${version}/${platform}/${archive}"

if command -v sha256sum > /dev/null; then
  hash=(sha256sum)
elif command -v shasum > /dev/null; then
  hash=(shasum -a 256)
else
  echo "sha256sum or shasum is required" >&2
  exit 1
fi

sha256=$(curl --fail --location --silent --show-error "$url" | "${hash[@]}" | awk '{print $1}')

if ! [[ $sha256 =~ ^[0-9a-f]{64}$ ]]; then
  echo "invalid Chrome for Testing archive digest: $sha256" >&2
  exit 1
fi

printf 'version=%s\n' "$version"
printf 'sha256=%s\n' "$sha256"
