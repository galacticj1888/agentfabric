#!/bin/bash
#
# AgentFabric Setup Script
# Run this in your terminal: curl -fsSL https://raw.githubusercontent.com/galacticj1888/agentfabric/main/setup.sh | bash
#
# Or if you already cloned the repo: bash setup.sh
#

set -e

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║         AgentFabric Setup            ║"
echo "  ║   Post-meeting automation for GTM    ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# Step 1: Check Node.js
echo "  [1/4] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo ""
    echo "  ✗ Node.js is not installed."
    echo ""
    echo "  Install it from: https://nodejs.org"
    echo "  Or with Homebrew: brew install node"
    echo ""
    echo "  Then run this script again."
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo ""
    echo "  ✗ Node.js $NODE_VERSION found, but AgentFabric needs Node 22+."
    echo ""
    echo "  Update with: brew install node"
    echo "  Or download from: https://nodejs.org"
    echo ""
    echo "  Then run this script again."
    exit 1
fi
echo "  ✓ Node.js $(node -v) found"

# Step 2: Check Claude Code
echo "  [2/4] Checking Claude Code..."
if ! command -v claude &> /dev/null; then
    echo ""
    echo "  ✗ Claude Code is not installed."
    echo ""
    echo "  Install it with: npm install -g @anthropic-ai/claude-code"
    echo ""
    echo "  Then run this script again."
    exit 1
fi
echo "  ✓ Claude Code found"

# Step 3: Clone or update repo
echo "  [3/4] Setting up AgentFabric..."
INSTALL_DIR="$HOME/Desktop/Projects/agentfabric"

if [ -d "$INSTALL_DIR" ]; then
    echo "  Found existing install at $INSTALL_DIR"
    cd "$INSTALL_DIR"
    git pull origin main --quiet 2>/dev/null || true
else
    echo "  Cloning to $INSTALL_DIR..."
    mkdir -p "$HOME/Desktop/Projects"
    git clone --quiet https://github.com/galacticj1888/agentfabric.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Step 4: Install dependencies
echo "  [4/4] Installing dependencies..."
npm install --silent 2>/dev/null

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║          Setup Complete!             ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  Next step: Open Claude Code in the project folder."
echo ""
echo "  Run this in your terminal:"
echo ""
echo "    cd $INSTALL_DIR && claude"
echo ""
echo "  AgentFabric will automatically walk you through"
echo "  the rest of the setup when you open it."
echo ""
