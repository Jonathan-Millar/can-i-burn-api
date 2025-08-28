#!/bin/bash

# Deno build script for can-i-burn-api
echo "🔥 Starting Deno build for Can I Burn API..."

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is not installed. Please install Deno first:"
    echo "   curl -fsSL https://deno.land/install.sh | sh"
    exit 1
fi

# Run type checking
echo "🔍 Running type checks..."
deno check src/main.ts

# Run linting
echo "🧹 Running linting..."
deno lint src/

# Run formatting check
echo "📐 Checking formatting..."
deno fmt --check src/

# Run tests
echo "🧪 Running tests..."
deno test --allow-net --allow-read --allow-env

echo "✅ Deno build completed successfully!"
echo "🚀 Ready for deployment!"

# Show how to run the application
echo ""
echo "To run the application:"
echo "  Development: deno task dev"
echo "  Production:  deno task start"
