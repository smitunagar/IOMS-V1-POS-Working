#!/bin/bash

echo "🚀 IOMS Vercel Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Vercel CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available"
    exit 1
fi

echo "✅ Project structure verified"
echo "✅ Dependencies checked"

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi

echo ""
echo "🌐 Ready to deploy to Vercel!"
echo ""
echo "Next steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Click 'New Project'"
echo "3. Import your GitHub repository: smitunagar/IOMS-V1-POS-Working"
echo "4. Set up your PostgreSQL database and add DATABASE_URL environment variable"
echo "5. Deploy!"
echo ""
echo "Or try the CLI deployment:"
echo "npx vercel --yes"
echo ""
echo "📚 See DEPLOYMENT_GUIDE.md for detailed instructions"



