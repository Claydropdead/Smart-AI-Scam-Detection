// Test script to verify caching functionality
const testCache = async () => {
  const baseUrl = 'http://localhost:3000/api/detect-scam';
  
  console.log('🧪 Testing cache functionality...\n');

  // Test 1: Check cache stats
  console.log('📊 Checking initial cache stats...');
  try {
    const statsResponse = await fetch(`${baseUrl}?action=stats`);
    const stats = await statsResponse.json();
    console.log('Initial stats:', stats);
  } catch (error) {
    console.error('Error checking stats:', error.message);
  }

  // Test 2: Make the same request twice to test caching
  const testContent = "Is this a scam: 'You have won $1,000,000! Click here to claim!'";
  
  console.log('\n🔍 Making first request (should be cache miss)...');
  const start1 = Date.now();
  try {
    const response1 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: testContent })
    });
    const result1 = await response1.json();
    const time1 = Date.now() - start1;
    console.log(`✅ First request completed in ${time1}ms`);
    console.log(`Risk detected: ${result1.isScam ? 'Yes' : 'No'}`);
  } catch (error) {
    console.error('Error in first request:', error.message);
  }

  console.log('\n🔍 Making second request (should be cache hit)...');
  const start2 = Date.now();
  try {
    const response2 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: testContent })
    });
    const result2 = await response2.json();
    const time2 = Date.now() - start2;
    console.log(`✅ Second request completed in ${time2}ms`);
    console.log(`Risk detected: ${result2.isScam ? 'Yes' : 'No'}`);
    console.log(`⚡ Speed improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('Error in second request:', error.message);
  }

  // Test 3: Check final cache stats
  console.log('\n📊 Checking final cache stats...');
  try {
    const statsResponse = await fetch(`${baseUrl}?action=stats`);
    const stats = await statsResponse.json();
    console.log('Final stats:', stats);
  } catch (error) {
    console.error('Error checking final stats:', error.message);
  }

  console.log('\n🎉 Cache test completed!');
};

// Run the test
testCache();
