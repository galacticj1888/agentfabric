#!/bin/bash
#
# AgentFabric Setup
#
# Paste this in your terminal:
#   curl -fsSL https://raw.githubusercontent.com/galacticj1888/agentfabric/main/setup.sh | bash
#

set -e

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║         AgentFabric Setup            ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

INSTALL_DIR="$HOME/Desktop/Projects/agentfabric"

# ── Step 1: Node.js ──────────────────────────────
echo "  [1/5] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo ""
    echo "  Node.js is not installed. Installing now..."
    if command -v brew &> /dev/null; then
        brew install node
    else
        echo ""
        echo "  ✗ Can't auto-install Node.js (Homebrew not found)."
        echo ""
        echo "    Install Homebrew first:"
        echo "      /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        echo ""
        echo "    Then run this setup script again."
        exit 1
    fi
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "  Node.js v$NODE_VERSION found, need v22+. Updating..."
    if command -v brew &> /dev/null; then
        brew install node
    else
        echo ""
        echo "  ✗ Can't auto-update Node.js. Please install Node 22+ from https://nodejs.org"
        exit 1
    fi
fi
echo "  ✓ Node.js $(node -v)"

# ── Step 2: Claude Code ──────────────────────────
echo "  [2/5] Checking Claude Code..."
if ! command -v claude &> /dev/null; then
    echo "  Claude Code not found. Installing now..."
    npm install -g @anthropic-ai/claude-code
fi
echo "  ✓ Claude Code installed"

# ── Step 3: Git ──────────────────────────────────
echo "  [3/5] Checking Git..."
if ! command -v git &> /dev/null; then
    echo "  Git not found. Installing now..."
    if command -v brew &> /dev/null; then
        brew install git
    else
        echo "  ✗ Please install Git: https://git-scm.com/downloads"
        exit 1
    fi
fi
echo "  ✓ Git installed"

# ── Step 4: Clone or update repo ─────────────────
echo "  [4/5] Getting AgentFabric..."
if [ -d "$INSTALL_DIR/.git" ]; then
    echo "  Found existing install. Pulling latest..."
    cd "$INSTALL_DIR"
    git pull origin main --quiet 2>/dev/null || true
    LATEST_TAG=$(git describe --tags --abbrev=0 origin/main 2>/dev/null || echo "")
    if [ -n "$LATEST_TAG" ]; then
        git checkout --quiet "$LATEST_TAG"
        echo "  ✓ Updated to release $LATEST_TAG"
    fi
else
    echo "  Cloning AgentFabric..."
    mkdir -p "$(dirname "$INSTALL_DIR")"
    git clone --quiet https://github.com/galacticj1888/agentfabric.git "$INSTALL_DIR"
    # Pin to latest release tag (if any)
    LATEST_TAG=$(cd "$INSTALL_DIR" && git describe --tags --abbrev=0 origin/main 2>/dev/null || echo "")
    if [ -n "$LATEST_TAG" ]; then
        cd "$INSTALL_DIR" && git checkout --quiet "$LATEST_TAG"
        echo "  ✓ Pinned to release $LATEST_TAG"
    fi
    cd "$INSTALL_DIR"
fi
echo "  ✓ AgentFabric ready at $INSTALL_DIR"

# ── Step 5: Install dependencies ─────────────────
echo "  [5/5] Installing dependencies..."
cd "$INSTALL_DIR"
npm install --silent 2>/dev/null
echo "  ✓ Dependencies installed"

# ── Done ─────────────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║            All set!                  ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  Now run this:"
echo ""
echo "    cd $INSTALL_DIR && claude"
echo ""
echo "  AgentFabric will walk you through the"
echo "  rest of the setup automatically."
echo ""
echo "  ┌──────────────────────────────────────┐"
echo "  │         Terminal Cheat Sheet          │"
echo "  ├──────────────────────────────────────┤"
echo "  │  Cmd+T          New tab              │"
echo "  │  Cmd+Delete     Clear current line   │"
echo "  │  Cmd+K          Clear screen         │"
echo "  │  Up arrow       Previous command     │"
echo "  │  Tab             Auto-complete        │"
echo "  │  cd [folder]    Go to a folder       │"
echo "  │  ls              List files            │"
echo "  └──────────────────────────────────────┘"
echo ""
