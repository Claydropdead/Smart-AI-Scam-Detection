// filepath: d:\\scam-detection-app\\app\\api\\detect-scam\\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeUrl,
  isLegitimateBankingDomain,
  analyzeForSpoofing,
  legitimatePhilippineBanks,
  suspiciousUrlPatterns
} from '../../utils/domainUtils';

// API key is now expected to be in an environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Construct the URL only if the API key is present
// Updated to use gemini-1.5-flash-latest model as gemini-pro might not be available/supported with v1beta for generateContent
const GEMINI_API_URL = GEMINI_API_KEY ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}` : '';

interface ReportAgency {
  name: string;
  link: string;
}

// Interface for verified URL information
interface VerifiedUrl {
  url: string;
  organization: string;
  verification: string;
}

// Interface for suspicious URL information
interface SuspiciousUrl {
  url: string;
  reason: string;
}

// Interface for URL analysis results
interface UrlAnalysis {
  found_urls: string[];
  verified_urls: VerifiedUrl[];
  suspicious_urls: SuspiciousUrl[];
}

// Interface for limited context information
interface ContextInfo {
  type: string;
  details: string;
  recommendations: string[];
}

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
  url_analysis?: UrlAnalysis; // Detailed URL analysis results
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

// Function to parse the Gemini API response to extract scam detection details
function parseGeminiResponse(apiResponse: GeminiApiResponse): ScamDetectionResponse {
  let originalApiText = "Initial: No text content found in API response"; // For debugging and error reporting

  try {
    // Enhanced extraction of text content from response
    const textFromCandidate = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textFromCandidate) {
      originalApiText = "Error: No text content found in Gemini response candidate.";
      throw new Error(originalApiText);
    }
    originalApiText = textFromCandidate; // Store the original raw text

    console.log("Gemini Raw Response Text (Original from API):", originalApiText);

    // Smart JSON extraction - Try multiple approaches for better reliability
    let jsonStringToParse: string;
    let parsedJson: any;

    try {
      // First approach: Try to parse the entire text as JSON
      parsedJson = JSON.parse(originalApiText.trim());
      console.log("Successfully parsed the entire response as JSON");
    } catch (jsonError) {
      console.log("Could not parse entire response as JSON, trying to extract JSON portion...");
      
      // Second approach: Extract JSON using brace matching (enhanced)
      // Find all opening braces and their matching closing braces
      const firstBraceIndex = originalApiText.indexOf('{');
      const lastBraceIndex = originalApiText.lastIndexOf('}');
      
      if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex < firstBraceIndex) {
        console.error("Could not find valid JSON object delimiters {} in response:", originalApiText);
        
        // Third approach: Try to fix common JSON syntax issues
        let fixedJsonString = originalApiText
          .replace(/```json|```/g, '') // Remove markdown code block indicators
          .replace(/(\r\n|\n|\r)/gm, '') // Remove line breaks
          .trim();
          
        // Look for first { and last } in the cleaned string
        const cleanFirstBrace = fixedJsonString.indexOf('{');
        const cleanLastBrace = fixedJsonString.lastIndexOf('}');
        
        if (cleanFirstBrace !== -1 && cleanLastBrace !== -1 && cleanLastBrace > cleanFirstBrace) {
          fixedJsonString = fixedJsonString.substring(cleanFirstBrace, cleanLastBrace + 1);
          console.log("Attempting to parse fixed JSON string:", fixedJsonString);
          try {
            parsedJson = JSON.parse(fixedJsonString);
            console.log("Successfully parsed fixed JSON string");
          } catch (fixedJsonError) {
            throw new Error("Multiple parsing attempts failed: " + (fixedJsonError as Error).message);
          }
        } else {
          throw new Error("Valid JSON object delimiters {} not found in AI response even after cleanup.");
        }
      } else {
        // Standard extraction and parsing
        jsonStringToParse = originalApiText.substring(firstBraceIndex, lastBraceIndex + 1);
        console.log("Gemini Extracted JSON String for Parsing:", jsonStringToParse);
        
        try {
          parsedJson = JSON.parse(jsonStringToParse);
          console.log("Successfully parsed extracted JSON string");
        } catch (extractedJsonError) {
          throw new Error("Failed to parse extracted JSON: " + (extractedJsonError as Error).message);
        }
      }
    }
    
    // Smart field validation and normalization
    const normalizeString = (value: any): string => {
      if (typeof value === 'string') return value.trim();
      if (value === null || value === undefined) return '';
      return String(value).trim();
    };
    
    const normalizeArray = (value: any, defaultItems: any[]): any[] => {
      if (Array.isArray(value) && value.length > 0) return value;
      return defaultItems;
    };
    
    // Normalize scam probability to ensure correct format
    let scamProbability = normalizeString(parsedJson.scam_probability);
    if (scamProbability && !scamProbability.endsWith('%') && !isNaN(Number(scamProbability))) {
      scamProbability = `${scamProbability}%`;
    }
    
    // Normalize confidence level
    let aiConfidence = normalizeString(parsedJson.ai_confidence).toLowerCase();
    if (!['low', 'medium', 'high'].includes(aiConfidence)) {
      aiConfidence = parsedJson.scam_probability && Number(parsedJson.scam_probability.replace('%', '')) > 50 ? 'High' : 'Medium';
    } else {
      aiConfidence = aiConfidence.charAt(0).toUpperCase() + aiConfidence.slice(1); // Capitalize first letter
    }

    // Map standard report agencies for Philippines
    const standardReportAgencies = [
      { name: "Philippine National Police Anti-Cybercrime Group (PNP ACG)", link: "https://www.pnpacg.ph/" },
      { name: "National Bureau of Investigation Cybercrime Division (NBI CCD)", link: "https://www.nbi.gov.ph/cybercrime/" },
      { name: "Department of Trade and Industry (DTI)", link: "https://www.dti.gov.ph/konsyumer/complaints/" },
      { name: "National Privacy Commission (NPC)", link: "https://www.privacy.gov.ph/complaints-assisted/" }
    ];
    
    // Standard steps if scammed
    const standardStepsIfScammed = [
      "Report to authorities immediately.",
      "Change your passwords for affected accounts.",
      "Contact your bank or financial institutions if applicable.",
      "Document all communications with the scammer.",
      "Alert friends and family if the scam involved impersonation."
    ];
    
    const standardStepsIfScammedTagalog = [
      "Agad na mag-ulat sa mga awtoridad.",
      "Palitan ang iyong mga password para sa mga apektadong account.",
      "Makipag-ugnayan sa iyong bangko o mga institusyong pinansyal kung naaangkop.",
      "Idokumento ang lahat ng komunikasyon sa scammer.",
      "Alertuhin ang mga kaibigan at pamilya kung ang scam ay may kinalaman sa panggagaya."
    ];    // Advanced intelligent parsing and context-aware response generation
    
    // Extract scam probability as a number for smart decision making
    const scamProbabilityNum = scamProbability ? 
      Number(scamProbability.replace('%', '')) : 
      (parsedJson.assessment?.toLowerCase().includes('scam') ? 60 : 10); // Infer from assessment if missing
    
    // Smart risk classification based on probability or keywords in the response
    const determineRiskLevel = (): string => {
      if (parsedJson.status) return parsedJson.status; // Honor AI's decision if present
      
      // Keywords-based heuristic classification if probability is missing
      const responseText = originalApiText.toLowerCase();
      const highRiskKeywords = ['urgent', 'immediate action', 'account suspended', 'verify your', 'banking details', 'cryptocurrency', 'prize claim', 'money transfer'];
      const highRiskCount = highRiskKeywords.filter(kw => responseText.includes(kw)).length;
      
      if (scamProbabilityNum >= 75 || highRiskCount >= 3) return "High Risk Detected";
      if (scamProbabilityNum >= 50 || highRiskCount >= 2) return "Medium Risk Detected";
      if (scamProbabilityNum >= 25 || highRiskCount >= 1) return "Low Risk Detected";
      return "Normal Conversation";
    };
    
    // Contextual assessment based on multiple factors
    const determineAssessment = (): string => {
      if (parsedJson.assessment) return parsedJson.assessment; // Honor AI's decision if present
      
      if (scamProbabilityNum >= 75) return "Highly Likely a Scam";
      if (scamProbabilityNum >= 50) return "Likely a Scam";
      if (scamProbabilityNum >= 25) return "Possibly Suspicious";
      return "Likely Not a Scam";
    };
      // Extract most relevant keywords for this message and detect scam categories
    const extractKeywords = () => {
      const fullText = [
        parsedJson.explanation_english, 
        parsedJson.advice, 
        parsedJson.true_vs_false,
        originalApiText // Include full API response text for better detection
      ].filter(Boolean).join(' ').toLowerCase();
      
      // Expanded set of scam indicators by category
      const scamKeywordsByCategory = {
        phishing: ['phishing', 'fishing', 'credential', 'login', 'sign in', 'username', 'password', 'account access', 'verify account', 'confirm details', 'security check', 'unusual activity', 'suspicious activity'],
        website: ['fake website', 'clone site', 'spoofed site', 'typosquatting', 'url', 'link', 'website', 'click here', 'login page', 'landing page', 'redirect', 'shortened link', 'bit.ly', 'tinyurl', '.ph', '.xyz'],
        malware: ['malware', 'virus', 'trojan', 'ransomware', 'spyware', 'keylogger', 'infected', 'download', 'attachment', 'security alert', 'scan', 'clean', 'remove', 'install', 'update required', 'vulnerable'],
        banking: ['bank', 'account', 'atm', 'pin', 'transaction', 'deposit', 'withdrawal', 'gcash', 'paymaya', 'bpi', 'bdo', 'metrobank', 'landbank', 'wire transfer', 'e-wallet', 'fund', 'otp'],
        impersonation: ['impersonation', 'pretend', 'official', 'representative', 'customer service', 'government', 'agency', 'police', 'nbi', 'dti', 'bir', 'social security', 'philhealth', 'pag-ibig'],
        urgency: ['urgent', 'immediate', 'quickly', 'deadline', 'time-sensitive', 'act now', 'limited time', 'expire', 'today only', '24 hours', 'final notice', 'last chance', 'suspension', 'restriction'],
        rewards: ['prize', 'winner', 'reward', 'gift', 'lottery', 'raffle', 'sweepstakes', 'jackpot', 'congratulations', 'claim', 'winning', 'million peso', 'free', 'bonus'],
        financial: ['money', 'payment', 'cryptocurrency', 'bitcoin', 'eth', 'usdt', 'coin', 'wallet', 'investment', 'profit', 'return', 'double', 'triple', 'unlock fund', 'release fund', 'processing fee'],
        romance: ['romance', 'love', 'relationship', 'partner', 'dating', 'marriage', 'meet', 'friend', 'lonely', 'widow', 'affection', 'trust', 'overseas', 'foreign'],
        employment: ['job offer', 'employment', 'work from home', 'income', 'salary', 'hiring', 'position', 'opportunity', 'commission', 'recruitment', 'application fee', 'training fee', 'home-based'],
        shopping: ['shopping', 'discount', 'deal', 'sale', 'order', 'shipping', 'delivery', 'product', 'lazada', 'shopee', 'amazon', 'aliexpress', 'refund', 'cheap', 'authentic']
      };
      
      // Analyze for suspicious URLs and links
      const urlAnalysis = () => {
        // Find potential URLs in the text
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|org|net|ph|io|xyz|info|site|online)[^\s]*)/gi;
        const foundUrls = fullText.match(urlRegex) || [];
        
        // Use our enhanced domain utilities for more accurate analysis
        const enhancedUrlAnalysis = (urls: string[]) => {
          return urls.map(url => {
            // Get comprehensive analysis from domainUtils
            const analysis = analyzeUrl(url);
            
            return {
              url,
              cleanUrl: analysis.cleanDomain,
              isLegitimateFinancial: analysis.isLegitimateDomain,
              isPotentialSpoofing: analysis.isPotentialSpoofing,
              hasSuspiciousPattern: analysis.hasSuspiciousPatterns,
              suspiciousScore: analysis.riskScore,
              legitimateInstitution: analysis.institution,
              spoofingTarget: analysis.spoofingTarget,
              spoofingTechnique: analysis.spoofingTechnique
            };
          });
        };
        
        // Analyze all found URLs
        const urlAnalysisResults = enhancedUrlAnalysis(foundUrls);
        
        // Filter suspicious URLs - higher threshold for improved accuracy
        const suspiciousUrls = urlAnalysisResults.filter(result => 
          result.suspiciousScore > 0.4 || result.isPotentialSpoofing
        ).map(result => result.url);
        
        // Filter legitimate banking/financial URLs
        const legitimateUrls = urlAnalysisResults.filter(result => 
          result.isLegitimateFinancial
        );
        
        // Special case for links with no context - more intelligent context detection
        const isIsolatedLink = foundUrls.length === 1 && 
          (fullText.trim().length < 60 || 
           foundUrls[0].length / fullText.length > 0.7); // URL takes up most of the content
        
        return {
          foundUrls,
          urlAnalysisResults,
          suspiciousUrls,
          legitimateUrls,
          containsSuspiciousUrls: suspiciousUrls.length > 0,
          containsLegitimateFinancialUrls: legitimateUrls.length > 0,
          isIsolatedLink
        };
      };
      
      const urlInfo = urlAnalysis();
      
      // Detect scam categories present in the text
      const detectedCategories = Object.entries(scamKeywordsByCategory)
        .map(([category, keywords]) => {
          const matches = keywords.filter(keyword => fullText.includes(keyword.toLowerCase()));
          return { 
            category, 
            score: matches.length / keywords.length, // Normalized score
            matches 
          };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
      
      // Extract specific keywords that were found
      const allKeywords = Object.values(scamKeywordsByCategory).flat();
      const detectedKeywords = allKeywords.filter(keyword => 
        fullText.includes(keyword.toLowerCase())
      );
      
      // Add URL-specific keywords based on enhanced URL analysis
      if (urlInfo.containsSuspiciousUrls) {
        detectedKeywords.push('suspicious-url', 'malicious-link');
      }
      
      // Add legitimate URL indicators when appropriate
      if (urlInfo.containsLegitimateFinancialUrls) {
        detectedKeywords.push('legitimate-financial-website');
        
        // Only add domain names of found legitimate sites
        urlInfo.legitimateUrls.forEach(item => {
          if (item.legitimateInstitution) {
            detectedKeywords.push(`verified-${item.cleanUrl.split('.')[0]}`);
          }
        });
      }
      
      // Add isolated link indicator for better context handling
      if (urlInfo.isIsolatedLink) {
        detectedKeywords.push('isolated-link', 'limited-context');
        
        // If isolated legitimate link
        if (urlInfo.containsLegitimateFinancialUrls && !urlInfo.containsSuspiciousUrls) {
          detectedKeywords.push('isolated-legitimate-link');
        }
        
        // If isolated suspicious link
        if (urlInfo.containsSuspiciousUrls) {
          detectedKeywords.push('isolated-suspicious-link');
        }
      }
      
      // Store scam category info for advanced analysis
      parsedJson._internal_scam_categories = detectedCategories;
      parsedJson._internal_url_analysis = urlInfo;
      
      return [...new Set(detectedKeywords)]; // Remove duplicates
    };    // Generate contextual advice based on content type and detected risk
    const generateContextualAdvice = () => {
      if (parsedJson.advice) return parsedJson.advice;
      
      const isAudio = !!parsedJson.audio_analysis;
      const isImage = !!parsedJson.image_analysis;
      const keywords = extractKeywords();
      const urlInfo = parsedJson._internal_url_analysis || { containsSuspiciousUrls: false };
      const categories = parsedJson._internal_scam_categories || [];
      
      // Special case for isolated links with limited context
      if (urlInfo.isIsolatedLink) {
        // For legitimate banking/financial sites
        if (urlInfo.containsLegitimateFinancialUrls && urlInfo.legitimateUrls.length > 0) {
          const site = urlInfo.legitimateUrls[0];
          return `The URL "${site.url}" appears to be a legitimate website for ${site.legitimateInstitution}. However, without additional context, it's not possible to determine why this link was shared. Always ensure you're visiting the official site by typing the address directly in your browser rather than clicking on links.`;
        }
        
        // For suspicious isolated links
        if (urlInfo.containsSuspiciousUrls) {
          return `This isolated URL appears suspicious. Without additional context, exercise extreme caution. Don't click this link, as it shows characteristics of potential phishing or fraud attempts. If you need to visit a financial institution's website, type the address directly in your browser.`;
        }
        
        // For neutral isolated links
        return `This appears to be just a URL without additional context. Without knowing how this link was presented to you (email, text message, etc.), it's hard to determine intent. As a general practice, avoid clicking on links when you don't know the full context, and manually type website addresses for banking and financial services.`;
      }
      
      // Get primary scam category if one has a significantly higher score
      const primaryCategory = categories.length > 0 ? categories[0].category : null;
      
      if (scamProbabilityNum >= 75) {
        // Very high risk - tailored advice by category
        if (keywords.includes('malware') || keywords.some(k => k.includes('virus'))) {
          return "URGENT: This appears to contain malware. Do not download any attachments, click any links, or follow any instructions. If you've already interacted with this content, disconnect from the internet and run a full system scan immediately.";
        }
        
        if (urlInfo.containsSuspiciousUrls) {
          return "WARNING: This message contains suspicious links that may lead to fake websites designed to steal your information. Never click on these links or enter any personal information.";
        }
        
        if (primaryCategory === 'impersonation' || keywords.includes('impersonation')) {
          return "This is a fraudulent impersonation attempt. The sender is pretending to be a legitimate organization. Contact the real organization directly through their official contact channels to verify any claims or requests.";
        }
        
        if (primaryCategory === 'financial' || keywords.includes('cryptocurrency') || keywords.includes('investment')) {
          return "This is a financial scam. The promises of high returns or unusual payment requests are red flags. No legitimate investment offers guaranteed returns or requires cryptocurrency/gift card payments.";
        }
      }
      
      if (scamProbabilityNum >= 50) {
        // High risk - tailored advice by content type and keywords
        if (isAudio) {
          return "Do not engage further with this caller. Voice scammers often use pressure tactics and impersonation. Block this number and report it to authorities.";
        }
        
        if (isImage && keywords.includes('prize')) {
          return "This appears to be a fake prize/lottery scam. Legitimate prizes never require upfront payment or sensitive information.";
        }
        
        if (keywords.includes('bank') || primaryCategory === 'banking') {
          return "This message appears to impersonate a banking institution. Always contact your bank directly using official phone numbers, never through links in messages.";
        }
        
        if (urlInfo.containsSuspiciousUrls) {
          return "This message contains suspicious links. Do not click on these links as they may lead to phishing websites designed to steal your personal information.";
        }
        
        if (primaryCategory === 'shopping') {
          return "This appears to be a shopping scam. Offers that are too good to be true usually are. Verify the legitimacy of the seller and use secure payment methods that offer buyer protection.";
        }
        
        if (primaryCategory === 'employment') {
          return "This has characteristics of a job scam. Legitimate employers don't ask for payment during the hiring process. Be cautious of work-from-home offers with unusually high salary promises.";
        }
        
        if (primaryCategory === 'romance') {
          return "This shows signs of a romance scam. Be extremely cautious of online relationships where the person quickly professes strong feelings and eventually asks for financial assistance.";
        }
        
        return "Exercise extreme caution with this message. It contains multiple scam indicators. Do not respond, click any links, or provide any personal information.";
      } else if (scamProbabilityNum >= 25) {
        // Medium risk - general caution
        if (urlInfo.containsSuspiciousUrls) {
          return "Be cautious with this message. While not definitively malicious, it contains suspicious links. Verify the sender's identity independently before clicking any links.";
        }
        
        // For minimal context scenarios
        if (keywords.includes('limited-context')) {
          return "This content lacks sufficient context to make a definitive assessment. Without knowing how this was presented to you (email, text message, etc.), exercise caution. For any financial or sensitive matters, always verify through official channels.";
        }
        
        return "Be cautious with this message. While not definitively a scam, it contains some suspicious elements. Verify independently before taking any action.";
      }
      
      // For legitimate financial URLs with low risk
      if (urlInfo.containsLegitimateFinancialUrls && urlInfo.legitimateUrls.length > 0) {
        const site = urlInfo.legitimateUrls[0];
        return `This contains what appears to be a reference to ${site.legitimateInstitution}'s official website. However, always ensure you're visiting the legitimate site by typing the address directly in your browser rather than clicking on links.`;
      }
      
      // Low risk - general advice
      return "This message appears relatively safe, but always maintain general caution with messages asking for personal information.";
    };
      // Extract URL information for the response
    const urlAnalysisInfo = parsedJson._internal_url_analysis || { foundUrls: [], suspiciousUrls: [], legitimateUrls: [] };
      // Create context info for limited context scenarios
    let contextInfo: ContextInfo | undefined = undefined;
    if (urlAnalysisInfo.isIsolatedLink) {
      contextInfo = {
        type: "isolated_link",
        details: "Content consists only of a URL without sufficient context",
        recommendations: [
          "Avoid clicking on links without clear context",
          "For banking/financial sites, always type the URL directly",
          "Contact the sender through official channels to verify purpose"
        ]
      };
    }
      // Process verified URLs
    const verifiedUrls = urlAnalysisInfo.legitimateUrls ? 
      urlAnalysisInfo.legitimateUrls.map((item: any) => ({
        url: item.url,
        organization: item.legitimateInstitution,
        verification: "verified"
      })) : [];
      
    // Process suspicious URLs for display  
    const suspiciousUrlsInfo = urlAnalysisInfo.suspiciousUrls ? 
      urlAnalysisInfo.suspiciousUrls.map((url: string) => ({
        url: url,
        reason: "Matches patterns associated with phishing or fraud attempts"
      })) : [];
    
    return {
      status: determineRiskLevel(),
      assessment: determineAssessment(),
      scam_probability: scamProbability || "N/A",
      ai_confidence: aiConfidence,
      explanation_english: parsedJson.explanation_english || parsedJson.explanation || "No English explanation provided.",
      explanation_tagalog: parsedJson.explanation_tagalog || "No Tagalog explanation provided. Please check the English explanation.",
      advice: generateContextualAdvice(),
      keywords: extractKeywords(), // New field to provide key scam indicators
      content_type: parsedJson.audio_analysis ? "audio" : (parsedJson.image_analysis ? "image" : "text"), // New field to indicate content type
      limited_context: contextInfo, // Information about limited context scenarios
      url_analysis: {
        found_urls: urlAnalysisInfo.foundUrls || [],
        verified_urls: verifiedUrls,
        suspicious_urls: suspiciousUrlsInfo
      },
      how_to_avoid_scams: normalizeArray(parsedJson.how_to_avoid_scams, [
        "Huwag ibigay ang iyong personal na impormasyon sa mga di-kilalang tao o website.",
        "Laging i-verify ang pagkakakilanlan ng mga tumatawag o nag-iiwan ng mensahe sa opisyal na channels.",
        "Mag-ingat sa mga mensaheng nagtutulak sa iyo na kumilos agad o nagbabanta.",
        "Kung nangangako ng napakagandang alok o premyo, malamang na scam ito.",
        "Gamitin ang mga opisyal na website o contact information para sa mga transaksyon."
      ]),
      where_to_report: normalizeArray(parsedJson.where_to_report, standardReportAgencies),
      what_to_do_if_scammed: normalizeArray(parsedJson.what_to_do_if_scammed, standardStepsIfScammed),
      what_to_do_if_scammed_tagalog: normalizeArray(parsedJson.what_to_do_if_scammed_tagalog, standardStepsIfScammedTagalog),
      true_vs_false: parsedJson.true_vs_false || "Legitimate messages typically include official contact details, don't create urgency, and don't ask for sensitive information. Verify through official channels before responding.",
      true_vs_false_tagalog: parsedJson.true_vs_false_tagalog || "Ang mga lehitimong mensahe ay karaniwang naglalaman ng opisyal na detalye sa pakikipag-ugnayan, hindi lumilikha ng pangangailangan, at hindi humihingi ng sensitibong impormasyon. Patunayan sa opisyal na mga channel bago tumugon.",
      image_analysis: parsedJson.image_analysis,
      audio_analysis: parsedJson.audio_analysis,
      detection_timestamp: new Date().toISOString(), // Add timestamp for tracking
      raw_gemini_response: process.env.NODE_ENV === 'development' ? originalApiText : undefined,
    };
  } catch (error) {
    console.error("Error parsing Gemini response:", error);    // Fallback response if parsing fails
    return {
      status: "Parsing Error",
      assessment: "Could not parse AI response",
      scam_probability: "N/A",
      ai_confidence: "N/A",
      explanation_english: `Error parsing response: ${(error as Error).message}. Raw response from AI: ${originalApiText}`,
      explanation_tagalog: "Hindi ma-parse ang tugon. Suriin ang raw response.",
      advice: "Please check the raw AI response or refine the AI prompt if issues persist.",
      how_to_avoid_scams: ["Exercise caution."],
      where_to_report: [{ name: "Error", link: "#" }],
      what_to_do_if_scammed: ["Report to authorities immediately.", "Contact your bank or financial institutions if applicable.", "Change your passwords for affected accounts.", "Document all communications with the scammer."],
      what_to_do_if_scammed_tagalog: ["Agad na mag-ulat sa mga awtoridad.", "Makipag-ugnayan sa iyong bangko o mga institusyong pinansyal kung naaangkop.", "Palitan ang iyong mga password para sa mga apektadong account.", "Idokumento ang lahat ng komunikasyon sa scammer."],
      true_vs_false: "Error parsing response. In general, legitimate messages include verifiable contact information and don't pressure you to act immediately.",
      true_vs_false_tagalog: "Error sa pag-parse ng tugon. Sa pangkalahatan, ang mga lehitimong mensahe ay naglalaman ng mabe-verify na impormasyon sa pakikipag-ugnayan at hindi ka nire-pressure na agarang kumilos.",
      image_analysis: "Error analyzing image. Please try again with a clearer image or provide text content for analysis.",
      keywords: ["error", "parsing"],
      content_type: "unknown",
      detection_timestamp: new Date().toISOString(),
      raw_gemini_response: originalApiText, // Always include raw response in error cases for easier debugging
    };
  }
}


// Function for audio analysis with Gemini
async function analyzeWithGeminiAudio(content: string, audioBase64: string, imageBase64?: string): Promise<ScamDetectionResponse> {
  if (!GEMINI_API_URL) {
    throw new Error('Gemini API URL is not configured due to missing API key.');
  }

  const prompt = `Analyze the provided audio recording to determine if it contains a scam or fraudulent content. The user is likely in the Philippines.
