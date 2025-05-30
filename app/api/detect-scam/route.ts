import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// API key is now expected to be in an environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Construct the URL only if the API key is present
// Updated to use gemini-2.0-flash model for improved performance and capabilities
const GEMINI_API_URL = GEMINI_API_KEY ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}` : '';

// In-memory cache with TTL (Time To Live)
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly maxCacheSize = 1000; // Maximum number of cached entries
  private readonly cleanupThreshold = 0.8; // Clean up when cache reaches 80% capacity
  private readonly cleanupBatchSize = 0.2; // Remove 20% of entries during cleanup
  private cacheHits = 0;
  private cacheMisses = 0;
  private operationCount = 0; // Track operations for deterministic cleanup timing

  // Generate a hash key for the query parameters
  private generateKey(content: string, imageBase64?: string, audioBase64?: string): string {
    const data = {
      content: content.trim(),
      hasImage: !!imageBase64,
      hasAudio: !!audioBase64,
      // Include hashes of binary data to detect differences without storing full data
      imageHash: imageBase64 ? crypto.createHash('sha256').update(imageBase64).digest('hex').substring(0, 16) : null,
      audioHash: audioBase64 ? crypto.createHash('sha256').update(audioBase64).digest('hex').substring(0, 16) : null
    };
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  // Check if cache entry is still valid
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }
  // Clean up expired entries and manage cache size deterministically
  private cleanup(): void {
    const now = Date.now();
    let removedExpired = 0;
    
    // First pass: Remove all expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
        removedExpired++;
      }
    }
    
    console.log(`🧹 Removed ${removedExpired} expired entries from cache`);
    
    // Second pass: If cache is still over capacity, remove oldest entries
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      // Sort by timestamp (oldest first) for deterministic removal
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const entriesToRemove = this.cache.size - this.maxCacheSize;
      const removedEntries = entries.slice(0, entriesToRemove);
      
      removedEntries.forEach(([key]) => this.cache.delete(key));
      console.log(`🧹 Removed ${entriesToRemove} oldest entries to maintain cache size limit`);
    }
  }

  // Perform maintenance check - deterministic based on cache size and operation count
  private performMaintenanceCheck(): void {
    this.operationCount++;
    
    // Check if we need cleanup based on deterministic conditions
    const shouldCleanup = 
      this.cache.size >= Math.floor(this.maxCacheSize * this.cleanupThreshold) || // Cache is 80% full
      this.operationCount % 100 === 0; // Every 100 operations for regular maintenance
    
    if (shouldCleanup) {
      this.cleanup();
      console.log(`🧹 Deterministic cache cleanup performed (size: ${this.cache.size}/${this.maxCacheSize}, operations: ${this.operationCount})`);
    }
  }  // Get cached response
  get(content: string, imageBase64?: string, audioBase64?: string): any | null {
    const key = this.generateKey(content, imageBase64, audioBase64);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      this.cacheHits++;
      console.log('Cache hit for query:', content.substring(0, 100) + '...');
      // Perform maintenance check on every cache operation
      this.performMaintenanceCheck();
      return entry.data;
    }
    
    this.cacheMisses++;
    if (entry) {
      // Remove expired entry
      this.cache.delete(key);
    }
    
    // Perform maintenance check on every cache operation
    this.performMaintenanceCheck();
    return null;
  }  // Store response in cache
  set(content: string, data: any, imageBase64?: string, audioBase64?: string, ttl?: number): void {
    const key = this.generateKey(content, imageBase64, audioBase64);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    this.cache.set(key, entry);
    const contentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;
    console.log('💾 Cached response for query:', contentPreview);
    
    // Perform deterministic maintenance check after every set operation
    this.performMaintenanceCheck();
  }
  // Get cache statistics
  getStats(): { size: number; maxSize: number; hitRate: number; totalRequests: number; hits: number; misses: number } {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: Number(hitRate.toFixed(2)),
      totalRequests,
      hits: this.cacheHits,
      misses: this.cacheMisses
    };
  }  // Clear cache manually
  clear(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.operationCount = 0;
    console.log('Cache cleared and statistics reset');
  }

  // Reset statistics only
  resetStats(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.operationCount = 0;
    console.log('Cache statistics reset');
  }
}

// Global cache instance
const responseCache = new ResponseCache();

interface ReportAgency {
  name: string;
  link: string;
}

// Interface for limited context information
interface ContextInfo {
  type: string;
  details: string;
  recommendations: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ScamDetectionResponse {
  status: string; // e.g., "Low Risk Detected"
  assessment: string; // e.g., "Likely Not a Scam"
  scam_probability: string; // e.g., "10%"
  ai_confidence: string; // e.g., "High"
  explanation_english: string;
  explanation_tagalog: string;
  advice: string;
  how_to_avoid_scams: string[];
  where_to_report: ReportAgency[];
  what_to_do_if_scammed: string[]; // Steps to take if you've been scammed (English)
  what_to_do_if_scammed_tagalog: string[]; // Steps to take if you've been scammed (Tagalog)
  true_vs_false: string; // How to differentiate between true and false information (English)
  true_vs_false_tagalog: string; // How to differentiate between true and false information (Tagalog)
  image_analysis?: string; // Optional analysis of image content if provided
  audio_analysis?: string; // Optional analysis of audio content if provided
  keywords?: string[]; // Key scam indicators extracted from the analysis
  content_type?: string; // Type of content analyzed (text, image, audio)
  detection_timestamp?: string; // ISO timestamp of when detection was performed
  limited_context?: ContextInfo; // Information about limited context scenarios
  raw_gemini_response?: string; // For debugging
}

interface GeminiResponsePart {
  text: string;
}

interface GeminiResponseCandidate {
  content: {
    parts: GeminiResponsePart[];
    role: string;
  };
  // Add other candidate properties if needed, like finishReason, safetyRatings, etc.
}

interface GeminiApiResponse {
  candidates?: GeminiResponseCandidate[];
  // Add other top-level response properties if needed, like promptFeedback
}

// Map risk level to status
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mapRiskLevelToStatus(riskLevel: string): string {
  switch (riskLevel?.toLowerCase()) {
    case 'very high':
      return 'High Risk Detected';
    case 'high':
      return 'High Risk Detected';
    case 'medium':
      return 'Medium Risk Detected';
    case 'low':
      return 'Low Risk Detected';
    default:
      return 'Normal Conversation';
  }
}

// Extract keywords from text
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  const keywords: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Common scam-related keywords
  const scamKeywords = [
    'urgent', 'immediate', 'verify', 'account', 'banking', 'password',
    'prize', 'winner', 'lottery', 'investment', 'bitcoin', 'cryptocurrency',
    'gift card', 'payment', 'transfer', 'hack', 'suspicious', 'government',
    'bank', 'security', 'fraud', 'alert', 'access', 'limited time',
    'phishing', 'scam', 'warning', 'verify', 'social security', 'tax'
  ];
  
  scamKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  return keywords;
}

// Function for audio analysis with Gemini - updated to match the same pattern as text/image analysis
async function analyzeWithGeminiAudio(content: string, audioBase64: string, imageBase64?: string): Promise<any> {
  if (!GEMINI_API_URL) {
    throw new Error('Gemini API URL is not configured due to missing API key.');
  }  
  
  const prompt = `You are an elite cybersecurity, fraud detection, and risk assessment specialist with expertise in Philippine scams, global digital threats, and potentially harmful content. Your task is to thoroughly analyze the provided audio recording for any signs of scam, phishing, fraudulent activity, misinformation, dangerous content, or other potential risks. The user is likely in the Philippines and needs a comprehensive assessment of all potential hazards.

