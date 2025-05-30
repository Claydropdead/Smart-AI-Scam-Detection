# Test script specifically for massgrave.dev global caching
Write-Host "🧪 Testing Global Cache with massgrave.dev" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

$baseUrl = "http://localhost:3000/api/detect-scam"
$testDomain = "massgrave.dev"

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

# Clear cache to start fresh
Write-Host "🧹 Clearing cache to start fresh..." -ForegroundColor Cyan
Invoke-ApiRequest -Url "$baseUrl?action=clear" | Out-Null

# Test 1: Simulate User 1 analyzing massgrave.dev
Write-Host "`n👤 User 1: Analyzing massgrave.dev (expecting cache miss)..." -ForegroundColor Cyan
$requestBody = @{
    content = $testDomain
} | ConvertTo-Json

$startTime1 = Get-Date
$response1 = Invoke-ApiRequest -Url $baseUrl -Method "POST" -Body $requestBody
$endTime1 = Get-Date
$duration1 = ($endTime1 - $startTime1).TotalMilliseconds

if ($response1) {
    Write-Host "✅ User 1 completed in $([math]::Round($duration1, 0))ms" -ForegroundColor Green
    Write-Host "   Risk detected: $(if($response1.isScam) {'Yes'} else {'No'})" -ForegroundColor White
    Write-Host "   Analysis: $($response1.assessment)" -ForegroundColor Gray
}

# Check cache stats after first request
$stats1 = Invoke-ApiRequest -Url "$baseUrl?action=stats"
if ($stats1) {
    Write-Host "   📊 Cache: $($stats1.cache.size) entries, $($stats1.cache.hits) hits, $($stats1.cache.misses) misses" -ForegroundColor Yellow
}

# Test 2: Simulate User 2 analyzing the same domain
Write-Host "`n👤 User 2: Analyzing massgrave.dev (expecting cache hit)..." -ForegroundColor Cyan
Start-Sleep -Seconds 2  # Simulate time between different users

$startTime2 = Get-Date
$response2 = Invoke-ApiRequest -Url $baseUrl -Method "POST" -Body $requestBody
$endTime2 = Get-Date
$duration2 = ($endTime2 - $startTime2).TotalMilliseconds

if ($response2) {
    Write-Host "✅ User 2 completed in $([math]::Round($duration2, 0))ms" -ForegroundColor Green
    Write-Host "   Risk detected: $(if($response2.isScam) {'Yes'} else {'No'})" -ForegroundColor White
    
    # Verify responses are identical
    if ($response1.isScam -eq $response2.isScam -and $response1.assessment -eq $response2.assessment) {
        Write-Host "   ✅ Responses are identical (deterministic caching)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Responses differ (potential caching issue)" -ForegroundColor Red
    }
}

# Test 3: Simulate User 3 analyzing the same domain
Write-Host "`n👤 User 3: Analyzing massgrave.dev (expecting cache hit)..." -ForegroundColor Cyan
Start-Sleep -Seconds 1

$startTime3 = Get-Date
$response3 = Invoke-ApiRequest -Url $baseUrl -Method "POST" -Body $requestBody
$endTime3 = Get-Date
$duration3 = ($endTime3 - $startTime3).TotalMilliseconds

if ($response3) {
    Write-Host "✅ User 3 completed in $([math]::Round($duration3, 0))ms" -ForegroundColor Green
    Write-Host "   Risk detected: $(if($response3.isScam) {'Yes'} else {'No'})" -ForegroundColor White
}

# Final cache statistics
$finalStats = Invoke-ApiRequest -Url "$baseUrl?action=stats"
if ($finalStats) {
    Write-Host "`n📊 Final Cache Statistics:" -ForegroundColor Yellow
    Write-Host "   Cache size: $($finalStats.cache.size)/$($finalStats.cache.maxSize)" -ForegroundColor White
    Write-Host "   Hit rate: $($finalStats.cache.hitRate)%" -ForegroundColor White
    Write-Host "   Total requests: $($finalStats.cache.totalRequests)" -ForegroundColor White
    Write-Host "   Cache hits: $($finalStats.cache.hits)" -ForegroundColor Green
    Write-Host "   Cache misses: $($finalStats.cache.misses)" -ForegroundColor Red
}

# Performance analysis
Write-Host "`n📈 Performance Analysis:" -ForegroundColor Yellow
Write-Host "   User 1 (cache miss): $([math]::Round($duration1, 0))ms" -ForegroundColor White
Write-Host "   User 2 (cache hit):  $([math]::Round($duration2, 0))ms" -ForegroundColor White
Write-Host "   User 3 (cache hit):  $([math]::Round($duration3, 0))ms" -ForegroundColor White

if ($duration1 -gt 0 -and $duration2 -gt 0) {
    $improvement = [math]::Round((($duration1 - $duration2) / $duration1) * 100, 1)
    Write-Host "   ⚡ Speed improvement for subsequent users: $improvement%" -ForegroundColor Green
}

Write-Host "`n🌍 Global Cache Benefits:" -ForegroundColor Cyan
Write-Host "   • First user pays the 'AI analysis cost'" -ForegroundColor White
Write-Host "   • All subsequent users get instant results" -ForegroundColor White
Write-Host "   • Same domain = Same analysis for everyone" -ForegroundColor White
Write-Host "   • Massive cost savings on popular domains" -ForegroundColor White

Write-Host "`n🎉 Global caching test completed!" -ForegroundColor Green