${content.trim() ? `Additional context provided: "${content}"` : "No additional text context provided."}
${imageBase64 ? "An image has also been provided for analysis alongside the audio." : ""}

CRITICAL ASSESSMENT CRITERIA FOR VOICE RECORDINGS:
Analyze the voice recording for scam risk, considering:
1. Tone and urgency in the voice
2. Pressure tactics and manipulation techniques
3. Claims made in the recording (financial, prizes, threats, etc.)
4. Signs of social engineering or phishing attempts
5. Voice deepfakes or impersonation attempts

VERY IMPORTANT: Apply careful nuanced analysis, focusing on voice-based scam techniques common in the Philippines such as:
- Voice phishing (vishing)
- Fake customer service or tech support calls
- Impersonation of government officials or bank representatives
- High-pressure sales tactics
- Urgent requests for personal or financial information

### Risk Assessment Framework (BASED ON SPECIFIC INDICATORS):
- 0-24% (LOW RISK): Normal conversation, no suspicious elements
- 25-49% (MODERATE RISK): Possibly suspicious content but not clearly malicious
- 50-74% (HIGH RISK): Likely a scam with clear risk indicators present
- 75-100% (VERY HIGH RISK): Dangerous content with multiple strong scam indicators

- HANDLING AMBIGUOUS RECORDINGS:
  - For unclear recordings WITHOUT any risk indicators:
    - Classify as LOW RISK (0-24%) by default
    - Status should be "Low Risk Detected" 
    - Assessment should be "Normal Conversation" or "Regular Message"
  
  - For ambiguous recordings:
    - Only assign MODERATE RISK (25-49%) if additional context would help determine intent
    - Status should be "Requires More Context" if truly ambiguous
    - Explain what specific information would clarify the risk level
    - AI confidence should be "Low" to reflect uncertainty