${content.trim() ? `Additional context provided by user: "${content}"` : "No additional text context provided by the user."}
${imageBase64 ? "An image has also been provided for analysis alongside the audio, which may provide additional context or supplementary information." : ""}

SPECIAL INSTRUCTIONS FOR AUDIO CONTENT ANALYSIS:
Analyze the audio content to assess its purpose, authenticity, and potential risks. Consider:

1. Voice characteristics: natural vs. synthetic speech patterns, emotional cues, accent authenticity
2. Communication intent: information sharing, persuasion, requesting action, soliciting information
3. Risk indicators: urgency, emotional manipulation, requests for personal/financial information, pressure tactics
4. Content credibility: factual consistency, verifiable claims, suspicious promises or threats
5. Cultural context: Filipino-specific references, targeting of vulnerable demographics
6. Technical assessment: audio quality, editing marks, background elements that provide context
7. Voice authenticity: AI-generated or edited speech detection, voice consistency throughout message

Conduct a comprehensive risk assessment of the audio with particular attention to scams and deception techniques common in the Philippines and Southeast Asia. Consider language patterns, urgency indicators, request types, technical elements, contextual red flags, psychological manipulation tactics, and potential harm vectors.

For all audio content, conduct a full-spectrum risk assessment:
- RISK IDENTIFICATION: Identify ALL potential risks - scams, phishing, fraud, misinformation, harmful content, malicious requests, privacy violations, etc.
- RISK PROBABILITY: Assess the likelihood of each identified risk using multiple indicators
- RISK SEVERITY: Evaluate the potential negative impact and consequences if the user engages with this content
- RISK URGENCY: Determine how immediately dangerous this content might be (immediate vs. latent risks)
- RISK CLASSIFICATION: Categorize the type of danger (financial, privacy, personal safety, misinformation, etc.)

Provide a structured JSON response with the following fields:

- "isRisky": boolean (true if the content contains ANY potential risks, scams, harmful elements, or misinformation, false only if completely safe).
- "riskCategories": array of strings (list all risk categories detected: "Scam", "Phishing", "Misinformation", "Privacy Risk", "Financial Risk", "Identity Theft Risk", "Manipulation", "Harmful Content", etc. If none, provide empty array).
- "overallRiskProbability": number (a percentage from 0 to 100 indicating the overall likelihood of ANY risk being present, being precise in your assessment).
- "scamProbability": number (a percentage from 0 to 100 indicating the likelihood of it being a scam specifically).
- "confidenceLevel": string (your confidence level in your overall assessment: "Low", "Medium", or "High", based on the quality and quantity of indicators present).
- "detailedRiskAnalysis": string (a comprehensive explanation of your findings in English, highlighting ALL potential risks. Clearly identify ALL red flags, linguistic patterns, technical indicators, suspicious elements, and potential harm vectors. Include your reasoning process for each risk identified. Format for readability with clear sections, paragraphs and bullet points as needed).
- "detailedRiskAnalysisTagalog": string (an accurate and natural-sounding Tagalog translation of the "detailedRiskAnalysis" that preserves all technical details but adapts to local context).
- "overallRiskLevel": string (categorize the HIGHEST risk detected based on probability AND severity: "Low", "Medium", "High", "Very High", or "Critical").
- "riskBreakdown": object with the following fields (analyze each major risk category separately):
    - "scamRisk": object with "level" (string), "probability" (number), "indicators" (array of strings)
    - "misinformationRisk": object with "level" (string), "probability" (number), "indicators" (array of strings)
    - "privacyRisk": object with "level" (string), "probability" (number), "indicators" (array of strings)
    - "technicalRisk": object with "level" (string), "probability" (number), "indicators" (array of strings)
    - "manipulationRisk": object with "level" (string), "probability" (number), "indicators" (array of strings)
    - "otherRisks": array of objects, each with "name" (string), "level" (string), "probability" (number), "indicators" (array of strings)
