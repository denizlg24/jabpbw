#!/bin/sh
set -e

REPO="denizlg24/jabpbw"
INSTALL_DIR="/usr/local/bin"
BIN_NAME="jabpbw"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux)  PLATFORM="linux" ;;
  Darwin) PLATFORM="darwin" ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64|amd64)  ARCH_SUFFIX="x64" ;;
  aarch64|arm64) ARCH_SUFFIX="arm64" ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

ARTIFACT="${BIN_NAME}-${PLATFORM}-${ARCH_SUFFIX}"
URL="https://github.com/${REPO}/releases/latest/download/${ARTIFACT}"

echo "Downloading ${ARTIFACT}..."
curl -fSL "$URL" -o "$BIN_NAME"
chmod +x "$BIN_NAME"

if [ -w "$INSTALL_DIR" ]; then
  mv "$BIN_NAME" "$INSTALL_DIR/$BIN_NAME"
else
  echo "Installing to ${INSTALL_DIR} (requires sudo)..."
  sudo mv "$BIN_NAME" "$INSTALL_DIR/$BIN_NAME"
fi

echo "Installed ${BIN_NAME} to ${INSTALL_DIR}/${BIN_NAME}"