### Specific Voice Scam Indicators:
- AGGRESSIVE PERSUASION TECHNIQUES:
  - Urgency in voice tone: speaking quickly, sounding alarmed
  - Threats delivered with authoritative tone
  - High-pressure sales tactics
  - These justify MEDIUM to HIGH risk (25-74% depending on severity)

- FINANCIAL ELEMENTS:
  - Requests for money transfers, cryptocurrency, or gift cards
  - Promises of unrealistic returns or unexpected winnings
  - Requests for banking information or payment details
  - Investment opportunities with guaranteed returns
  - These justify HIGH to VERY HIGH risk (50-100% depending on directness)

- IMPERSONATION & IDENTITY FRAUD:
  - Claims to represent government agencies, banks, or well-known companies
  - Requests for credentials, OTPs, or personal identification numbers
  - Fake technical support claims requiring immediate action
  - These justify HIGH to VERY HIGH risk (50-100% depending on sophistication)

- KNOWN VOICE SCAM PATTERNS:
  - Impersonation of government officials or financial institution representatives
  - Claims of fraudulent activity on accounts requiring verification
  - Claims of suspended services requiring immediate payment
  - These justify HIGH to VERY HIGH risk (50-100% if clearly matching patterns)

FINAL RISK CATEGORIZATION RULES:
1. DEFAULT TO LOW RISK (0-24%) for normal conversation with no risk indicators
2. Only assign MODERATE RISK (25-49%) if recording has mild suspicious elements
3. Only assign HIGH RISK (50-74%) if the recording contains clear scam indicators
4. Only assign VERY HIGH RISK (75-100%) if multiple strong scam indicators are present