- "safetyAdvice": string (provide detailed, actionable safety advice in English specific to ALL risks identified).
- "contentClassification": object with the following fields:
    - "contentType": string (Classify what type of audio this is: phone call, voice message, advertisement, public announcement, educational content, etc.)
    - "contentPurpose": string (Detailed explanation of what this audio is trying to accomplish, including potential hidden purposes)
    - "audienceAnalysis": object with the following fields:
        - "targetAudience": string (Who is the target audience for this content)
        - "vulnerabilityFactors": array of strings (Specific factors that might make the target audience vulnerable)
        - "potentialImpact": string (The potential effect or harm this content could have on its audience)

- "audioAnalysis": string (Thorough analysis of the voice recording including transcription of key statements, analysis of voice characteristics, communication techniques employed, and linguistic pattern analysis)
- "contentVerification": string (A balanced perspective on how to verify or investigate the claims or information presented in the audio)
- "contentVerificationTagalog": string (A natural Tagalog translation of the content verification explanation)
- "contentDetails": object with the following fields:
    - "format": string (The format of the audio: conversation, monologue, interview, advertisement, etc.)
    - "speakers": number (Estimated number of distinct speakers in the audio)
    - "languages": array of strings (Languages or dialects used in the audio)
    - "contentSummary": string (Concise summary of what the audio is about in plain language)
    - "voiceAuthenticity": object with the following fields:
        - "isLikelySynthetic": boolean (Whether the voice appears to be AI-generated or heavily edited)
        - "authenticityIndicators": array of strings (Evidence supporting your authenticity assessment)
        - "confidenceLevel": string (Confidence in your synthetic voice assessment: "Low", "Medium", or "High")

Ensure your entire response is ONLY the JSON object, with no additional text, comments, or markdown formatting like \`\`\`json ... \`\`\` around it. The JSON must be properly formatted with all string values properly escaped. Each required field must be present in your response even if some have minimal information due to audio limitations or ambiguity.`;  try {
    // Prepare the request body
    const requestBody: any = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0,
        topK: 1,
        topP: 0,
        maxOutputTokens: 8192,
        candidateCount: 1,
        stopSequences: [],
        responseMimeType: "application/json"
      }
    };

    // Add audio data to the request
    requestBody.contents[0].parts.push({
      inline_data: {
        mime_type: 'audio/webm', // Webm is the format we use for browser recordings
        data: audioBase64
      }
    });

    // If image is provided, add it to the request too
    if (imageBase64) {
      requestBody.contents[0].parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: imageBase64
        }
      });
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API Error Response for Audio Analysis:', errorBody);
      throw new Error(`Gemini API request failed with status ${response.status}: ${errorBody}`);
    }
    
    const data: GeminiApiResponse = await response.json();
    console.log('Gemini API Full Raw Response Object for Audio Analysis:', JSON.stringify(data, null, 2));
    
    // Extract the text content from the response
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      throw new Error('No text content found in Gemini response');
    }
    
    try {
      // Clean the text content to remove markdown backticks if present
      let cleanedTextContent = textContent.trim();
      if (cleanedTextContent.startsWith("```json")) {
        cleanedTextContent = cleanedTextContent.substring(7); // Remove ```json
      }
      if (cleanedTextContent.endsWith("```")) {
        cleanedTextContent = cleanedTextContent.substring(0, cleanedTextContent.length - 3); // Remove ```
      }
      cleanedTextContent = cleanedTextContent.trim(); // Trim any remaining whitespace

      // Parse the JSON response directly
      const jsonResponse = JSON.parse(cleanedTextContent);
      return jsonResponse;
    } catch (error) {
      console.error('Error parsing JSON from Gemini response:', error);
      throw new Error(`Failed to parse JSON from Gemini response: ${(error as Error).message}`);
    }

  } catch (error) {
    console.error('Error calling Gemini API for audio analysis:', error);
    throw error; // Re-throw the error to be caught by the POST handler
  }
}

