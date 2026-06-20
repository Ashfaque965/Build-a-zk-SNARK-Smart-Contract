#!/bin/bash

# Installation & Setup Script for zk-SNARK Age Proof
# Run this script to set up the entire project

set -e

echo "========================================="
echo "  zk-SNARK Age Proof Setup Script"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${BLUE}[1/6] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install Node.js v18+${NC}"
    echo "Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"
echo ""

# Check npm
echo -e "${BLUE}[2/6] Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm not found${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm ${NPM_VERSION} found${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}[3/6] Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Check Circom
echo -e "${BLUE}[4/6] Checking Circom installation...${NC}"
if ! command -v circom &> /dev/null; then
    echo -e "${YELLOW}⚠ Circom compiler not found in PATH${NC}"
    echo "• Download from: https://github.com/iden3/circom/releases"
    echo "• Windows: Download circom-v2.x.x.exe"
    echo "• Add to PATH and restart this script"
    echo ""
    read -p "Press Enter after installing Circom..."
    
    if ! command -v circom &> /dev/null; then
        echo -e "${RED}Circom still not found. Please install manually.${NC}"
        exit 1
    fi
fi

CIRCOM_VERSION=$(circom --version)
echo -e "${GREEN}✓ ${CIRCOM_VERSION}${NC}"
echo ""

# Compile circuit
echo -e "${BLUE}[5/6] Compiling Circom circuit...${NC}"
npm run circuit:compile
echo -e "${GREEN}✓ Circuit compiled${NC}"
echo ""

# Create setup directory structure
echo -e "${BLUE}[6/6] Setting up directories...${NC}"
mkdir -p zk_setup/build
mkdir -p powers_of_tau
echo -e "${GREEN}✓ Directories ready${NC}"
echo ""

echo "========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Download powers of tau (development):"
echo "   From: https://ceremony.hermez.io/download"
echo "   File: powersOfTau28_hez_final_12.ptau"
echo ""
echo "2. Run setup:"
echo "   npm run circuit:setup"
echo ""
echo "3. Generate proof:"
echo "   npm run circuit:proof"
echo ""
echo "4. Export verifier:"
echo "   npm run circuit:export"
echo ""
echo "5. Deploy contracts:"
echo "   npx hardhat node   (in one terminal)"
echo "   npm run deploy     (in another)"
echo ""
echo "6. Test verification:"
echo "   npm run verify-test"
echo ""
echo "========================================="
