// filepath: d:\\scam-detection-app\\app\\api\\detect-scam\\route.ts
import { NextRequest, NextResponse } from 'next/server';

// API key is now expected to be in an environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Construct the URL only if the API key is present
// Updated to use gemini-1.5-flash-latest model as gemini-pro might not be available/supported with v1beta for generateContent
const GEMINI_API_URL = GEMINI_API_KEY ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}` : '';

interface ReportAgency {
  name: string;
  link: string;
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
    const textFromCandidate = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textFromCandidate) {
      originalApiText = "Error: No text content found in Gemini response candidate.";
      throw new Error(originalApiText);
    }
    originalApiText = textFromCandidate; // Store the original raw text

    console.log("Gemini Raw Response Text (Original from API):", originalApiText);

    // Extract the JSON part of the string by finding the first '{' and last '}'
    const firstBraceIndex = originalApiText.indexOf('{');
    const lastBraceIndex = originalApiText.lastIndexOf('}');

    if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex < firstBraceIndex) {
      console.error("Could not find valid JSON object delimiters {} in response:", originalApiText);
      throw new Error("Valid JSON object delimiters {} not found in AI response. Ensure the AI returns a single JSON object.");
    }

    // Extract the substring that should be the JSON object
    const jsonStringToParse = originalApiText.substring(firstBraceIndex, lastBraceIndex + 1);
    
    console.log("Gemini Extracted JSON String for Parsing:", jsonStringToParse);

    // Attempt to parse the extracted JSON string
    const parsedJson = JSON.parse(jsonStringToParse);

    // Basic validation of the parsed structure
    return {
      status: parsedJson.status || "Analysis Complete",
      assessment: parsedJson.assessment || "See explanation",
      scam_probability: parsedJson.scam_probability || "N/A",
      ai_confidence: parsedJson.ai_confidence || "N/A",
      explanation_english: parsedJson.explanation_english || "No English explanation provided.",
      explanation_tagalog: parsedJson.explanation_tagalog || "No Tagalog explanation provided.",
      advice: parsedJson.advice || "No advice provided.",
      how_to_avoid_scams: Array.isArray(parsedJson.how_to_avoid_scams) ? parsedJson.how_to_avoid_scams : ["Refer to official sources for scam avoidance tips."],
      where_to_report: Array.isArray(parsedJson.where_to_report) ? parsedJson.where_to_report : [{ name: "Local Authorities", link: "#" }],
      raw_gemini_response: process.env.NODE_ENV === 'development' ? originalApiText : undefined,
    };

  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    // Fallback response if parsing fails
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
      raw_gemini_response: originalApiText, // Always include raw response in error cases for easier debugging
    };
  }
}


async function analyzeWithGemini(content: string): Promise<ScamDetectionResponse> {
  if (!GEMINI_API_URL) { // Check if the URL is empty (meaning API key was missing)
    throw new Error('Gemini API URL is not configured due to missing API key.');
  }
  
  const prompt = `Analyze the following text to determine if it is a scam. The user is likely in the Philippines.
Text to analyze: "${content}"

VERY IMPORTANT: Pay close attention to all potential scam indicators and evolving tactics.
- URL/Domain Analysis:
  - Typosquatting: Subtle misspellings of known legitimate websites (e.g., 'gooogle.com' vs 'google.com').
  - Homograph Attacks: URLs using characters from different alphabets that look identical or very similar (e.g., Cyrillic 'а' vs Latin 'a', as in 'lɑndbank.com' vs 'landbank.com'). Treat these as HIGH RISK.
  - Suspicious TLDs: Unusual top-level domains for well-known entities (e.g., a bank using .info or .xyz).
  - URL Shorteners: While not always malicious, be cautious if combined with other red flags.
