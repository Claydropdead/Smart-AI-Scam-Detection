# Smart AI Scam Detection - Caching System

## Overview
The Smart AI Scam Detection API now includes an intelligent caching system that significantly improves performance and reduces API costs by storing and reusing analysis results for identical queries.

## How It Works

### Cache Key Generation
The system generates unique cache keys based on:
- **Text content** (trimmed and normalized)
- **Image presence** (boolean flag)
- **Audio presence** (boolean flag)  
- **Content hashes** (SHA-256 hash of binary data for images/audio)

### Cache Features
- **24-hour TTL** (Time To Live) for cached responses
- **1000 entry limit** with automatic cleanup of oldest entries
- **Deterministic responses** with temperature=0 ensuring identical results
- **Hit rate tracking** for performance monitoring
- **Memory-efficient** storage with binary content hashing

### Cache Management Endpoints

#### Get Cache Statistics
```bash
GET /api/detect-scam?action=stats
```
Returns:
- Current cache size
- Maximum cache size
- Hit rate percentage
- Total requests served
- Cache hits and misses

#### Clear Cache
```bash
GET /api/detect-scam?action=clear
```
Clears all cached entries and resets statistics.

#### Reset Statistics
```bash
GET /api/detect-scam?action=reset-stats
```
Resets hit/miss counters without clearing cached data.

### Performance Benefits

#### Speed Improvements
- **Cache Hit**: ~50-200ms response time
- **Cache Miss**: ~2000-5000ms response time (full AI analysis)
- **Average speedup**: 90-95% for repeated queries

#### Cost Savings
- **Eliminates duplicate API calls** to Gemini AI
- **Reduces server load** and computational overhead
- **Improves user experience** with faster responses

### Cache Behavior Examples

#### Same Content (Cache Hit)
```javascript
// First request - Cache Miss (slower)
POST /api/detect-scam
{ "content": "You won $1M! Click here!" }
// Response time: ~3000ms

// Second request - Cache Hit (faster)
POST /api/detect-scam  
{ "content": "You won $1M! Click here!" }
// Response time: ~100ms
```

#### Different Content (Cache Miss)
```javascript
// Request 1
POST /api/detect-scam
{ "content": "You won $1M! Click here!" }

// Request 2 - Different content
POST /api/detect-scam
{ "content": "Check this suspicious link..." }
// Both require full analysis
```

#### Image/Audio Content
```javascript
// Request with same text + same image = Cache Hit
POST /api/detect-scam
{ 
  "content": "Is this legit?",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..." 
}

// Request with same text + different image = Cache Miss
POST /api/detect-scam
{ 
  "content": "Is this legit?",
  "imageBase64": "data:image/jpeg;base64,/9j/4BBR..." 
}
```

### Testing Cache Performance

Run the included test script:
```bash
node test-cache.js
```

This will:
1. Check initial cache statistics
2. Make identical requests to test caching
3. Show performance improvements
4. Display final cache statistics

### Cache Maintenance

#### Automatic Cleanup
- **Expired entries** are removed when accessed
- **Periodic cleanup** occurs randomly (10% chance per cache write)
- **Size-based cleanup** removes oldest entries when limit exceeded

#### Manual Maintenance
Use the management endpoints for:
- Monitoring cache performance
- Clearing cache during development
- Resetting statistics for testing

### Best Practices

#### For Developers
- Monitor cache hit rates via `/api/detect-scam?action=stats`
- Clear cache during development: `/api/detect-scam?action=clear`
- Test identical queries to verify caching behavior

#### For Production
- Cache automatically handles TTL and cleanup
- No manual intervention required
- Monitor hit rates for performance insights

### Security Considerations

#### Data Privacy
- **No sensitive data** stored in cache keys (only content hashes)
- **Automatic expiration** ensures data doesn't persist indefinitely
- **Memory-only storage** (no disk persistence)

#### Cache Safety
- **Deterministic AI responses** ensure consistent results
- **Content normalization** prevents cache key manipulation
- **Size limits** prevent memory exhaustion

## Implementation Details

### Cache Structure
```typescript
interface CacheEntry {
  data: any;           // Cached response
  timestamp: number;   // Creation time
  ttl: number;        // Time to live (ms)
}
```

### Key Generation Algorithm
1. Normalize text content (trim whitespace)
2. Generate SHA-256 hashes for binary content
3. Create composite object with content + metadata
4. Generate SHA-256 hash of composite object as cache key

### Performance Monitoring
The system tracks:
- **Cache hits** vs **cache misses**
- **Hit rate percentage** over time
- **Cache size** and **utilization**
- **Automatic cleanup** operations

This caching system provides significant performance improvements while maintaining the accuracy and reliability of the AI-powered scam detection analysis.
