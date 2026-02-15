#!/bin/bash

# FitMatch Reflect - Setup & Start Script

echo "🧹 Cleaning old builds..."
rm -rf node_modules .next

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting dev server..."
echo "📍 Open http://localhost:3000 in your browser"
echo ""
npm run dev
