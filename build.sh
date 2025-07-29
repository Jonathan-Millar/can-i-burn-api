#!/bin/bash

# Vercel build script for can-i-burn-api
echo "🔥 Starting Vercel build for Can I Burn API..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running type checks..."
npm run typecheck

# Build TypeScript
echo "🏗️ Building TypeScript..."
npm run build

# Verify build output
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build output:"
    ls -la dist/
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "🚀 Ready for deployment!"