"use client";

import { CommonIndicators, IndicatorMatch } from './interfaces';

// Comprehensive scam indicators organized by category
export const commonIndicators: CommonIndicators = {
  // Urgency Tactics
  "Urgent action required": {
    patterns: ["urgent", "immediate", "act now", "expire", "deadline", "limited time", "running out of time", "must respond", "24 hours", "few hours left", "time sensitive", "act fast", "hurry", "quick action", "promptly", "only today"],
    severity: 3,
    detected: false
  },
  
  // Link Manipulation
  "Shortened URL": {
    patterns: ["bit.ly", "goo.gl", "tinyurl", "t.co", "short url", "shortened link", "click here", "click this link", "follow this url", "redirect", "tiny.cc", "ow.ly", "is.gd", "buff.ly"],
    severity: 4,
    detected: false
  },
  "Suspicious domain": {
    patterns: [".xyz", ".online", ".site", ".info", "strange url", "unusual domain", "misspelled domain", "lookalike domain", "resembles official", ".co ((?!m).)*$"],
    severity: 4, 
    detected: false
  },
  "Misleading link": {
    patterns: ["click to validate", "click to verify", "click to restore", "click to unlock", "click to continue", "download now", "install now"],
    severity: 4,
    detected: false
  },
  
  // Data Collection
  "Request for personal data": {
    patterns: ["personal information", "credit card", "bank details", "password", "login", "social security", "credentials", "account number", "cvv", "pin number", "security questions", "answer verification", "card information", "banking details", "payment details", "send photo", "selfie", "identity verification", "id card", "verify your identity"],
    severity: 5,
    detected: false
  },
  "Financial information request": {
    patterns: ["bank account", "credit card number", "payment info", "financial", "transaction", "banking", "wire transfer", "transfer money", "gcash", "maya", "paymaya", "paypal", "western union", "money gram"],
    severity: 5,
    detected: false
  },
  
  // Financial Incentives
  "Too good to be true": {
    patterns: ["prize", "winner", "won", "lottery", "gift", "free", "million", "reward", "claim your", "bonus", "cash prize", "jackpot", "congratulations", "lucky winner", "lump sum", "special offer", "exclusive deal", "unclaimed", "inheritance", "big money"],
    severity: 4,
    detected: false
  },
  "Investment opportunity": {
    patterns: ["investment", "high return", "guaranteed profit", "double your", "crypto", "bitcoin", "multiply your money", "passive income", "get rich", "financial freedom", "trading opportunity", "trading bot", "trading platform", "investment scheme", "high yield", "risk-free", "forex", "stock investment"],
    severity: 4,
    detected: false
  },
  
  // Verification Issues
  "No verification": {
    patterns: ["no verification", "without verification", "no need to verify", "bypass", "easy money", "quick money", "easy cash", "no checks", "skip verification", "no security check", "no background check"],
    severity: 4,
    detected: false
  },
  "Fake verification": {
    patterns: ["security check", "account verification", "verify your account", "confirm your details", "authenticate your", "validate your", "verify your identity", "double check", "confirm your information", "needs verification", "one-time verification", "identity check"],
    severity: 4,
    detected: false
  },
  
  // Money Requests
  "Payment upfront": {
    patterns: ["advance fee", "deposit required", "payment first", "send money", "wire transfer", "processing fee", "handling fee", "small fee", "nominal fee", "administrative cost", "registration fee", "shipping fee", "clearance fee", "lawyer fee", "tax payment", "upfront payment", "pay now to", "gcash", "paynow"],
    severity: 5,
    detected: false
  },
  "Money laundering scheme": {
    patterns: ["transfer money", "move funds", "receive money", "deposit funds", "process payment", "money mule", "commission", "keep percentage", "handle transaction", "receive and forward", "reshipper", "package processor"],
    severity: 5,
    detected: false
  },
  
  // Trust Manipulation
  "Suspicious sender": {
    patterns: ["official", "bank", "support", "service", "admin", "security", "unusual email", "unfamiliar sender", "government", "tax authority", "tax office", "microsoft", "apple", "google", "amazon", "facebook", "netflix", "paypal", "customer service", "IT department", "help desk", "HR department"],
    severity: 3,
    detected: false
  },
  "Impersonation attempt": {
    patterns: ["ceo", "executive", "boss", "manager", "director", "supervisor", "president", "friend", "family", "relative", "cousin", "sibling", "parent", "child", "loved one", "acquaintance", "colleague", "trusted", "authority figure"],
    severity: 4,
    detected: false
  },
  
  // Text Quality Issues
  "Grammatical errors": {
    patterns: ["poor grammar", "spelling error", "typo", "badly written", "awkward language", "translation error", "broken english", "strange wording", "unusual phrasing", "odd language", "improper grammar", "language mistakes"],
    severity: 2,
    detected: false
  },
  "Excessive formality": {
    patterns: ["dear customer", "dear valued", "dear beneficiary", "dear user", "dear client", "dear account holder", "dear member", "to whom it may concern", "dear sir/madam", "greetings of the day", "esteemed customer"],
    severity: 2,
    detected: false
  },
  
  // Pressure Tactics
  "Threatening language": {
    patterns: ["threaten", "suspend", "block", "legal action", "lawsuit", "police", "risk", "danger", "warning", "terminate", "close account", "penalty", "fine", "restriction", "consequence", "violation", "limited access", "permanent ban", "criminal", "illegal activity", "unauthorized access", "reported"],
    severity: 4,
    detected: false
  },
  "Account issue": {
    patterns: ["account problem", "security breach", "verify account", "unusual activity", "suspicious login", "unauthorized access", "locked account", "account suspended", "account disabled", "security alert", "suspicious activity", "unusual login", "login attempt", "security warning"],
    severity: 3,
    detected: false
  },
  
  // Deception Tactics
  "Unexpected package": {
    patterns: ["package", "parcel", "delivery", "shipment", "courier", "tracking number", "undelivered", "failed delivery", "shipping issue", "customs", "delivery attempt", "waiting for pickup", "delivery fee", "import tax", "customs fee", "delivery service"],
    severity: 3,
    detected: false
  },
  "Job offer scam": {
    patterns: ["job offer", "employment", "work from home", "remote job", "flexible hours", "earn from home", "hiring", "position available", "job opportunity", "no experience", "easy job", "part-time", "full-time", "recruitment", "vacancy", "job opening", "high salary", "competitive pay"],
    severity: 4,
    detected: false
  },
  "Emotional manipulation": {
    patterns: ["help me", "desperate", "trapped", "emergency", "accident", "hospital", "urgent help", "medical emergency", "life or death", "tragedy", "disaster", "crisis", "emotional appeal", "plea for help", "charitable", "donation", "funding", "support needed", "poverty"],
    severity: 3,
    detected: false
  },
  "Confidentiality request": {
    patterns: ["keep this private", "confidential", "secret", "don't tell", "between us", "discreet", "quiet", "hidden", "concealed", "no one should know", "don't share this", "tell no one", "private matter", "classified information"],
    severity: 4,
    detected: false
  },
  
  // Technical Deception
  "Attachment threat": {
    patterns: ["attachment", "download", "open file", "view document", "check document", "see attached", "review attached", ".zip", ".exe", ".docx", ".pdf", ".apk", "macro", "enable content", "enable editing"],
    severity: 4,
    detected: false
  },
  "Tech support scam": {
    patterns: ["technical support", "virus", "malware", "infection", "computer problem", "security issue", "computer alert", "microsoft support", "apple support", "system error", "remote access", "tech help", "PC repair", "system scan"],
    severity: 4,
    detected: false
  },
  
  // Philippines-Specific Scams
  "Remittance scam": {
    patterns: ["gcash", "paymaya", "maya", "cebuana", "palawan", "remittance", "padala", "western union", "mlhuillier", "money transfer", "send load", "pera padala", "cash pickup", "ofw", "overseas", "abroad", "pamilya", "kamag-anak"],
    severity: 5,
    detected: false
  },
  "Government impersonation": {
    patterns: ["dole", "dswd", "sss", "philhealth", "pag-ibig", "bir", "nbi", "police", "pulis", "government", "ayuda", "assistance", "benefit", "relief", "subsidy", "voucher", "certificate", "clearance", "license", "barangay", "philpost", "postal service"],
    severity: 4,
    detected: false
  },
  "Loan scam": {
    patterns: ["loan", "utang", "pautang", "low interest", "easy loan", "fast cash", "quick loan", "no collateral", "lending", "credit", "financing", "5-6", "sangla", "pawn", "approve", "disbursement", "cash loan"],
    severity: 4,
    detected: false
  },
  "Text and call scam": {
    patterns: ["sim", "text", "message", "call", "globe", "smart", "dito", "tm", "sun", "tnt", "load", "promo", "data", "points", "rewards", "winner", "subscriber", "subscriber"],
    severity: 3,
    detected: false
  }
};