Respond with a single, minified JSON object matching this exact structure, and nothing else. Do not include any text before or after the JSON object (e.g. no "\`\`\`json" markers):
{
  "status": "string (Use exactly one of these: 'Normal Conversation' for typical exchanges like greetings; 'Low Risk Detected' for safe recordings; 'Medium Risk Detected' for recordings with some concerning elements; 'High Risk Detected' for clear scam content; 'Requires More Context' only for genuinely ambiguous recordings that need more information)",
  "assessment": "string (Use exactly one of these: 'Regular Message' for greetings and common responses; 'Likely Not a Scam' for safe content; 'Possibly Suspicious' for unclear intent; 'Likely a Scam' for risky content; 'Highly Likely a Scam' for dangerous content; 'Requires More Context' only if additional information would significantly change the risk assessment)",
  "scam_probability": "string representing percentage based on risk level: 0-24% for Low Risk (not considered a scam), 25-49% for Moderate Risk (possibly suspicious), 50-74% for High Risk (likely a scam), 75-100% for Very High Risk (highly likely a scam)",
  "ai_confidence": "string (Must be one of: 'Low', 'Medium', 'High' - use 'High' for clear cases, 'Low' only when truly uncertain)",
  "explanation_english": "string (VERY DETAILED and comprehensive explanation in English, tailored to the analyzed recording. Always include: 1) Why the recording received this risk classification, 2) Which specific indicators were present or absent, 3) For low risk recordings, explicitly state why they are safe, 4) For higher risk recordings, identify exactly which elements raised concerns.)",
  "explanation_tagalog": "string (VERY DETAILED and comprehensive paliwanag sa Tagalog, angkop sa sinuring recording.)",
  "audio_analysis": "string (Detailed analysis of the voice recording, addressing tone, content, suspicious elements, and potential transcription of key parts)",
  "image_analysis": "string (If image is provided, analyze the image content for potential scam indicators. If no image is provided, omit this field)",
  "advice": "string (specific advice related to the analyzed recording, in English. For vague recordings, suggest specific questions the user should ask to determine legitimacy)",  
  "how_to_avoid_scams": [
    "string (professional cybersecurity tip 1 in Tagalog - provide expert-level cybersecurity advice SPECIFIC TO VOICE-BASED SCAMS)",
    "string (professional cybersecurity tip 2 in Tagalog - provide expert-level cybersecurity advice SPECIFIC TO VOICE-BASED SCAMS)",
    "string (professional cybersecurity tip 3 in Tagalog - provide expert-level cybersecurity advice SPECIFIC TO VOICE-BASED SCAMS)",
    "string (professional cybersecurity tip 4 in Tagalog - provide expert-level cybersecurity advice SPECIFIC TO VOICE-BASED SCAMS)",
    "string (professional cybersecurity tip 5 in Tagalog - provide expert-level cybersecurity advice SPECIFIC TO VOICE-BASED SCAMS)"
  ],
  "where_to_report": [
    {"name": "Philippine National Police Anti-Cybercrime Group (PNP ACG)", "link": "https://www.pnpacg.ph/"},
    {"name": "National Bureau of Investigation Cybercrime Division (NBI CCD)", "link": "https://www.nbi.gov.ph/cybercrime/"},
    {"name": "Department of Trade and Industry (DTI)", "link": "https://www.dti.gov.ph/konsyumer/complaints/"},
    {"name": "National Privacy Commission (NPC)", "link": "https://www.privacy.gov.ph/complaints-assisted/"}
  ],
  "what_to_do_if_scammed": [
    "string (professional step 1 to take if you've been scammed via voice call - provide expert-level advice in English)",
    "string (professional step 2 to take if you've been scammed via voice call - provide expert-level advice in English)",
    "string (professional step 3 to take if you've been scammed via voice call - provide expert-level advice in English)",
    "string (professional step 4 to take if you've been scammed via voice call - provide expert-level advice in English)",
    "string (professional step 5 to take if you've been scammed via voice call - provide expert-level advice in English)"
  ],
  "what_to_do_if_scammed_tagalog": [
    "string (professional step 1 to take if you've been scammed via voice call - provide expert-level advice in TAGALOG)",
    "string (professional step 2 to take if you've been scammed via voice call - provide expert-level advice in TAGALOG)",
    "string (professional step 3 to take if you've been scammed via voice call - provide expert-level advice in TAGALOG)",
    "string (professional step 4 to take if you've been scammed via voice call - provide expert-level advice in TAGALOG)",
    "string (professional step 5 to take if you've been scammed via voice call - provide expert-level advice in TAGALOG)"
  ],
  "true_vs_false": "string (detailed explanation in ENGLISH on how to differentiate between legitimate and scam voice calls)",
  "true_vs_false_tagalog": "string (detailed explanation in TAGALOG on how to differentiate between legitimate and scam voice calls)"
}`;

  try {
    // Prepare the request body
    const requestBody: any = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
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
    
    return parseGeminiResponse(data);

  } catch (error) {
    console.error('Error calling Gemini API for audio analysis:', error);
    throw error; // Re-throw the error to be caught by the POST handler
  }
}

async function analyzeWithGemini(content: string, imageBase64?: string): Promise<ScamDetectionResponse> {  
  if (!GEMINI_API_URL) { // Check if the URL is empty (meaning API key was missing)
    throw new Error('Gemini API URL is not configured due to missing API key.');
  }const prompt = `Analyze the ${content.trim() ? "following text" : "provided image"} to determine if it is a scam. The user is likely in the Philippines.
