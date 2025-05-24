/**
 * Domain and URL analysis utilities for scam detection
 * Provides helper functions for analyzing URLs and verifying domain legitimacy
 */

/**
 * List of legitimate Filipino banking and financial institution domains
 */
export const legitimatePhilippineBanks: Record<string, string> = {
  "landbank.com": "Land Bank of the Philippines",
  "landbank.ph": "Land Bank of the Philippines",
  "lbp-remittance.com": "Land Bank of the Philippines",
  "bpi.com.ph": "Bank of the Philippine Islands",
  "bdo.com.ph": "Banco de Oro",
  "metrobank.com.ph": "Metropolitan Bank and Trust Company",
  "pnb.com.ph": "Philippine National Bank",
  "rcbc.com": "Rizal Commercial Banking Corporation",
  "securitybank.com": "Security Bank",
  "unionbankph.com": "UnionBank of the Philippines",
  "eastwestbanker.com": "EastWest Bank",
  "chinabank.ph": "China Banking Corporation",
  "psbank.com.ph": "Philippine Savings Bank",
  "maybank.com.ph": "Maybank Philippines",
  "bsp.gov.ph": "Bangko Sentral ng Pilipinas", 
  "gcash.com": "GCash",
  "paymaya.com": "PayMaya/Maya",
  "coins.ph": "Coins.ph",
  "philippinenationalbank.com": "Philippine National Bank",
  "pbcom.com.ph": "Philippine Bank of Communications",
  "robinsonsbank.com.ph": "Robinsons Bank"
};

/**
 * Suspicious URL patterns to detect phishing and scam attempts
 */
export const suspiciousUrlPatterns = [
  /bit\.ly/i, /tinyurl/i, /goo\.gl/i, /ow\.ly/i, // URL shorteners
  /\.(xyz|info|tk|ml|ga|cf|gq|top)/i, // Suspicious TLDs
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
  /bank.*\.(info|xyz|online|site|tk)/i, // Banks with unusual TLDs
  /secure.*-.*site/i, // Secure-site patterns
  /verify.*account/i, // Verification sites
  /sign.*in.*\.(com|net|org|info|xyz|online)/i, // Sign-in pages
  /authenticate/i, // Authentication pages
  /\.(com|net|org|ph)-[a-z0-9]+\./i, // Domain-dashes
  /([a-z0-9]+\.)+[a-z0-9]+\.[a-z0-9]+\.[a-z0-9]+/i, // Excessive subdomains
  /online.*banking/i, // Generic online banking
  /update.*account.*info/i, // Account update
  /security.*alert/i, // Security alerts
  /confirm.*identity/i, // Identity confirmation
  /account.*verification/i, // Account verification
  /limited.*access/i, // Limited access
  /suspended.*account/i // Suspended account
];

/**
 * Calculates the Levenshtein distance between two strings
 * Used for detecting typosquatting and domain spoofing attempts
 * 
 * @param a First string
 * @param b Second string
 * @returns Number representing edit distance (lower = more similar)
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i-1) === a.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1, // substitution
          matrix[i][j-1] + 1,   // insertion
          matrix[i-1][j] + 1    // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Helper function to clean a URL for comparison
 * Removes protocol, www, and extracts domain portion
 * 
 * @param url URL string to clean
 * @returns Cleaned domain string
 */
export function cleanUrlForComparison(url: string): string {
  return url.toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];
}

/**
 * Checks if a URL domain is a legitimate Filipino financial institution
 * 
 * @param url URL or domain to check
 * @returns Object with legitimacy information
 */
export function isLegitimateBankingDomain(url: string): {
  isLegitimate: boolean;
  institution?: string;
} {
  const cleanDomain = cleanUrlForComparison(url);
  const financialDomains = Object.keys(legitimatePhilippineBanks);
  
  // Check exact match
  if (financialDomains.includes(cleanDomain)) {
    return {
      isLegitimate: true,
      institution: legitimatePhilippineBanks[cleanDomain]
    };
  }
  
  // Check if domain is a subdomain of legitimate domain
  for (const domain of financialDomains) {
    if (cleanDomain.endsWith('.' + domain)) {
      return {
        isLegitimate: true,
        institution: legitimatePhilippineBanks[domain]
      };
    }
  }
  
  return { isLegitimate: false };
}

