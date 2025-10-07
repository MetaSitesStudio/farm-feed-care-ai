#!/bin/bash
# Netlify build script with fallbacks

echo "Starting Farm Feed & Care AI build..."

# Install dependencies
echo "Installing dependencies..."
npm ci --legacy-peer-deps

# Try primary build method
echo "Attempting standard build..."
if npm run build; then
    echo "Standard build successful!"
    exit 0
fi

# Fallback build method
echo "Standard build failed, trying fallback..."
if node node_modules/vite/bin/vite.js build; then
    echo "Fallback build successful!"
    exit 0
fi

# Final fallback with npx
echo "Fallback build failed, trying npx..."
if npx vite build; then
    echo "NPX build successful!"
    exit 0
fi

echo "All build methods failed!"
exit 1