${content.trim() ? `Text to analyze: "${content}"` : "No text provided for analysis."}
${imageBase64 ? (content.trim() ? "An image has also been provided for analysis." : "Only an image has been provided for analysis.") : ""}

CRITICAL ASSESSMENT CRITERIA:
Analyze the message for scam risk, considering linguistic tone, intent, and content.
DEFAULT ASSUMPTION: Consider it LOW RISK unless the message includes one or more of these specific indicators:
1. Aggressive persuasion techniques (urgency, threats, pressure tactics)
2. Financial incentives or threats (requests for money, promises of large rewards)
3. Suspicious links or attachments
4. Impersonation of known entities (banks, government, companies)
5. Known scam patterns or phrases

VERY IMPORTANT: Apply careful nuanced analysis, considering cultural context and common expressions in Filipino communication.
${imageBase64 ? "When analyzing the provided image, look for scam indicators such as: fake logos, edited screenshots, doctored images of fake prizes/winnings, suspicious QR codes, manipulated financial documents, or other visual elements commonly used in scams." : ""}

### Risk Assessment Framework (BASED ON SPECIFIC INDICATORS):
- Apply this risk probability scale:
  - 0-24% (LOW RISK): Safe messages, normal conversations, no suspicious elements
  - 25-49% (MODERATE RISK): Possibly suspicious content but not clearly malicious
  - 50-74% (HIGH RISK): Likely a scam with clear risk indicators present
  - 75-100% (VERY HIGH RISK): Dangerous content with multiple strong scam indicators

