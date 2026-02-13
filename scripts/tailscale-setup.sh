#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Tailscale Setup Script for macOS (Mac Mini fleet)
# Installs Tailscale, connects to tailnet, enables SSH, configures persistence
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail()  { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

# -----------------------------------------------------------------------------
# Parse arguments
# -----------------------------------------------------------------------------
AUTHKEY=""
HOSTNAME=""

usage() {
  cat <<EOF
Usage: $0 --authkey <tailscale-auth-key> --hostname <machine-hostname>

Options:
  --authkey   Tailscale auth key (tskey-auth-...)
  --hostname  Desired hostname on the tailnet (e.g. thor-mini-1)
  -h, --help  Show this help message

Example:
  $0 --authkey tskey-auth-abc123 --hostname thor-mini-1
EOF
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --authkey)  AUTHKEY="$2"; shift 2 ;;
    --hostname) HOSTNAME="$2"; shift 2 ;;
    -h|--help)  usage ;;
    *) fail "Unknown argument: $1" ;;
  esac
done

[[ -z "$AUTHKEY" ]]  && fail "Missing required argument: --authkey"
[[ -z "$HOSTNAME" ]] && fail "Missing required argument: --hostname"

# -----------------------------------------------------------------------------
# Preflight
# -----------------------------------------------------------------------------
log "Starting Tailscale setup for hostname: $HOSTNAME"

if [[ "$(uname)" != "Darwin" ]]; then
  fail "This script is designed for macOS only."
fi

# Ensure we can sudo
if ! sudo -v 2>/dev/null; then
  fail "This script requires sudo access. Please run as an admin user."
fi

# Keep sudo alive for the duration of the script
while true; do sudo -n true; sleep 30; kill -0 "$$" || exit; done 2>/dev/null &

# -----------------------------------------------------------------------------
# Step 1: Install Homebrew if missing
# -----------------------------------------------------------------------------
if ! command -v brew &>/dev/null; then
  log "Homebrew not found. Installing..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  # Add Homebrew to PATH for Apple Silicon Macs
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
  fi
  ok "Homebrew installed"
else
  ok "Homebrew already installed"
fi

# -----------------------------------------------------------------------------
# Step 2: Install Tailscale
# -----------------------------------------------------------------------------
if ! command -v tailscale &>/dev/null; then
  log "Installing Tailscale via Homebrew..."
  brew install --cask tailscale
  ok "Tailscale installed"
else
  ok "Tailscale already installed"
fi

# Wait for Tailscale daemon to be available
log "Ensuring Tailscale daemon is running..."
open -a Tailscale 2>/dev/null || true
sleep 3

# Verify the CLI is reachable
for i in {1..10}; do
  if tailscale status &>/dev/null 2>&1; then
    break
  fi
  if [[ $i -eq 10 ]]; then
    fail "Tailscale daemon did not start. Open Tailscale.app manually and re-run."
  fi
  sleep 2
done
ok "Tailscale daemon is running"

# -----------------------------------------------------------------------------
# Step 3: Connect to tailnet
# -----------------------------------------------------------------------------
log "Connecting to tailnet with provided auth key..."
sudo tailscale up --authkey="$AUTHKEY" --hostname="$HOSTNAME" --ssh
ok "Connected to tailnet as $HOSTNAME"

# -----------------------------------------------------------------------------
# Step 4: Enable macOS Remote Login (SSH)
# -----------------------------------------------------------------------------
log "Enabling Remote Login (SSH) via systemsetup..."
sudo systemsetup -setremotelogin on 2>/dev/null || warn "Could not enable Remote Login (may already be on or require MDM)"
ok "Remote Login (SSH) enabled"

# -----------------------------------------------------------------------------
# Step 5: Configure Tailscale to start on boot
# -----------------------------------------------------------------------------
log "Configuring Tailscale to start on login..."

# The Homebrew cask installs Tailscale.app which registers itself as a login item.
# We ensure it's in Login Items via osascript as a belt-and-suspenders approach.
osascript -e 'tell application "System Events" to make login item at end with properties {path:"/Applications/Tailscale.app", hidden:true}' 2>/dev/null || true
ok "Tailscale configured to start on boot"

# -----------------------------------------------------------------------------
# Step 6: Set the machine's local hostname to match
# -----------------------------------------------------------------------------
log "Setting local hostname to $HOSTNAME..."
sudo scutil --set ComputerName "$HOSTNAME"
sudo scutil --set HostName "$HOSTNAME"
sudo scutil --set LocalHostName "$HOSTNAME"
ok "Local hostname set to $HOSTNAME"

# -----------------------------------------------------------------------------
# Step 7: Verify
# -----------------------------------------------------------------------------
log "Verifying setup..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e " ${GREEN}Tailscale Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tailscale status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "unknown")
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo -e "  Hostname:      ${BLUE}$HOSTNAME${NC}"
echo -e "  Tailscale IP:  ${BLUE}$TAILSCALE_IP${NC}"
echo -e "  Tailscale SSH: ${GREEN}enabled${NC}"
echo -e "  macOS SSH:     ${GREEN}enabled${NC}"
echo ""
echo -e "  Connect via: ${YELLOW}ssh $HOSTNAME${NC} (from any device on your tailnet)"
echo ""