- Content Analysis:
  - Urgency & Threats: High-pressure tactics, limited-time offers, threats of account suspension.
  - Generic Greetings: Vague salutations like "Dear Customer" instead of a personal name.
  - Poor Grammar/Spelling: While not definitive, often a sign of unprofessional or foreign scam operations.
  - Unexpected Attachments/Links: Requests to download files or click links from unknown or unverified sources.
  - Requests for Sensitive Information: Phishing attempts asking for passwords, OTPs, credit card details, personal identification numbers.
  - Too Good To Be True Offers: Unrealistic promises of prizes, money, or job opportunities.
  - Impersonation: Claims to be from government agencies, banks, tech support, or known companies with unusual requests.
  - Investment Scams: Promises of high returns with little to no risk.
  - Romance Scams: Building trust and then requesting money for fabricated emergencies.
  - Job Offer Scams: Fake job postings that may ask for upfront fees or personal data.
- Contextual Clues:
  - Lack of Context: A suspicious URL, message, or request provided with no other legitimate context increases risk.
  - Unsolicited Contact: Messages received out of the blue from unknown numbers or email addresses.

Consider current scamming trends and sophisticated methods. If multiple indicators are present, the risk level should be elevated accordingly.

Respond with a single, minified JSON object matching this exact structure, and nothing else. Do not include any text before or after the JSON object (e.g. no "\`\`\`json" markers):
{
  "status": "string (e.g., Low Risk Detected, Medium Risk Detected, High Risk Detected - be more inclined to High Risk for clear typosquatting/homograph attacks or multiple strong indicators)",
  "assessment": "string (e.g., Likely Not a Scam, Potentially a Scam, Highly Likely a Scam - be more inclined to Highly Likely a Scam for clear typosquatting/homograph attacks or multiple strong indicators)",
  "scam_probability": "string representing percentage (e.g., 10%, 50%, 90% - assign higher probability for typosquatting/homograph)",
  "ai_confidence": "string (e.g., Low, Medium, High)",
  "explanation_english": "string (VERY DETAILED and comprehensive explanation in English, tailored to the analyzed text, at least 3-5 sentences or a short paragraph. Specifically explain WHY it is or isn't a scam, referencing the typosquatting/homograph if applicable)",
  "explanation_tagalog": "string (VERY DETAILED and comprehensive paliwanag sa Tagalog, angkop sa sinuring teksto, hindi bababa sa 3-5 pangungusap o isang maikling talata. Ipaliwanag kung BAKIT ito scam o hindi, na tumutukoy sa typosquatting/homograph kung naaangkop)",
  "advice": "string (specific advice related to the analyzed text, in English, detailed and actionable, especially concerning the detected risk type like typosquatting)",
  "how_to_avoid_scams": [
    "string (general tip 1 in English)",
    "string (general tip 2 in English)",
    "string (general tip 3 in English)",
    "string (general tip 4 in English)",
    "string (general tip 5 in English)"
  ],
  "where_to_report": [
    {"name": "Philippine National Police Anti-Cybercrime Group (PNP ACG)", "link": "https://www.pnpacg.ph/"},
    {"name": "National Bureau of Investigation Cybercrime Division (NBI CCD)", "link": "https://www.nbi.gov.ph/cybercrime/"},
    {"name": "Department of Trade and Industry (DTI)", "link": "https://www.dti.gov.ph/konsyumer/complaints/"},
    {"name": "National Privacy Commission (NPC)", "link": "https://www.privacy.gov.ph/complaints-assisted/"}
  ]
}

Ensure all string values are properly escaped for JSON. The explanations and advice should be directly related to the analyzed text and be VERY DETAILED and comprehensive. The "how_to_avoid_scams" should be general tips. The "where_to_report" section should be exactly as provided if the context is the Philippines.
`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
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
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ message: 'Content is required and must be a string' }, { status: 400 });
    }

    // Call your Gemini API integration here
    const analysis = await analyzeWithGemini(content);

    return NextResponse.json(analysis, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/detect-scam:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