- DEFAULT ASSUMPTION FOR SHORT/VAGUE MESSAGES:
  - Simple greetings like "hello", "hi", "kumusta", "typical hello" = LOW RISK (0-24%)
  - Common standalone responses like "ok", "sige", "thank you" = LOW RISK (0-24%)
  - Generic comments without suspicious elements = LOW RISK (0-24%)
  - Status should be "Normal Conversation" or "Low Risk Detected" (not Medium or High)

- HANDLING AMBIGUOUS MESSAGES:
  - For vague messages WITHOUT any risk indicators:
    - Classify as LOW RISK (0-24%) by default
    - Status should be "Low Risk Detected" 
    - Assessment should be "Normal Conversation" or "Regular Message"
    - DO NOT escalate risk level solely due to lack of context
  
  - For messages like "ako ay nanalo" (I won) or "may premyo ka" (you have a prize):
    - Only assign MODERATE RISK (25-49%) if additional context would help determine intent
    - Status should be "Requires More Context" if truly ambiguous
    - Explain what specific information would clarify the risk level
    - AI confidence should be "Low" to reflect uncertainty
  
  - For messages that mention prizes/winnings WITH suspicious elements:
    - Look for legitimacy indicators: official source, contest details, claim process
    - Assign appropriate risk level based on presence of specific scam indicators, not vagueness

