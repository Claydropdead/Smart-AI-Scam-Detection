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
  what_to_do_if_scammed: string[]; // Steps to take if you've been scammed (English)
  what_to_do_if_scammed_tagalog: string[]; // Steps to take if you've been scammed (Tagalog)
  true_vs_false: string; // How to differentiate between true and false information (English)
  true_vs_false_tagalog: string; // How to differentiate between true and false information (Tagalog)
  image_analysis?: string; // Optional analysis of image content if provided
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
    
    console.log("Gemini Extracted JSON String for Parsing:", jsonStringToParse);    // Attempt to parse the extracted JSON string
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
      what_to_do_if_scammed: Array.isArray(parsedJson.what_to_do_if_scammed) ? parsedJson.what_to_do_if_scammed : ["Report to authorities immediately.", "Change your passwords.", "Contact your bank if financial information was compromised.", "Document all communications with the scammer.", "Alert friends and family if the scam involved impersonation."],
      what_to_do_if_scammed_tagalog: Array.isArray(parsedJson.what_to_do_if_scammed_tagalog) ? parsedJson.what_to_do_if_scammed_tagalog : ["Agad na mag-ulat sa mga awtoridad.", "Palitan ang iyong mga password.", "Makipag-ugnayan sa iyong bangko kung kompromiso ang iyong impormasyong pinansyal.", "Idokumento ang lahat ng komunikasyon sa scammer.", "Alertuhin ang mga kaibigan at pamilya kung may panggagaya."],
      true_vs_false: parsedJson.true_vs_false || "Legitimate messages typically include official contact details, don't create urgency, and don't ask for sensitive information. Verify through official channels before responding.",
      true_vs_false_tagalog: parsedJson.true_vs_false_tagalog || "Ang mga lehitimong mensahe ay karaniwang naglalaman ng opisyal na detalye sa pakikipag-ugnayan, hindi lumilikha ng pangangailangan, at hindi humihingi ng sensitibong impormasyon. Patunayan sa opisyal na mga channel bago tumugon.",
      image_analysis: parsedJson.image_analysis,
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
      raw_gemini_response: originalApiText, // Always include raw response in error cases for easier debugging
    };
  }
}


async function analyzeWithGemini(content: string, imageBase64?: string): Promise<ScamDetectionResponse> {  if (!GEMINI_API_URL) { // Check if the URL is empty (meaning API key was missing)
    throw new Error('Gemini API URL is not configured due to missing API key.');
  }    const prompt = `Analyze the ${content.trim() ? "following text" : "provided image"} to determine if it is a scam. The user is likely in the Philippines.
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
  "explanation_tagalog": "string (VERY DETAILED and comprehensive paliwanag sa Tagalog, angkop sa sinuring teksto. Laging isama: 1) Kung bakit ang mensahe ay nakatanggap ng ganitong risk classification, 2) Anu-anong mga specific indicators ang nakita o wala, 3) Para sa low risk messages tulad ng simpleng pagbati, ipaliwanag kung bakit ang mga ito ay ligtas, 4) Para sa mga mensaheng may mas mataas na panganib, tukuyin kung aling mga elemento ang nagdulot ng pag-aalala. Para sa mga hindi malinaw na mensahe, ipaliwanag kung anong karagdagang impormasyon ang makakatulong sa pagtukoy ng antas ng panganib, ngunit huwag dagdagan ang panganib dahil lang sa kakulangan ng konteksto)",
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
    const { content, imageBase64 } = body;  // Accept optional image data    // Allow content to be empty if an image is provided
    if ((!content || typeof content !== 'string') && !imageBase64) {
      return NextResponse.json({ message: 'Either text content or an image is required' }, { status: 400 });
    }
    
    // Use empty string if content is not provided but image is
    const textContent = content || '';    // Call your Gemini API integration with optional image and possibly empty text
    const analysis = await analyzeWithGemini(textContent, imageBase64);

    return NextResponse.json(analysis, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/detect-scam:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