/**
 * Creates a new copy of the indicators object
 * @returns A fresh copy of the indicators objects with reset detection flags
 */
export function getInitializedIndicators(): CommonIndicators {
  // Create a deep copy of the common indicators
  return JSON.parse(JSON.stringify(commonIndicators));
}

/**
 * Process content to detect scam indicators
 * @param content - The text content to analyze
 * @param indicatorsObj - The indicators object to update
 * @returns Object with detection results
 */
export function detectIndicators(content: string, indicatorsObj: CommonIndicators) {
  const patternMatches: Record<string, IndicatorMatch> = {};
  let totalSeverity = 0;
  let maxPossibleSeverity = 0;
  let detectedCount = 0;
  const lowerContent = content.toLowerCase();
  
  // Enhanced detection algorithm with confidence levels and pattern matching
  for (const [indicator, data] of Object.entries(indicatorsObj)) {
    maxPossibleSeverity += data.severity;
    let patternHits = 0;
    let totalPatterns = data.patterns.length;
    
    // Count how many patterns match
    for (const pattern of data.patterns) {
      // Use word boundary for more accurate matching when appropriate
      const patternToCheck = pattern.length > 3 ? 
        new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i') : 
        pattern.toLowerCase();
      
      if (typeof patternToCheck === 'object' && patternToCheck instanceof RegExp) {
        if (patternToCheck.test(lowerContent)) {
          patternHits++;
        }
      } else if (lowerContent.includes(patternToCheck)) {
        patternHits++;
      }
    }
    
    // Calculate confidence based on number of patterns matched
    const confidence = patternHits / totalPatterns;
    
    // Mark as detected with different thresholds based on severity
    const detectionThreshold = data.severity >= 4 ? 0.1 : 0.15;  // Higher severity needs fewer matches
    
    if (confidence >= detectionThreshold) {
      data.detected = true;
      data.confidence = confidence;
      data.matches = patternHits;
      patternMatches[indicator] = {
        severity: data.severity,
        confidence: confidence,
        matches: patternHits
      };
      
      // Add to total severity score (weighted by confidence)
      totalSeverity += data.severity * Math.min(1, confidence * 1.5); // Boost confidence a bit
      detectedCount++;
    }
  }
  
  return {
    patternMatches,
    totalSeverity,
    maxPossibleSeverity,
    detectedCount
  };
}