### Specific Scam Indicators (ONLY these justify higher risk ratings):
- AGGRESSIVE PERSUASION TECHNIQUES:
  - Urgency: "Act now", "Limited time", "Today only"
  - Threats: Account suspension, legal action, missed opportunity
  - Pressure tactics: Countdown timers, limited availability claims
  - Emotional manipulation: Fear, greed, or excitement triggers
  - These justify MEDIUM to HIGH risk (25-74% depending on severity)

- FINANCIAL ELEMENTS:
  - Requests for money transfers, cryptocurrency, or gift cards
  - Promises of unrealistic returns or unexpected winnings
  - Requests for banking information or payment details
  - Investment opportunities with guaranteed returns
  - These justify HIGH to VERY HIGH risk (50-100% depending on directness)

- SUSPICIOUS LINKS OR ATTACHMENTS:
  - Typosquatting: Subtle misspellings of legitimate websites (e.g., 'gooogle.com')
  - Homograph attacks: URLs with visually similar characters (e.g., 'lɑndbank.com' vs 'landbank.com')
  - Unusual TLDs for well-known entities (e.g., a bank using .info or .xyz)
  - URL shorteners when combined with other risk factors
  - Requests to download files or access unknown websites
  - These justify HIGH to VERY HIGH risk (50-100% depending on deception level)

- IMPERSONATION & IDENTITY FRAUD:
  - Claims to represent government agencies, banks, or well-known companies
  - Generic salutations ("Dear Customer") instead of personalized greetings
  - Requests for credentials, OTPs, or personal identification numbers
  - Fake technical support claims requiring immediate action
  - Inconsistencies between sender identity and email domain
  - These justify HIGH to VERY HIGH risk (50-100% depending on sophistication)

- KNOWN SCAM PATTERNS:
  - Investment scams: Promises of high returns with minimal risk
  - Romance scams: Building trust followed by emergency money requests
  - Lottery/prize scams: Unexpected winnings requiring fees to claim
  - Job scams: Offers requiring upfront payment or excessive personal data
  - Tech support scams: Claims of device infection requiring immediate access
  - These justify HIGH to VERY HIGH risk (50-100% if clearly matching patterns)

- SECONDARY RISK FACTORS (not sufficient alone):
  - Poor grammar/spelling (only relevant when combined with other indicators)
  - Unsolicited contact (increases risk when combined with other factors)
  - Generic message content (only relevant with other suspicious elements)
  - Informal tone when claiming to be from formal institutions

FINAL RISK CATEGORIZATION RULES:
1. DEFAULT TO LOW RISK (0-24%) for normal conversation with no risk indicators
2. Only assign MODERATE RISK (25-49%) if message has mild suspicious elements but no clear scam indicators
3. Only assign HIGH RISK (50-74%) if the message contains clear scam indicators
4. Only assign VERY HIGH RISK (75-100%) if multiple strong scam indicators are present
5. Short messages like "hello", "ok", "typical hello" should ALWAYS be LOW RISK unless specifically part of a known scam pattern

