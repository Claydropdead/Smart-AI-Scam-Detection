/**
 * Test cases for domain analysis utilities
 * Used for development purposes to verify domain verification logic
 */
import { 
  analyzeUrl, 
  isLegitimateBankingDomain, 
  analyzeForSpoofing, 
  levenshteinDistance, 
  cleanUrlForComparison,
  legitimatePhilippineBanks
} from './domainUtils';

/**
 * Sample URL sets for testing
 */
const legitimateUrls = [
  'https://www.landbank.com', 
  'https://www.bpi.com.ph/personal', 
  'https://online.bdo.com.ph/login',
  'https://www.securitybank.com/personal/accounts/savings-account/',
  'https://www.rcbc.com/transaction-banking',
  'www.pnb.com.ph',
  'gcash.com/login',
  'https://coins.ph/app/main'
];

const typosquattingUrls = [
  'https://landbank-online.com',  // dash insertion
  'landbank.ph.info',            // TLD addition
  'https://www.landbannk.com',    // character duplication
  'https://secure.lnadbank.com',  // character transposition
  'https://www.1andbank.com',     // character substitution
  'bpl.com.ph',                  // character transposition
  'www.bankophilippineislands.com.ph', // brand variation
  'https://bdo-secure.com',       // dash insertion
  'https://security-bank.com',    // dash insertion
  'gcassh.com'                    // character duplication
];

const phishingUrls = [
  'https://landbank.secure-login.xyz', 
  'https://login.bpi-secure.info/login.php',
  'https://verification.bdo-accounts.online',
  'http://www.pnb-ph.tk',
  'https://metrobank-secure.verification.site',
  'https://192.168.1.1/landbank.html',
  'https://gcash-support.ml'
];

/**
 * Run the test cases
 */
export function runDomainTests() {
  console.log('====== DOMAIN ANALYSIS TEST RESULTS ======');
  
  console.log('\n=== LEGITIMATE URLS ===');
  legitimateUrls.forEach(url => {
    const analysis = analyzeUrl(url);
    console.log(`URL: ${url}`);
    console.log(`Legitimate: ${analysis.isLegitimateDomain ? '✅ YES' : '❌ NO'}`);
    if (analysis.isLegitimateDomain) {
      console.log(`Institution: ${analysis.institution}`);
    }
    console.log(`Risk Score: ${analysis.riskScore.toFixed(2)}`);
    console.log('-----------------');
  });
  
  console.log('\n=== TYPOSQUATTING URLS ===');
  typosquattingUrls.forEach(url => {
    const analysis = analyzeUrl(url);
    console.log(`URL: ${url}`);
    console.log(`Legitimate: ${analysis.isLegitimateDomain ? '✅ YES' : '❌ NO'}`);
    console.log(`Spoofing: ${analysis.isPotentialSpoofing ? '⚠️ YES' : 'NO'}`);
    if (analysis.isPotentialSpoofing) {
      console.log(`Target: ${analysis.spoofingTarget}`);
      console.log(`Technique: ${analysis.spoofingTechnique}`);
      console.log(`Similarity: ${analysis.spoofingSimilarityScore?.toFixed(2)}`);
    }
    console.log(`Risk Score: ${analysis.riskScore.toFixed(2)}`);
    console.log('-----------------');
  });
  
  console.log('\n=== PHISHING URLS ===');
  phishingUrls.forEach(url => {
    const analysis = analyzeUrl(url);
    console.log(`URL: ${url}`);
    console.log(`Legitimate: ${analysis.isLegitimateDomain ? '✅ YES' : '❌ NO'}`);
    console.log(`Suspicious Patterns: ${analysis.hasSuspiciousPatterns ? '⚠️ YES' : 'NO'}`);
    console.log(`Risk Score: ${analysis.riskScore.toFixed(2)}`);
    console.log('-----------------');
  });
  
  console.log('\n====== TEST COMPLETE ======');
  
  return {
    legitimateTestCount: legitimateUrls.length,
    typosquattingTestCount: typosquattingUrls.length,
    phishingTestCount: phishingUrls.length
  };
}

// Export test URL sets for use in other modules
export const testUrls = {
  legitimate: legitimateUrls,
  typosquatting: typosquattingUrls,
  phishing: phishingUrls
};