/**
 * Calculate risk percentage based on detected indicators
 * @param analysisResult - The analysis result from the API
 * @param detectionResult - The result of indicator detection
 * @param apiPercent - The percentage from the API
 * @returns Calculated risk percentage
 */
export function calculateRiskPercentage(
  patternMatches: Record<string, IndicatorMatch>,
  detectionResult: {
    totalSeverity: number;
    maxPossibleSeverity: number;
    detectedCount: number;
  },
  apiPercent: number
): number {
  const { totalSeverity, maxPossibleSeverity, detectedCount } = detectionResult;
  
  // Calculate our own risk percentage based on indicator severity
  let calculatedRiskPercentage = 0;
  if (maxPossibleSeverity > 0) {
    // Base calculation on severity of detected indicators
    calculatedRiskPercentage = Math.min(100, Math.round((totalSeverity / Math.max(28, maxPossibleSeverity * 0.3)) * 100));
    
    // Adjust based on number of indicators detected (more indicators = higher risk)
    if (detectedCount >= 5) calculatedRiskPercentage = Math.min(100, calculatedRiskPercentage + 15);
    else if (detectedCount >= 3) calculatedRiskPercentage = Math.min(100, calculatedRiskPercentage + 10);
    else if (detectedCount >= 2) calculatedRiskPercentage = Math.min(100, calculatedRiskPercentage + 5);
    
    // If high-severity indicators detected, ensure minimum risk level
    const hasHighSeverityIndicator = Object.values(patternMatches).some(m => m.severity >= 5);
    if (hasHighSeverityIndicator) calculatedRiskPercentage = Math.max(calculatedRiskPercentage, 75);
    
    // If financial data or payment requested, ensure higher risk
    const hasFinancialRequest = patternMatches["Request for personal data"] || 
                               patternMatches["Financial information request"] ||
                               patternMatches["Payment upfront"] ||
                               patternMatches["Remittance scam"];
    if (hasFinancialRequest) calculatedRiskPercentage = Math.max(calculatedRiskPercentage, 70);
  }
  
  // If no indicators detected but API reports high risk, set a baseline
  if (detectedCount === 0 && apiPercent > 50) {
    calculatedRiskPercentage = Math.max(calculatedRiskPercentage, 55);
  }
  // Blend our calculation with the API's report for a balanced assessment
  // Weight more toward our calculation if we found multiple indicators
  let finalRiskPercentage = detectedCount >= 3 ? 
    Math.round(calculatedRiskPercentage * 0.7 + apiPercent * 0.3) : 
    Math.round(calculatedRiskPercentage * 0.5 + apiPercent * 0.5);
  
  // Ensure consistency in risk threshold boundaries
  // So that we don't have a high risk label with a moderate percentage or vice versa
  if (finalRiskPercentage >= 48 && finalRiskPercentage < 50) finalRiskPercentage = 50; // Round up to high risk threshold
  if (finalRiskPercentage >= 73 && finalRiskPercentage < 75) finalRiskPercentage = 75; // Round up to very high risk threshold
  if (finalRiskPercentage >= 23 && finalRiskPercentage < 25) finalRiskPercentage = 25; // Round up to moderate risk threshold
  
  // Ensure we never have near-threshold values that might cause visual inconsistency
  if (finalRiskPercentage === 49) finalRiskPercentage = 48; // Ensure clear moderate risk (not borderline high)
  if (finalRiskPercentage === 74) finalRiskPercentage = 73; // Ensure clear high risk (not borderline very high)
  if (finalRiskPercentage === 24) finalRiskPercentage = 23; // Ensure clear low risk (not borderline moderate)
    
  return finalRiskPercentage;
}
