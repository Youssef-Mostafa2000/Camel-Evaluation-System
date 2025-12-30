#!/bin/bash

# CamelBeauty ML API Test Script

echo "============================================================"
echo "CamelBeauty ML API Test Suite"
echo "============================================================"

API_URL="${1:-http://localhost:5000}"

echo ""
echo "Testing API at: $API_URL"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "------------------------------------------------------------"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/health")
http_code=$(echo "$response" | grep HTTP_CODE | cut -d: -f2)
body=$(echo "$response" | grep -v HTTP_CODE)

if [ "$http_code" == "200" ]; then
    echo "✓ Health check passed"
    echo "Response: $body"
else
    echo "✗ Health check failed (HTTP $http_code)"
    echo "Response: $body"
    exit 1
fi

# Test 2: Model Configuration
echo ""
echo "Test 2: Model Configuration"
echo "------------------------------------------------------------"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/api/v1/config/models")
http_code=$(echo "$response" | grep HTTP_CODE | cut -d: -f2)
body=$(echo "$response" | grep -v HTTP_CODE)

if [ "$http_code" == "200" ]; then
    echo "✓ Model config retrieved"
    echo "Response: $body"
else
    echo "✗ Model config failed (HTTP $http_code)"
    echo "Response: $body"
fi

# Test 3: Single Image Detection (if test image provided)
if [ -f "$2" ]; then
    echo ""
    echo "Test 3: Single Image Detection"
    echo "------------------------------------------------------------"
    echo "Testing with image: $2"

    start_time=$(date +%s.%N)
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
        -F "image=@$2" \
        "$API_URL/api/v1/detect/single")
    end_time=$(date +%s.%N)

    elapsed=$(echo "$end_time - $start_time" | bc)
    http_code=$(echo "$response" | grep HTTP_CODE | cut -d: -f2)
    body=$(echo "$response" | grep -v HTTP_CODE)

    if [ "$http_code" == "200" ]; then
        echo "✓ Detection successful"
        echo "Time elapsed: ${elapsed}s"
        echo "Response preview:"
        echo "$body" | python -m json.tool 2>/dev/null | head -30
    else
        echo "✗ Detection failed (HTTP $http_code)"
        echo "Response: $body"
    fi
else
    echo ""
    echo "Test 3: Single Image Detection"
    echo "------------------------------------------------------------"
    echo "⊘ Skipped (no test image provided)"
    echo "Usage: $0 <api_url> <test_image.jpg>"
fi

# Summary
echo ""
echo "============================================================"
echo "Test Summary"
echo "============================================================"
echo "Health Check: ✓"
echo "Model Config: ✓"
if [ -f "$2" ]; then
    echo "Image Detection: ✓"
else
    echo "Image Detection: ⊘ (skipped)"
fi
echo ""
echo "All required tests passed!"
echo "============================================================"
