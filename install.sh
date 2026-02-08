#!/bin/sh
# logifai installer — downloads the latest binary from GitHub Releases
# Usage: curl -fsSL https://raw.githubusercontent.com/tomoyaf/logifai/main/install.sh | sh

set -e

REPO="tomoyaf/logifai"
INSTALL_DIR="${LOGIFAI_INSTALL:-$HOME/.logifai/bin}"

# --- helpers ---

info() {
  printf '  \033[1;34m>\033[0m %s\n' "$1"
}

error() {
  printf '  \033[1;31merror\033[0m: %s\n' "$1" >&2
  exit 1
}

fetch() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
  else
    error "curl or wget is required"
  fi
}

download() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$2" "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$2" "$1"
  else
    error "curl or wget is required"
  fi
}

# --- detect platform ---

detect_os() {
  case "$(uname -s)" in
    Linux*)  echo "linux" ;;
    Darwin*) echo "darwin" ;;
    *)       error "Unsupported OS: $(uname -s). Use npm install -g logifai instead." ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64)   echo "x64" ;;
    aarch64|arm64)   echo "arm64" ;;
    *)               error "Unsupported architecture: $(uname -m)" ;;
  esac
}

# --- main ---

PATH_ADDED=0

main() {
  OS="$(detect_os)"
  ARCH="$(detect_arch)"
  TARGET="${OS}-${ARCH}"

  # Determine version
  if [ -n "${LOGIFAI_VERSION:-}" ]; then
    VERSION="$LOGIFAI_VERSION"
  else
    info "Fetching latest version..."
    VERSION="$(fetch "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": *"v\{0,1\}\([^"]*\)".*/\1/')"
    if [ -z "$VERSION" ]; then
      error "Could not determine latest version"
    fi
  fi

  BINARY_NAME="logifai-${TARGET}"
  DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/${BINARY_NAME}"
  CHECKSUM_URL="https://github.com/${REPO}/releases/download/v${VERSION}/checksums.txt"

  info "Installing logifai v${VERSION} for ${TARGET}..."

  # Create install directory
  mkdir -p "$INSTALL_DIR"

  # Download binary
  TMP_FILE="$(mktemp)"
  trap 'rm -f "$TMP_FILE"' EXIT

  info "Downloading ${BINARY_NAME}..."
  download "$DOWNLOAD_URL" "$TMP_FILE"

  # Verify checksum
  CHECKSUMS="$(fetch "$CHECKSUM_URL" 2>/dev/null || true)"
  if [ -n "$CHECKSUMS" ]; then
    EXPECTED="$(echo "$CHECKSUMS" | grep "$BINARY_NAME" | awk '{print $1}')"
    if [ -n "$EXPECTED" ]; then
      if command -v sha256sum >/dev/null 2>&1; then
        ACTUAL="$(sha256sum "$TMP_FILE" | awk '{print $1}')"
      elif command -v shasum >/dev/null 2>&1; then
        ACTUAL="$(shasum -a 256 "$TMP_FILE" | awk '{print $1}')"
      else
        ACTUAL=""
      fi
      if [ -n "$ACTUAL" ]; then
        if [ "$ACTUAL" != "$EXPECTED" ]; then
          error "Checksum verification failed"
        fi
        info "Checksum verified."
      fi
    fi
  fi

  # Install
  mv "$TMP_FILE" "${INSTALL_DIR}/logifai"
  chmod +x "${INSTALL_DIR}/logifai"
  trap - EXIT

  info "Installed to ${INSTALL_DIR}/logifai"

  # Add to PATH if needed
  add_to_path

  printf '\n'
  if [ "$PATH_ADDED" = "1" ]; then
    info "To start using logifai, run:"
    printf '\n'
    info "  source ${RC_FILE}"
    printf '\n'
  else
    info "Done! Run 'logifai --version' to verify."
  fi
}

add_to_path() {
  case ":${PATH}:" in
    *":${INSTALL_DIR}:"*) return ;;
  esac

  SHELL_NAME="$(basename "${SHELL:-/bin/sh}")"
  EXPORT_LINE="export PATH=\"${INSTALL_DIR}:\$PATH\""

  case "$SHELL_NAME" in
    zsh)
      RC_FILE="$HOME/.zshrc"
      ;;
    bash)
      if [ -f "$HOME/.bashrc" ]; then
        RC_FILE="$HOME/.bashrc"
      else
        RC_FILE="$HOME/.bash_profile"
      fi
      ;;
    *)
      info "Add ${INSTALL_DIR} to your PATH manually:"
      info "  ${EXPORT_LINE}"
      return
      ;;
  esac

  # Avoid duplicate entries
  if [ -f "$RC_FILE" ] && grep -qF "$INSTALL_DIR" "$RC_FILE" 2>/dev/null; then
    return
  fi

  printf '\n# logifai\n%s\n' "$EXPORT_LINE" >> "$RC_FILE"
  info "Added ${INSTALL_DIR} to PATH in ${RC_FILE}"
  PATH_ADDED=1
}

main
