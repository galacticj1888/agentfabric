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

INSTALL_DIR="${AGENTFABRIC_HOME:-$HOME/Desktop/Projects/agentfabric}"

# ── Step 1: Node.js ──────────────────────────────
echo "  [1/6] Checking Node.js..."
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
echo "  [2/6] Checking Claude Code..."
if ! command -v claude &> /dev/null; then
    echo "  Claude Code not found. Installing now..."
    npm install -g @anthropic-ai/claude-code
fi
echo "  ✓ Claude Code installed"

# ── Step 3: Git ──────────────────────────────────
echo "  [3/6] Checking Git..."
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
echo "  [4/6] Getting AgentFabric..."
if [ -d "$INSTALL_DIR/.git" ]; then
    echo "  Found existing install. Updating main..."
    cd "$INSTALL_DIR"
    git fetch origin --quiet
    git checkout --quiet main 2>/dev/null || git checkout --quiet -B main origin/main
    git reset --hard origin/main --quiet
else
    echo "  Cloning AgentFabric..."
    mkdir -p "$(dirname "$INSTALL_DIR")"
    git clone --quiet --branch main --single-branch https://github.com/galacticj1888/agentfabric.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi
echo "  ✓ AgentFabric ready at $INSTALL_DIR"

# ── Step 5: Install dependencies ─────────────────
echo "  [5/6] Installing dependencies..."
cd "$INSTALL_DIR"
npm install --silent || { echo "  ✗ npm install failed. Check your network connection."; exit 1; }
echo "  ✓ Dependencies installed"

echo "  [6/6] Building TypeScript..."
npm run build --silent || { echo "  ✗ Build failed."; exit 1; }
echo "  ✓ Build complete"

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