async function analyzeWithGemini(content: string, imageBase64?: string): Promise<any> {  
  if (!GEMINI_API_URL) { // Check if the URL is empty (meaning API key was missing)
    throw new Error('Gemini API URL is not configured due to missing API key.');
  }    const prompt = `You are an elite cybersecurity, fraud detection, and risk assessment specialist with expertise in Philippine scams, global digital threats, and potentially harmful content. Your task is to thoroughly analyze the ${content.trim() ? "following text" : "provided image"} for any signs of scam, phishing, fraudulent activity, misinformation, dangerous content, or other potential risks. The user is likely in the Philippines and needs a comprehensive assessment of all potential hazards.

${content.trim() ? `Content to analyze: "${content}"` : "No text provided for analysis."}
${imageBase64 ? (content.trim() ? "An image has also been provided for analysis alongside the text." : "Only an image has been provided for analysis.") : ""}

SPECIAL INSTRUCTIONS FOR WEBSITE ANALYSIS AND RISK ASSESSMENT:
If the content appears to be a website URL or description of a website, provide an in-depth analysis including:
1. Website purpose identification - what the site claims to be for and its potential risks
2. Website legitimacy assessment - whether it appears to be what it claims with multiple verification points
3. Registration information analysis - domain age, ownership transparency, registration patterns that indicate risk
4. Content analysis - professional vs. suspicious elements, misleading information, dangerous content
5. Security indicators - https, certificates, privacy policies, data collection practices, permissions requested
6. Risk patterns analysis - comparison with known scam, phishing, and malicious website patterns
7. Target audience vulnerability assessment - why specific demographics might be at risk and impact level
8. Filipino-specific risk indicators - cultural, linguistic or regional factors that increase danger to local users
9. Technical risk assessment - potential malware, phishing infrastructure, suspicious redirects, data harvesting
10. Safe browsing recommendations specific to the identified risks
11. Content trustworthiness evaluation - accuracy, source credibility, factual consistency
12. Potential harm classification - financial, personal data, misinformation, illegal activities, malicious software

Conduct a comprehensive forensic analysis and risk assessment of the ${content.trim() ? "text" : "image"} with particular attention to all types of potential dangers including scams, misinformation, harmful content, privacy threats, technical vulnerabilities, and manipulation tactics prevalent in the Philippines and Southeast Asia. Consider language patterns, urgency indicators, request types, technical elements, contextual red flags, psychological manipulation tactics, and potential harm vectors. 

For all content, conduct a full-spectrum risk assessment:
- RISK IDENTIFICATION: Identify ALL potential risks - scams, phishing, fraud, misinformation, dangerous advice, harmful content, malicious links/software, privacy violations, etc.
- RISK PROBABILITY: Assess the likelihood of each identified risk using multiple indicators
- RISK SEVERITY: Evaluate the potential negative impact and consequences if the user engages with this content
- RISK URGENCY: Determine how immediately dangerous this content might be (immediate vs. latent risks)
- RISK CLASSIFICATION: Categorize the type of danger (financial, privacy, personal safety, misinformation, etc.)

For text content, especially analyze:
- CONTEXT PURPOSE: What is this text attempting to accomplish? Identify both stated and potential hidden purposes.
- CONTENT TYPE: Is this a message, email, website text, advertisement, news article, or something else?
- LANGUAGE ANALYSIS: Evaluate both English and Filipino language elements (Tagalog, Bisaya, etc.), including grammar, style, formality, and manipulation tactics
- TARGET IDENTIFICATION: Who is this content targeting and why? Assess vulnerability factors for the target audience
- CULTURAL ELEMENTS: Filipino-specific references, cultural touchpoints, or localized approaches that might be exploited
- TRUTH ASSESSMENT: Evaluate factual accuracy, source credibility, consistency, and potential misinformation
- REQUEST ANALYSIS: What is the content asking for? Identify explicit and implicit requests that pose risk
- TECHNICAL INDICATORS: Analyze URLs, formatting, technical elements for malicious components
- MANIPULATION TACTICS: Identify psychological tactics like urgency, authority abuse, scarcity, social proof, reciprocity
- THREAT MODELING: What would happen if a user fully trusted and acted on this content? Map potential harm vectors

For URLs and website descriptions, provide comprehensive explanation of what the website is for, whether it's legitimate, and what users should know about it in both English and Tagalog.

Provide a structured JSON response with the following fields:

- "isRisky": boolean (true if the content contains ANY potential risks, scams, harmful elements, or misinformation, false only if completely safe).
- "riskCategories": array of strings (list all risk categories detected: "Scam", "Phishing", "Misinformation", "Privacy Risk", "Malware", "Financial Risk", "Identity Theft Risk", "Manipulation", "Harmful Content", "Data Collection", etc. If none, provide empty array).
- "overallRiskProbability": number (a percentage from 0 to 100 indicating the overall likelihood of ANY risk being present, being precise in your assessment).
- "scamProbability": number (a percentage from 0 to 100 indicating the likelihood of it being a scam specifically).
- "confidenceLevel": string (your confidence level in your overall assessment: "Low", "Medium", or "High", based on the quality and quantity of indicators present).
- "detailedRiskAnalysis": string (a comprehensive explanation of your findings in English, highlighting ALL potential risks including scams, misinformation, harmful content, technical threats, manipulation tactics, etc. Clearly identify ALL red flags, linguistic patterns, technical indicators, suspicious elements, factual inaccuracies, and potential harm vectors. Include your reasoning process for each risk identified. Format for readability with clear sections, paragraphs and bullet points as needed).
- "detailedRiskAnalysisTagalog": string (an accurate and natural-sounding Tagalog translation of the "detailedRiskAnalysis" that preserves all technical details but adapts to local context).
- "overallRiskLevel": string (categorize the HIGHEST risk detected based on probability AND severity: "Low", "Medium", "High", "Very High", or "Critical").
- "riskBreakdown": object with the following fields (analyze each major risk category separately):
    - "scamRisk": object with "level" (string), "probability" (number), "indicators" (array of strings)
    - "misinformationRisk": object with "level" (string), "probability" (number), "indicators" (array of strings)
    - "privacyRisk": object with "level" (string), "probability" (number), "indicators" (array of strings)
    - "technicalRisk": object with "level" (string), "probability" (number), "indicators" (array of strings)
    - "manipulationRisk": object with "level" (string), "probability" (number), "indicators" (array of strings)
    - "otherRisks": array of objects, each with "name" (string), "level" (string), "probability" (number), "indicators" (array of strings)
- "safetyAdvice": string (provide detailed, actionable safety advice in English specific to ALL risks identified. For high risk scenarios, include specific protective actions the user should take immediately. For medium-low risk, provide contextual safety practices. Include both immediate steps and longer-term protective measures).
- "safetyTutorials": array of strings (provide 6-8 detailed, actionable tutorials in English on how to identify and protect against ALL types of risks identified. Each tutorial should be comprehensive yet concise, include the reasoning behind it, examples of what to look for, and be directly relevant to the specific risks in the analyzed content. Cover different risk categories - not just scams but also misinformation, harmful content, technical threats, etc. Tailor to the Philippine context when relevant).
- "preventionStrategies": object with the following fields (provide strategies for different risk types):
    - "scamPrevention": array of strings (specific strategies for avoiding scams)
    - "misinformationDefense": array of strings (methods to verify information accuracy)
    - "privacyProtection": array of strings (ways to safeguard personal information)
    - "technicalSafeguards": array of strings (technical measures to protect devices/accounts)
    - "generalSafetyPractices": array of strings (broader digital safety practices)
- "reportingInfo": object with the following fields:
    - "introduction": string (A detailed introduction in English on the importance of reporting ALL types of harmful content, the impact of reporting, and the general process. Include information on what evidence to gather before reporting different types of harmful content).
    - "agencies": array of objects, where each object has:
        - "name": string (The official name of the agency or organization, prioritizing Philippine agencies followed by relevant international bodies).
        - "riskTypes": array of strings (The types of risks this agency handles: "scams", "cybercrime", "misinformation", "harmful content", etc.)
        - "url": string (The direct URL to their complaint filing page or relevant information page. Verify this is a valid, working URL).
        - "description": string (A detailed description of which types of risks the agency handles, their jurisdiction, and any special reporting requirements or procedures. Prioritize agencies relevant to the Philippines).
- "contentEvaluation": string (Provide a detailed explanation in English on how to critically evaluate content safety and truthfulness, specifically related to the analyzed content. Include verification techniques for multiple risk dimensions - not just scams but also factual accuracy, source credibility, manipulation tactics, technical threats, etc. Include warning signs, critical thinking strategies, and content verification methods tailored to the specific types of risks identified. Use concrete examples where possible).
- "contentEvaluationTagalog": string (A natural, culturally-appropriate Tagalog translation of the "contentEvaluation" explanation that preserves all technical advice).
- "contentClassification": object with the following fields:
    - "contentType": string (Classify what type of content this is: website URL, social media post, SMS, email, advertisement, news, etc.)
    - "contentPurpose": string (Detailed explanation of what this content is trying to accomplish, including potential hidden purposes)
    - "audienceAnalysis": object with the following fields:
        - "targetAudience": string (Who is the target audience for this content)
        - "vulnerabilityFactors": array of strings (Specific factors that might make the target audience vulnerable)
        - "potentialImpact": string (The potential effect or harm this content could have on its audience)
    - "trustworthinessIndicators": object with the following fields:
        - "positiveIndicators": array of strings (Elements that suggest the content may be legitimate or trustworthy)
        - "negativeIndicators": array of strings (Elements that raise concerns about trustworthiness)
        - "overallAssessment": string (Final evaluation of content trustworthiness)
    - "contentExplanation": string (A concise yet thorough explanation of what this content is, its purpose, legitimacy concerns, and ALL potential risks in plain language that non-technical users will understand. For websites, include what the site is for and potential dangers)
    - "contentExplanationTagalog": string (A natural Tagalog translation of the content explanation that ordinary Filipino users can easily understand)
    - "riskSummary": string (A brief, clear summary of ALL risks identified that a user should be aware of before engaging with this content)

${imageBase64 ? "When analyzing the provided image, perform a comprehensive risk assessment including: digital manipulation indicators, inconsistent lighting/shadows, misaligned text elements, false/edited logos, suspicious QR codes, harmful URLs, malicious instructions, dangerous advice, manipulated documents, false health claims, misleading statistics/charts, hidden data, steganography, malicious code embedding attempts, tracking pixels, inappropriate material, personal data exposure, confidential information, and visual persuasion techniques. Pay special attention to text in the image for risk indicators in both English and Filipino/Tagalog." : ""}

Additional analysis instructions:
1. For borderline cases, err on the side of caution and provide more detailed warnings and verification steps.
2. If you identify a novel scam technique not widely documented, highlight this in your analysis.
3. If the content appears to be testing your capabilities rather than a real scam, still provide a thorough analysis as if it were a genuine submission.
4. If the content is extremely short or ambiguous, note the limitations in your confidence assessment but provide best-effort analysis.
5. For content in Filipino languages/dialects other than Tagalog, identify the language if possible and include this information in your analysis.
6. If you detect a question like "Para saan ito?" (What is this for?) or "Ano ito?" (What is this?), focus your analysis on explaining the nature and purpose of the content/website in simple, accessible language in both English and Tagalog.
7. For website URLs, perform deeper domain analysis to determine its purpose, registration history, and security status if possible.
8. Pay special attention to Filipino cultural context that might make certain scams more effective in the Philippines (remittance services, OFW targeting, local payment systems).
9. Provide practical, step-by-step advice for typical Filipino internet users who may have varying levels of technical knowledge.

Ensure your entire response is ONLY the JSON object, with no additional text, comments, or markdown formatting like \`\`\`json ... \`\`\` around it. The JSON must be properly formatted and all string values properly escaped. Each field must be present in your response even if some have minimal information due to the nature of the content.

Text to analyze:
"""
${content}
"""`;  try {
    // Prepare the request body
    const requestBody: any = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0,
        topK: 1,
        topP: 0,
        maxOutputTokens: 8192,
        candidateCount: 1,
        stopSequences: [],
        responseMimeType: "application/json"
      }
    };

    // If image is provided, add it to the request
    if (imageBase64) {
      requestBody.contents[0].parts.push({
        inline_data: {
          mime_type: 'image/jpeg', // Assuming JPEG format - adjust as needed
          data: imageBase64
        }
      });
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API Error Response:', errorBody);
      throw new Error(`Gemini API request failed with status ${response.status}: ${errorBody}`);
    }
    
    const data: GeminiApiResponse = await response.json();
    console.log('Gemini API Full Raw Response Object:', JSON.stringify(data, null, 2));
    
    // Extract the text content from the response
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      throw new Error('No text content found in Gemini response');
    }
    
    try {
      // Clean the text content to remove markdown backticks if present
      let cleanedTextContent = textContent.trim();
      if (cleanedTextContent.startsWith("```json")) {
        cleanedTextContent = cleanedTextContent.substring(7); // Remove ```json
      }
      if (cleanedTextContent.endsWith("```")) {
        cleanedTextContent = cleanedTextContent.substring(0, cleanedTextContent.length - 3); // Remove ```
      }
      cleanedTextContent = cleanedTextContent.trim(); // Trim any remaining whitespace

      // Parse the JSON response directly
      const jsonResponse = JSON.parse(cleanedTextContent);
      return jsonResponse;
    } catch (error) {
      console.error('Error parsing JSON from Gemini response:', error);
      throw new Error(`Failed to parse JSON from Gemini response: ${(error as Error).message}`);
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error; // Re-throw the error to be caught by the POST handler
  }
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.');
    return NextResponse.json({ message: 'API key not configured. Please contact support.' }, { status: 500 });
  }
  try {
    const body = await request.json();
    const { content, imageBase64, audioBase64 } = body;  // Accept optional image and audio data    
    
    // Allow content to be empty if an image or audio is provided
    if ((!content || typeof content !== 'string') && !imageBase64 && !audioBase64) {
      return NextResponse.json({ message: 'Either text content, image, or audio recording is required' }, { status: 400 });
    }
    
    // Use empty string if content is not provided but image/audio is
    const textContent = content || '';
      // Check cache first
    const cachedResponse = responseCache.get(textContent, imageBase64, audioBase64);
    if (cachedResponse) {
      console.log('✅ Returning cached response - skipping API call');
      return NextResponse.json(cachedResponse);
    }
    
    console.log('🔄 Cache miss - proceeding with API analysis');
    
    try {      let analysis;      if (audioBase64) {
        // Handle audio analysis using the same approach as text/image analysis
        analysis = await analyzeWithGeminiAudio(textContent, audioBase64, imageBase64);
        
        // Ensure we have proper mainExplanation and audioAnalysis fields for backward compatibility
        if (!analysis.mainExplanation && !analysis.audioAnalysis) {
          // If both are missing, use detailedRiskAnalysis from the general analysis
          analysis.mainExplanation = analysis.detailedRiskAnalysis || "Voice recording analysis: The content requires careful assessment for potential risks.";
          analysis.audioAnalysis = analysis.mainExplanation;
        } else if (!analysis.audioAnalysis) {
          // If only audioAnalysis is missing, copy from mainExplanation
          analysis.audioAnalysis = analysis.mainExplanation;
        } else if (!analysis.mainExplanation) {
          // If only mainExplanation is missing, copy from audioAnalysis
          analysis.mainExplanation = analysis.audioAnalysis;
        }
        
        // Make sure essential fields exist for consistent processing across all content types
        if (!analysis.detailedRiskAnalysis) {
          analysis.detailedRiskAnalysis = analysis.mainExplanation || analysis.audioAnalysis || 
            "Voice recording analyzed for potential scams and security risks.";
        }
        
        // Ensure Tagalog explanations exist
        if (!analysis.detailedRiskAnalysisTagalog) {
          analysis.detailedRiskAnalysisTagalog = "Pagsusuri sa voice recording: Ang nilalaman nito ay dapat suriin nang mabuti para sa mga posibleng panganib.";
        }
        
        // Make sure we have risk categories set
        if (!analysis.riskCategories || analysis.riskCategories.length === 0) {
          analysis.riskCategories = ["Communication Risk"]; 
        }
        
        // Ensure content classification exists (shared structure with text/image analysis)
        if (!analysis.contentClassification) {
          analysis.contentClassification = {};
        }
        
        // Set required content classification fields if not already provided by the API
        if (!analysis.contentClassification.contentType) {
          analysis.contentClassification.contentType = "Audio";
        }
        
        // Use the existing content purpose from the unified analysis
        if (!analysis.contentClassification.contentPurpose) {
          analysis.contentClassification.contentPurpose = analysis.contentPurpose || 
                                                          analysis.contentDetails?.contentSummary || 
                                                          "Voice communication";
        }
        
        // Set audience target using the unified analysis approach
        if (!analysis.contentClassification.audienceAnalysis) {
          analysis.contentClassification.audienceAnalysis = {};
        }
        
        if (!analysis.contentClassification.audienceAnalysis.targetAudience) {
          analysis.contentClassification.audienceAnalysis.targetAudience = analysis.audienceTarget || "General Filipino audience";
        }
      } else {
        // Standard text/image analysis
        analysis = await analyzeWithGemini(textContent, imageBase64);
      }
        // Format the response to match the expected interface, with contextual assessment
      // Generate assessment text based on risk level and probability
      const getAssessmentText = (isRisky: boolean, riskProb: number): string => {
        if (isRisky) {
          if (riskProb >= 75) return "Almost Certainly a Scam";
          if (riskProb >= 50) return "Likely a Scam";
          if (riskProb >= 25) return "Possibly Suspicious";
          return "Slightly Suspicious";
        }
        return "Likely Not a Scam";
      };        // Generate display status based on content type and risk level
      const getDisplayStatus = (contentType: string, overallRiskLevel: string): string => {
        // Don't include the risk level in the title - this will be shown by the risk percentage display
        let contentPrefix = contentType ? `${contentType} Analysis` : "Analysis Results";
        
        // For Audio specifically, always use "Voice Recording Analysis"
        if (contentType === "Audio") {
          contentPrefix = "Voice Recording Analysis";
        }
        
        return contentPrefix;
      };
      
      // Extract content type from analysis
      const contentType = analysis.contentClassification?.contentType || 
                          (content.includes("http") ? "Website" : 
                           imageBase64 ? "Image" : 
                           audioBase64 ? "Audio" : "Message");
      
      // Get risk categories in a readable format
      const riskCategories = analysis.riskCategories || [];
      
      // Generate contextual risk summary
      const getRiskSummary = (prob: number, categories: string[]): string => {
        if (prob < 25) return "✅ Safe content with no suspicious elements detected";
        if (prob >= 75) return "🔴 Dangerous content with multiple strong risk indicators";
        if (prob >= 50) return "🚨 Likely a scam with clear risk indicators";
        
        // For moderate risk, use more specific language based on category
        if (categories.includes("Misinformation")) 
          return "⚠️ Contains potentially misleading information";
        if (categories.includes("Privacy Risk"))
          return "⚠️ Potential privacy concerns identified";
        if (categories.includes("Manipulation"))
          return "⚠️ Shows signs of manipulation techniques";
        
        return "⚠️ Possibly suspicious but not clearly malicious";
      };
      
      // Get a list of the most important indicators for the frontend display
      const getDisplayIndicators = (): string[] => {
        const indicators: string[] = [];
        
        // Add scam risk indicators
        if (analysis.riskBreakdown?.scamRisk?.indicators?.length > 0) {
          const scamIndicators = analysis.riskBreakdown.scamRisk.indicators;
          indicators.push(...scamIndicators.slice(0, 2));
        }
        
        // Add other risk type indicators
        ['misinformationRisk', 'privacyRisk', 'technicalRisk', 'manipulationRisk'].forEach(riskType => {
          if (analysis.riskBreakdown?.[riskType]?.indicators?.length > 0) {
            const topIndicator = analysis.riskBreakdown[riskType].indicators[0];
            if (topIndicator && !indicators.includes(topIndicator)) {
              indicators.push(topIndicator);
            }
          }
        });
          // Add content-specific indicators
        if (contentType === "Website" && !indicators.some(i => i.includes("website"))) {
          indicators.push("Suspicious website characteristics");
        }
        
        // Add audio-specific indicators if we're processing audio content
        if (contentType === "Audio" && audioBase64 && !indicators.some(i => i.includes("voice") || i.includes("audio"))) {
          indicators.push("Voice communication analysis");
          
          // Add more specific indicators based on risk level
          if (analysis.overallRiskProbability >= 50) {
            indicators.push("Voice message manipulation tactics");
          }
        }
        
        // Ensure we have at least one indicator for risky content
        if (indicators.length === 0 && analysis.isRisky) {
          indicators.push("Suspicious patterns detected");
        }
        
        return indicators.slice(0, 5); // Limit to 5 indicators
      };
      
      const assessmentText = getAssessmentText(
        analysis.isRisky !== undefined ? analysis.isRisky : false, 
        analysis.overallRiskProbability || 0
      );
      
      const riskSummary = getRiskSummary(
        analysis.overallRiskProbability || 0,
        analysis.riskCategories || []
      );
      
      const formattedResponse = {
        // Required fields - make sure they are always present
        isScam: analysis.isRisky !== undefined ? analysis.isRisky : false,
        probability: analysis.overallRiskProbability !== undefined ? analysis.overallRiskProbability : 0,
        confidence: analysis.confidenceLevel || "Medium",
        explanation: analysis.detailedRiskAnalysis || "No detailed risk analysis available.",
        explanationTagalog: analysis.detailedRiskAnalysisTagalog || "Hindi available ang detalyadong pagsusuri ng panganib.",
        riskLevel: analysis.overallRiskLevel || "Low",
        advice: analysis.safetyAdvice || "No specific advice available.",
        tutorialsAndTips: analysis.safetyTutorials || 
          (analysis.preventionStrategies?.scamPrevention || 
           analysis.preventionStrategies?.generalSafetyPractices || []),

        // Contextual assessment fields
        status: getDisplayStatus(contentType, analysis.overallRiskLevel || "Low"),
        assessment: assessmentText,
        contentType: contentType,
        riskSummary: riskSummary,
        indicators: getDisplayIndicators(),
        detectedRiskCategories: riskCategories,        // Optional analysis fields - ensure audio analysis is always provided if audio was submitted
        audioAnalysis: audioBase64 ? (analysis.audioAnalysis || analysis.mainExplanation || "Audio content analyzed for potential risks and scam patterns.") : null,
        image_analysis: imageBase64 ? (analysis.imageAnalysis || analysis.contentClassification?.contentExplanation || null) : null,
        // Audience analysis for audio content specifically
        audienceAnalysis: audioBase64 ? (analysis.contentClassification?.audienceAnalysis?.targetAudience || "General audience") : null,
        // Audio-specific fields with enhanced descriptions
        keyPoints: audioBase64 ? (analysis.keyPoints || [
          "Voice recording analyzed for suspicious content patterns",
          analysis.overallRiskProbability > 50 ? "Contains elements of potential concern that require verification" : "No immediate high-risk elements detected",
          analysis.contentClassification?.contentPurpose ? `Purpose appears to be: ${analysis.contentClassification.contentPurpose}` : "Purpose is standard communication"
        ]) : null,
        
        // Voice authenticity information for audio content
        voiceAuthenticity: audioBase64 ? (analysis.contentDetails?.voiceAuthenticity || {
          isLikelySynthetic: false,
          authenticityIndicators: ["Standard analysis performed"],
          confidenceLevel: "Medium"
        }) : null,
        
        // Additional contextual fields
        contentPurpose: analysis.contentClassification?.contentPurpose || null,
        audienceTarget: analysis.contentClassification?.audienceAnalysis?.targetAudience || null,
          // Additional fields requested by users
        true_vs_false: analysis.contentEvaluation || analysis.contentVerification || null,
        true_vs_false_tagalog: analysis.contentEvaluationTagalog || analysis.contentVerificationTagalog || null,
        // Additional audio verification fields
        audioContentVerification: audioBase64 ? (analysis.contentVerification || analysis.contentEvaluation || null) : null,
        audioContentVerificationTagalog: audioBase64 ? (analysis.contentVerificationTagalog || analysis.contentEvaluationTagalog || null) : null,
        
        // Reporting information - include context-specific reporting advice
        complaintFilingInfo: {
          introduction: analysis.reportingInfo?.introduction || 
            `Report suspicious ${contentType.toLowerCase()} content to relevant authorities to protect yourself and others.`,
          agencies: analysis.reportingInfo?.agencies || 
            [
              {
                name: "Federal Trade Commission (FTC)",
                url: "https://www.consumer.ftc.gov/features/scam-alerts",
                description: "For reporting scams, identity theft, and fraudulent business practices in the US."
              },
              {
                name: "Internet Crime Complaint Center (IC3)",
                url: "https://www.ic3.gov",
                description: "For reporting internet-related criminal complaints in the US."
              }
            ]        }
      };
      
      // Cache the successful response before returning
      responseCache.set(textContent, formattedResponse, imageBase64, audioBase64);
      
      return NextResponse.json(formattedResponse, { status: 200 });
    } catch (processingError: any) {
      console.error('Error processing API response:', processingError);      // Provide a fallback response when the API call succeeds but formatting fails
      const contentType = content.includes("http") ? "Website" : 
                          imageBase64 ? "Image" : 
                          audioBase64 ? "Audio" : "Message";
                          
      return NextResponse.json({
        isScam: false,
        probability: 0,
        confidence: "Low",
        explanation: "We encountered an issue processing this content. Please try again or submit different content for analysis.",
        explanationTagalog: "May naganap na problema sa pagproseso ng nilalaman. Pakisubukang muli o magsumite ng ibang nilalaman para sa pagsusuri.",
        riskLevel: "Low",
        status: `${contentType}: Analysis Incomplete`,
        assessment: "Analysis Incomplete",
        contentType: contentType,
        riskSummary: "⚠️ Unable to complete risk assessment for this content",
        indicators: ["Processing error", "Analysis incomplete"],
        detectedRiskCategories: [],
        advice: `We recommend resubmitting your ${contentType.toLowerCase()} content for analysis.`,
        tutorialsAndTips: [
          `Verify the format of your ${contentType.toLowerCase()} content.`, 
          "Try with a smaller or clearer sample.", 
          "Ensure the content is in a supported language.",
          "Remove any encrypted or heavily formatted elements.",
          "If the issue persists, please contact support."
        ],
        complaintFilingInfo: {
          introduction: "Since analysis is incomplete, we can't provide specific reporting guidance.",
          agencies: [
            {
              name: "Smart-AI-Scam-Detection Support",
              url: "#",
              description: "Contact our support team for assistance with content that fails to process properly."
            }
          ]
        }
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error in /api/detect-scam:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Cache management endpoints
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'stats':
      const stats = responseCache.getStats();
      return NextResponse.json({
        cache: stats,
        message: `Cache contains ${stats.size} entries (max: ${stats.maxSize}). Hit rate: ${stats.hitRate}%`
      });
    
    case 'clear':
      responseCache.clear();
      return NextResponse.json({ message: 'Cache cleared successfully and statistics reset' });
    
    case 'reset-stats':
      responseCache.resetStats();
      return NextResponse.json({ message: 'Cache statistics reset successfully' });
    
    default:
      return NextResponse.json({ 
        message: 'Cache management endpoint',
        availableActions: ['stats', 'clear', 'reset-stats'],
        usage: {
          stats: '/api/detect-scam?action=stats',
          clear: '/api/detect-scam?action=clear',
          'reset-stats': '/api/detect-scam?action=reset-stats'
        }
      });
  }
}
