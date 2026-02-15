#!/bin/bash

echo "🚀 Installing Replicate package..."
npm install

echo "✅ Dependencies installed. Starting dev server on http://localhost:3000"
echo ""
echo "Once running:"
echo "1. Go to http://localhost:3000"
echo "2. Fill in the form:"
echo "   - Context: 'Weekend casual wear'"
echo "   - Values: 'comfort and sustainability'"
echo "3. Click 'Analyze'"
echo "4. Check browser console for errors (F12)"
echo ""

npm run dev
