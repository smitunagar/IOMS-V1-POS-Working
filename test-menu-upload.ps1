# Test the enhanced menu upload API using curl
# This tests the quota handling and fallback mechanisms

echo "🧪 Testing Enhanced Menu Upload API with PowerShell..."
echo ""

# Check if test file exists
if (Test-Path "test_pdf_base64.txt") {
    echo "📄 Test file found: test_pdf_base64.txt"
    
    echo "🚀 Sending request to enhanced menu upload API..."
    echo ""
    
    # Make the API request using curl
    $response = curl -X POST http://localhost:3000/api/uploadMenu `
        -F "pdf=@test_pdf_base64.txt" `
        -H "Content-Type: multipart/form-data" `
        --silent `
        --show-error
    
    echo "📊 API Response:"
    echo $response | ConvertFrom-Json | ConvertTo-Json -Depth 10
    
} else {
    echo "❌ Test file not found: test_pdf_base64.txt"
    echo "Please ensure the test file exists in the current directory."
}

echo ""
echo "✅ Test completed!"
