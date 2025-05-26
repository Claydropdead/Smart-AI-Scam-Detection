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

// Function for audio analysis with Gemini
async function analyzeWithGeminiAudio(content: string, audioBase64: string, imageBase64?: string): Promise<any> {
  if (!GEMINI_API_URL) {
    throw new Error('Gemini API URL is not configured due to missing API key.');
  }

  const prompt = `You are an expert AI fraud detection analyst. Your task is to analyze the provided audio recording for any signs of scam, phishing, or fraudulent activity. The user is likely in the Philippines.
${content.trim() ? `Additional context provided: "${content}"` : "No additional text context provided."}
${imageBase64 ? "An image has also been provided for analysis alongside the audio." : ""}

Based on the audio recording, provide a structured JSON response. The JSON object MUST contain the following fields:
- "isScam": boolean (true if the audio recording is likely a scam, false otherwise).
- "probability": number (a percentage from 0 to 100 indicating the likelihood of it being a scam).
- "confidence": string (your confidence level in this assessment: "Low", "Medium", or "High").
- "explanation": string (a brief explanation of your findings in English, highlighting red flags or reasons for your assessment, formatted for readability).
- "explanationTagalog": string (a direct and accurate Tagalog translation of the "explanation").
- "riskLevel": string (categorize the risk based on the probability: "Low" for 0-25% probability, "Medium" for 26-50%, "High" for 51-75%, "Very High" for 76-100%).
- "advice": string (provide a short, actionable piece of advice in English for the user. If a high risk of scam, suggest caution and specific actions like not responding to the caller. If low risk, suggest general phone safety reminders).
- "tutorialsAndTips": array of strings (provide 3-5 concise, actionable tips in English on how to identify and avoid similar scams. Each tip should be a separate string in the array).
- "complaintFilingInfo": object with the following fields:
    - "introduction": string (A brief introduction in English on why reporting is important and generally how to proceed, e.g., "If you believe you've encountered a voice scam, reporting it can help authorities and protect others. Here are some agencies where you can file a complaint:").
    - "agencies": array of objects, where each object has:
        - "name": string (The official name of the agency or organization, e.g., "Philippine National Police Anti-Cybercrime Group", "Federal Trade Commission (FTC)").
        - "url": string (The direct URL to their complaint filing page or relevant information page. Ensure this is a valid, working URL).
        - "description": string (Optional: A very brief description of the types of scams the agency typically handles, e.g., "For cybercrime incidents in the Philippines.", "For scams affecting consumers in the US."). Prioritize agencies relevant to the Philippines or general international bodies if the context is unclear.
- "audioAnalysis": string (Detailed analysis of the voice recording, addressing tone, content, suspicious elements, and transcription of key parts).
- "true_vs_false": string (Provide a concise explanation in English on how to differentiate between true and false information related to the analyzed content or common scam tactics. Focus on critical thinking and verification methods.).
- "true_vs_false_tagalog": string (A direct and accurate Tagalog translation of the "true_vs_false" explanation.).

When analyzing the audio for scam indicators, consider:
1. Tone and urgency in the voice
2. Pressure tactics and manipulation techniques
3. Claims made in the recording (financial, prizes, threats, etc.)
4. Signs of social engineering or phishing attempts
5. Voice deepfakes or impersonation attempts

Focus on voice-based scam techniques common in the Philippines such as:
- Voice phishing (vishing)
- Fake customer service or tech support calls
- Impersonation of government officials or bank representatives
- High-pressure sales tactics
- Urgent requests for personal or financial information

${imageBase64 ? "Also analyze the provided image for any potential scam indicators that might complement the audio analysis." : ""}

Ensure your entire response is ONLY the JSON object, with no additional text, comments, or markdown formatting like \`\`\`json ... \`\`\` around it. All string values must be properly escaped for JSON.`;

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
  }
  
  const prompt = `You are an expert AI fraud detection analyst. Your task is to analyze the ${content.trim() ? "following text" : "provided image"} for any signs of scam, phishing, or fraudulent activity. The user is likely in the Philippines.
${content.trim() ? `Text to analyze: "${content}"` : "No text provided for analysis."}
${imageBase64 ? (content.trim() ? "An image has also been provided for analysis." : "Only an image has been provided for analysis.") : ""}

Based on the ${content.trim() ? "text" : "image"}, provide a structured JSON response. The JSON object MUST contain the following fields:
- "isScam": boolean (true if the content is likely a scam, false otherwise).
- "probability": number (a percentage from 0 to 100 indicating the likelihood of it being a scam).
- "confidence": string (your confidence level in this assessment: "Low", "Medium", or "High").
- "explanation": string (a brief explanation of your findings in English, highlighting red flags or reasons for your assessment, formatted for readability).
- "explanationTagalog": string (a direct and accurate Tagalog translation of the "explanation").
- "riskLevel": string (categorize the risk based on the probability: "Low" for 0-25% probability, "Medium" for 26-50%, "High" for 51-75%, "Very High" for 76-100%).
- "advice": string (provide a short, actionable piece of advice in English for the user. If a high risk of scam, suggest caution and specific actions like not clicking links. If low risk, suggest general online safety reminders).
- "tutorialsAndTips": array of strings (provide 3-5 concise, actionable tips in English on how to identify and avoid similar scams. Each tip should be a separate string in the array).
- "complaintFilingInfo": object with the following fields:
    - "introduction": string (A brief introduction in English on why reporting is important and generally how to proceed, e.g., "If you believe you've encountered a scam, reporting it can help authorities and protect others. Here are some agencies where you can file a complaint:").
    - "agencies": array of objects, where each object has:
        - "name": string (The official name of the agency or organization, e.g., "Philippine National Police Anti-Cybercrime Group", "Federal Trade Commission (FTC)").
        - "url": string (The direct URL to their complaint filing page or relevant information page. Ensure this is a valid, working URL).
        - "description": string (Optional: A very brief description of the types of scams the agency typically handles, e.g., "For cybercrime incidents in the Philippines.", "For scams affecting consumers in the US."). Prioritize agencies relevant to the Philippines or general international bodies if the context is unclear.
- "true_vs_false": string (Provide a concise explanation in English on how to differentiate between true and false information related to the analyzed content or common scam tactics. Focus on critical thinking and verification methods.).
- "true_vs_false_tagalog": string (A direct and accurate Tagalog translation of the "true_vs_false" explanation.).

${imageBase64 ? "When analyzing the provided image, look for scam indicators such as: fake logos, edited screenshots, doctored images of fake prizes/winnings, suspicious QR codes, manipulated financial documents, or other visual elements commonly used in scams." : ""}

Ensure your entire response is ONLY the JSON object, with no additional text, comments, or markdown formatting like \`\`\`json ... \`\`\` around it.

Text to analyze:
"""
${content}
"""`;

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
