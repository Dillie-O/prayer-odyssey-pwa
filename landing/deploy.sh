#!/bin/bash

# Prayer Odyssey Landing Page Deployment Script
# This script helps deploy the landing page to various platforms

echo "🚀 Prayer Odyssey Landing Page Deployment"
echo "=========================================="

# Check if we're in the landing directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Please run this script from the landing directory."
    exit 1
fi

echo "✅ Landing page files found:"
ls -la

echo ""
echo "🌐 Choose your deployment method:"
echo "1) Netlify (drag & drop to netlify.com)"
echo "2) Vercel (requires vercel CLI)"
echo "3) Serve locally for testing"
echo "4) Exit"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📋 Netlify Deployment Instructions:"
        echo "1. Go to https://netlify.com"
        echo "2. Drag & drop this entire landing folder onto the deploy area"
        echo "3. Your site will be live instantly with a random URL"
        echo "4. You can customize the domain in Netlify settings"
        echo ""
        echo "🔗 Direct link: https://app.netlify.com/drop"
        ;;
    2)
        echo ""
        echo "📋 Vercel Deployment:"
        if command -v vercel &> /dev/null; then
            echo "✅ Vercel CLI found. Deploying..."
            vercel --prod
        else
            echo "❌ Vercel CLI not found. Install it first:"
            echo "npm install -g vercel"
            echo "Then run this script again."
        fi
        ;;
    3)
        echo ""
        echo "🔧 Starting local server..."
        if command -v python3 &> /dev/null; then
            echo "✅ Using Python 3 server on http://localhost:8000"
            python3 -m http.server 8000
        elif command -v python &> /dev/null; then
            echo "✅ Using Python server on http://localhost:8000"
            python -m SimpleHTTPServer 8000
        elif command -v npx &> /dev/null; then
            echo "✅ Using npx serve on http://localhost:3000"
            npx serve .
        else
            echo "❌ No suitable server found. Please install Python or Node.js"
        fi
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
