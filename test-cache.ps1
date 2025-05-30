# PowerShell script to test Smart AI Scam Detection caching
Write-Host "🧪 Testing Smart AI Scam Detection Cache Functionality" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

$baseUrl = "http://localhost:3000/api/detect-scam"
$testContent = "You have won $1,000,000! Click this link to claim your prize now!"

# Function to make HTTP requests
function Invoke-ApiRequest {
    param($Url, $Method = "GET", $Body = $null)
    
    try {
        $headers = @{"Content-Type" = "application/json"}
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
        }
        return $response
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Check initial cache stats
Write-Host "`n📊 Checking initial cache statistics..." -ForegroundColor Cyan
$initialStats = Invoke-ApiRequest -Url "$baseUrl?action=stats"
if ($initialStats) {
    Write-Host "Cache size: $($initialStats.cache.size)/$($initialStats.cache.maxSize)" -ForegroundColor White
    Write-Host "Hit rate: $($initialStats.cache.hitRate)%" -ForegroundColor White
    Write-Host "Total requests: $($initialStats.cache.totalRequests)" -ForegroundColor White
}

# Test 2: First request (should be cache miss)
Write-Host "`n🔍 Making first request (expecting cache miss)..." -ForegroundColor Cyan
$requestBody = @{
    content = $testContent
} | ConvertTo-Json

$startTime1 = Get-Date
$response1 = Invoke-ApiRequest -Url $baseUrl -Method "POST" -Body $requestBody
$endTime1 = Get-Date
$duration1 = ($endTime1 - $startTime1).TotalMilliseconds

if ($response1) {
    Write-Host "✅ First request completed in $([math]::Round($duration1, 0))ms" -ForegroundColor Green
    Write-Host "Risk detected: $(if($response1.isScam) {'Yes'} else {'No'})" -ForegroundColor White
    Write-Host "Risk level: $($response1.riskLevel)" -ForegroundColor White
}

# Test 3: Second request (should be cache hit)
Write-Host "`n🔍 Making second identical request (expecting cache hit)..." -ForegroundColor Cyan
Start-Sleep -Seconds 1  # Small delay to ensure distinct timing

$startTime2 = Get-Date
$response2 = Invoke-ApiRequest -Url $baseUrl -Method "POST" -Body $requestBody
$endTime2 = Get-Date
$duration2 = ($endTime2 - $startTime2).TotalMilliseconds

if ($response2) {
    Write-Host "✅ Second request completed in $([math]::Round($duration2, 0))ms" -ForegroundColor Green
    Write-Host "Risk detected: $(if($response2.isScam) {'Yes'} else {'No'})" -ForegroundColor White
    
    # Calculate performance improvement
    if ($duration1 -gt 0 -and $duration2 -gt 0) {
        $improvement = [math]::Round((($duration1 - $duration2) / $duration1) * 100, 1)
        Write-Host "⚡ Performance improvement: $improvement%" -ForegroundColor Yellow
        
        if ($improvement -gt 50) {
            Write-Host "🎉 Caching is working effectively!" -ForegroundColor Green
        }
    }
}

# Test 4: Check final cache stats
Write-Host "`n📊 Checking final cache statistics..." -ForegroundColor Cyan
$finalStats = Invoke-ApiRequest -Url "$baseUrl?action=stats"
if ($finalStats) {
    Write-Host "Cache size: $($finalStats.cache.size)/$($finalStats.cache.maxSize)" -ForegroundColor White
    Write-Host "Hit rate: $($finalStats.cache.hitRate)%" -ForegroundColor White
    Write-Host "Total requests: $($finalStats.cache.totalRequests)" -ForegroundColor White
    Write-Host "Cache hits: $($finalStats.cache.hits)" -ForegroundColor Green
    Write-Host "Cache misses: $($finalStats.cache.misses)" -ForegroundColor Red
}

# Test 5: Test different content (should be cache miss)
Write-Host "`n🔍 Testing different content (expecting cache miss)..." -ForegroundColor Cyan
$differentContent = @{
    content = "This is a legitimate business email from our company."
} | ConvertTo-Json

$startTime3 = Get-Date
$response3 = Invoke-ApiRequest -Url $baseUrl -Method "POST" -Body $differentContent
$endTime3 = Get-Date
$duration3 = ($endTime3 - $startTime3).TotalMilliseconds

if ($response3) {
    Write-Host "✅ Different content request completed in $([math]::Round($duration3, 0))ms" -ForegroundColor Green
    Write-Host "Risk detected: $(if($response3.isScam) {'Yes'} else {'No'})" -ForegroundColor White
}

Write-Host "`n🎉 Cache testing completed!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green

# Display summary
Write-Host "`n📋 Test Summary:" -ForegroundColor Yellow
Write-Host "• Request 1 (cache miss): $([math]::Round($duration1, 0))ms" -ForegroundColor White
Write-Host "• Request 2 (cache hit): $([math]::Round($duration2, 0))ms" -ForegroundColor White
Write-Host "• Request 3 (different content): $([math]::Round($duration3, 0))ms" -ForegroundColor White

if ($finalStats) {
    Write-Host "`n📈 Cache Performance:" -ForegroundColor Yellow
    Write-Host "• Cache hit rate: $($finalStats.cache.hitRate)%" -ForegroundColor White
    Write-Host "• Entries stored: $($finalStats.cache.size)" -ForegroundColor White
}

Write-Host "`n💡 To clear the cache, run:" -ForegroundColor Cyan
Write-Host "Invoke-RestMethod -Uri '$baseUrl?action=clear'" -ForegroundColor Gray