/**
 * Analyzes a URL for potential typosquatting or domain spoofing attempts
 * 
 * @param url URL to analyze
 * @returns Analysis information including potential matches and scores
 */
export function analyzeForSpoofing(url: string): {
  isPotentialSpoofing: boolean;
  targetDomain?: string;
  targetInstitution?: string;
  similarityScore?: number;
  technique?: string;
} {
  const cleanDomain = cleanUrlForComparison(url);
  const financialDomains = Object.keys(legitimatePhilippineBanks);
  
  for (const domain of financialDomains) {
    const domainBase = domain.split('.')[0];
    
    // Check for typosquatting using different techniques
    if (cleanDomain.includes(domainBase) && cleanDomain !== domain) {
      let technique = '';
      let similarityScore = 0;
      
      // Common typosquatting techniques
      if (cleanDomain.includes(domainBase + '-') || cleanDomain.includes('-' + domainBase)) {
        technique = 'dash-insertion';
        similarityScore = 0.8;
      } else if (cleanDomain.includes(domainBase + '.')) {
        technique = 'dot-insertion';
        similarityScore = 0.9;
      } else if (cleanDomain.startsWith(domainBase + '.')) {
        technique = 'tld-replacement';
        similarityScore = 0.7;
      } else {
        // Levenshtein distance for other cases
        const distance = levenshteinDistance(cleanDomain, domain);
        if (distance <= 2) {
          technique = 'character-substitution';
          // Calculate similarity score (0-1 range, higher means more similar)
          similarityScore = 1 - (distance / Math.max(domain.length, cleanDomain.length));
        } else {
          continue; // Not similar enough
        }
      }
      
      return {
        isPotentialSpoofing: true,
        targetDomain: domain,
        targetInstitution: legitimatePhilippineBanks[domain],
        similarityScore,
        technique
      };
    }
  }
  
  return { isPotentialSpoofing: false };
}

/**
 * Comprehensive URL analysis for scam detection
 * 
 * @param url URL string to analyze
 * @returns Complete analysis results
 */
export function analyzeUrl(url: string) {
  const cleanUrl = cleanUrlForComparison(url);
  
  // Check for legitimate financial domain
  const legitimacyCheck = isLegitimateBankingDomain(url);
  
  // Check for domain spoofing if not legitimate
  const spoofingCheck = !legitimacyCheck.isLegitimate ? 
    analyzeForSpoofing(url) : 
    { isPotentialSpoofing: false };
  
  // Check for suspicious patterns
  const hasSuspiciousPatterns = suspiciousUrlPatterns.some(pattern => pattern.test(url));
  
  return {
    originalUrl: url,
    cleanDomain: cleanUrl,
    isLegitimateDomain: legitimacyCheck.isLegitimate,
    institution: legitimacyCheck.institution,
    isPotentialSpoofing: spoofingCheck.isPotentialSpoofing,
    spoofingTarget: spoofingCheck.targetInstitution,
    spoofingTechnique: spoofingCheck.technique,
    spoofingSimilarityScore: spoofingCheck.similarityScore,
    hasSuspiciousPatterns,
    riskScore: calculateUrlRiskScore(legitimacyCheck, spoofingCheck, hasSuspiciousPatterns)
  };
}

/**
 * Calculates a risk score for a URL based on analysis results
 * Score ranges from 0 (safe) to 1 (high risk)
 */
function calculateUrlRiskScore(
  legitimacyCheck: {isLegitimate: boolean},
  spoofingCheck: {isPotentialSpoofing: boolean, similarityScore?: number},
  hasSuspiciousPatterns: boolean
): number {
  if (legitimacyCheck.isLegitimate) return 0;
  
  let score = 0;
  
  // Spoofing is a very strong indicator (0.7-0.9 depending on similarity)
  if (spoofingCheck.isPotentialSpoofing) {
    score += 0.7;
    if (spoofingCheck.similarityScore) {
      // Add up to 0.2 more based on similarity
      score += 0.2 * spoofingCheck.similarityScore;
    }
  }
  
  // Suspicious patterns add 0.5 to the score
  if (hasSuspiciousPatterns) {
    score += 0.5;
  }
  
  // Cap at 1.0
  return Math.min(score, 1.0);
}