Respond with a single, minified JSON object matching this exact structure, and nothing else. Do not include any text before or after the JSON object (e.g. no "\`\`\`json" markers):
{
  "status": "string (Use exactly one of these: 'Normal Conversation' for typical exchanges like greetings; 'Low Risk Detected' for safe messages; 'Medium Risk Detected' for messages with some concerning elements; 'High Risk Detected' for clear scam content; 'Requires More Context' only for genuinely ambiguous messages that need more information)",
  "assessment": "string (Use exactly one of these: 'Regular Message' for greetings and common responses; 'Likely Not a Scam' for safe content; 'Possibly Suspicious' for unclear intent; 'Likely a Scam' for risky content; 'Highly Likely a Scam' for dangerous content; 'Requires More Context' only if additional information would significantly change the risk assessment)",
  "scam_probability": "string representing percentage based on risk level: 0-24% for Low Risk (not considered a scam), 25-49% for Moderate Risk (possibly suspicious), 50-74% for High Risk (likely a scam), 75-100% for Very High Risk (highly likely a scam)",
  "ai_confidence": "string (Must be one of: 'Low', 'Medium', 'High' - use 'High' for clear cases like simple greetings, 'Low' only when truly uncertain)",  "explanation_english": "string (VERY DETAILED and comprehensive explanation in English, tailored to the analyzed text. Always include: 1) Why the message received this risk classification, 2) Which specific indicators were present or absent, 3) For low risk messages like simple greetings, explicitly state why they are safe, 4) For higher risk messages, identify exactly which elements raised concerns. For ambiguous messages, explain what additional information would help determine risk level, but do not increase risk due to vagueness alone)",
  "explanation_tagalog": "string (VERY DETAILED and comprehensive paliwanag sa Tagalog, angkop sa sinuring teksto. Laging isama: 1) Kung bakit ang mensahe ay nakatanggap ng ganitong risk classification, 2) Anu-anong mga specific indicators ang nakita o wala, 3) Para sa low risk messages tulad ng simpleng pagbati, ipaliwanag kung bakit ang mga ito ay ligtas, 4) Para sa mga mensahe na may mas mataas na panganib, tukuyin kung aling mga elemento ang nagdulot ng pag-aalala. Para sa mga hindi malinaw na mensahe, ipaliwanag kung anong karagdagang impormasyon ang makakatulong sa pagtukoy ng antas ng panganib, ngunit huwag dagdagan ang panganib dahil lang sa kakulangan ng konteksto)",
  "image_analysis": "string (If image is provided, analyze the image content for potential scam indicators: suspicious logos, misleading visuals, edited screenshots of fake winnings, etc. If no image is provided, omit this field)",
  "advice": "string (specific advice related to the analyzed text, in English. For vague messages, suggest specific questions the user should ask to determine legitimacy, such as 'Ask for specific details about what you won, from which organization, and how to verify through official channels')",  
  "how_to_avoid_scams": [
    "string (professional cybersecurity tip 1 in Tagalog - provide expert-level cybersecurity advice SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional cybersecurity tip 2 in Tagalog - provide expert-level cybersecurity advice SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional cybersecurity tip 3 in Tagalog - provide expert-level cybersecurity advice SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional cybersecurity tip 4 in Tagalog - provide expert-level cybersecurity advice SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional cybersecurity tip 5 in Tagalog - provide expert-level cybersecurity advice SPECIFIC TO THE ANALYZED TEXT)"
  ],
  "where_to_report": [
    {"name": "Philippine National Police Anti-Cybercrime Group (PNP ACG)", "link": "https://www.pnpacg.ph/"},
    {"name": "National Bureau of Investigation Cybercrime Division (NBI CCD)", "link": "https://www.nbi.gov.ph/cybercrime/"},
    {"name": "Department of Trade and Industry (DTI)", "link": "https://www.dti.gov.ph/konsyumer/complaints/"},
    {"name": "National Privacy Commission (NPC)", "link": "https://www.privacy.gov.ph/complaints-assisted/"}
  ],
  "what_to_do_if_scammed": [
    "string (professional step 1 to take if you've been scammed - provide expert-level advice in English SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional step 2 to take if you've been scammed - provide expert-level advice in English SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional step 3 to take if you've been scammed - provide expert-level advice in English SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional step 4 to take if you've been scammed - provide expert-level advice in English SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional step 5 to take if you've been scammed - provide expert-level advice in English SPECIFIC TO THE ANALYZED TEXT)"
  ],
  "what_to_do_if_scammed_tagalog": [
    "string (professional step 1 to take if you've been scammed - provide expert-level advice in TAGALOG SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional step 2 to take if you've been scammed - provide expert-level advice in TAGALOG SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional step 3 to take if you've been scammed - provide expert-level advice in TAGALOG SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional step 4 to take if you've been scammed - provide expert-level advice in TAGALOG SPECIFIC TO THE ANALYZED TEXT)",
    "string (professional step 5 to take if you've been scammed - provide expert-level advice in TAGALOG SPECIFIC TO THE ANALYZED TEXT)"
  ],
  "true_vs_false": "string (detailed explanation in ENGLISH on how to differentiate between true and false information related to this specific analyzed text)",
  "true_vs_false_tagalog": "string (detailed explanation in TAGALOG on how to differentiate between true and false information related to this specific analyzed text)"
}

Ensure all string values are properly escaped for JSON. The explanations and advice should be directly related to the analyzed text and be VERY DETAILED and comprehensive. The "how_to_avoid_scams" should be general tips in Tagalog with expert-level cybersecurity advice SPECIFIC TO THE ANALYZED TEXT. The "where_to_report" section should be exactly as provided if the context is the Philippines. The "what_to_do_if_scammed" should contain professional actionable steps in English SPECIFIC TO THE ANALYZED TEXT. The "what_to_do_if_scammed_tagalog" should contain the same professional actionable steps but in TAGALOG and SPECIFIC TO THE ANALYZED TEXT. The "true_vs_false" should explain in detail how to distinguish legitimate communications from scams in ENGLISH. The "true_vs_false_tagalog" should provide the same explanation but in TAGALOG.
`;
  try {
    // Prepare the request body
    const requestBody: any = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
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
    
    return parseGeminiResponse(data);

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
    
    if (audioBase64) {
      // Handle audio analysis specially
      const analysis = await analyzeWithGeminiAudio(textContent, audioBase64, imageBase64);
      return NextResponse.json(analysis, { status: 200 });
    } else {
      // Standard text/image analysis
      const analysis = await analyzeWithGemini(textContent, imageBase64);
      return NextResponse.json(analysis, { status: 200 });
    }

  } catch (error: any) {
    console.error('Error in /api/detect-scam:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
