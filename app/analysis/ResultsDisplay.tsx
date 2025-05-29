"use client";

import { ScamDetectionResult, ApiReportAgency } from './interfaces'; // Updated import
import { extractScamIndicators, getColorByPercentage } from './utils';
import { getInitializedIndicators, detectIndicators, calculateRiskPercentage } from './indicators';

interface ResultsDisplayProps {
  analysisResult: ScamDetectionResult;
  scamContent: string;
}

// Separate component for results display to improve code organization
export default function ResultsDisplay({ analysisResult, scamContent }: ResultsDisplayProps) {
  const apiPercent = analysisResult.probability;

  // Helper function to check if risk summary is inconsistent with calculated risk percentage
  const isRiskSummaryInconsistent = (summary: string, riskPercentage: number): boolean => {
    const lowRiskKeywords = ['safe', 'no suspicious', 'no concerning', 'low risk', 'minimal risk'];
    const highRiskKeywords = ['dangerous', 'critical', 'very high', 'multiple strong', 'alarming'];
    
    // Check for mismatches where summary suggests low risk but percentage is high
    if (riskPercentage >= 50 && lowRiskKeywords.some(keyword => summary.toLowerCase().includes(keyword))) {
      return true;
    }
    
    // Check for mismatches where summary suggests high risk but percentage is low
    if (riskPercentage < 25 && highRiskKeywords.some(keyword => summary.toLowerCase().includes(keyword))) {
      return true;
    }
    
    return false;
  };  // Initialize indicators for detection
  const indicators = getInitializedIndicators();
  // Combine ALL content for a single, unified analysis - text, image, and audio
  const audioContent = analysisResult.audioAnalysis || "";
  
  // Make sure we give more weight to audio content by duplicating it multiple times if present
  // This ensures audio analysis gets proper pattern matching even with limited text
  const audioContentForAnalysis = audioContent ? `${audioContent} ${audioContent} ${audioContent}` : "";
  
  const content = (
    (analysisResult.explanation || "") + " " +
    (scamContent || "") + " " +
    (analysisResult.image_analysis || "") + " " +
    audioContentForAnalysis // Audio analysis with triple weight for better detection
  );
  
  // Run the SAME detection algorithm on all content
  const detectionResult = detectIndicators(content, indicators);
  
  // Calculate the final risk percentage using the SAME logic for all content types
  let finalRiskPercentage = calculateRiskPercentage(
    detectionResult.patternMatches,
    detectionResult,
    apiPercent
  );
    // Get audio content for display purposes
  const audioAnalysisContent = analysisResult.audioAnalysis;  // Determine if the content contains high-risk indicators (using the consolidated pattern detection)
  // We now use a more comprehensive approach for audio analysis that considers any high-risk indicator
  const isAudioClearlyScam = !!(analysisResult.audioAnalysis && (
    // Check if any detected pattern has high severity (4+)
    Object.values(detectionResult.patternMatches).some(match => match.severity >= 4) ||
    // Or check specific high-risk patterns commonly found in audio scams
    detectionResult.patternMatches["Voice message scam"] ||
    detectionResult.patternMatches["Filipino investment scam"] ||
    detectionResult.patternMatches["Investment opportunity"] ||
    detectionResult.patternMatches["Remittance scam"] ||
    detectionResult.patternMatches["Payment upfront"] ||
    detectionResult.patternMatches["Financial information request"] ||
    detectionResult.patternMatches["Too good to be true"] ||
    detectionResult.patternMatches["Emotional manipulation"] ||
    // Audio content with urgent requests should be flagged
    detectionResult.patternMatches["Urgent action required"]
  ));
  // Updated audio risk assessment based on detected indicators
  // Now we use the same detection logic for both text and audio
  const isRiskOverriddenByAudio = false;
    // No special handling needed for audio content anymore - we already applied the same risk 
  // calculation logic for all content types (text, image, audio) in the unified detection flow above.
  // Risk level comes directly from the unified content analysis.

  // Additional safeguard to ensure consistent risk display
  // Make sure percentage values don't fall right at category boundaries
  if (!isRiskOverriddenByAudio) {
    if (finalRiskPercentage === 50 || finalRiskPercentage === 49) finalRiskPercentage = 48; // Clear moderate
    if (finalRiskPercentage === 75 || finalRiskPercentage === 74) finalRiskPercentage = 73; // Clear high
    if (finalRiskPercentage === 25 || finalRiskPercentage === 24) finalRiskPercentage = 23; // Clear low
  }
  
  // Get UI styles based on calculated risk percentage to ensure consistency
  const statusStyles = getColorByPercentage(finalRiskPercentage);
  // Prepare display explanation, prioritizing proper integration of audio analysis
  let displayExplanation = analysisResult.explanation;
  const genericEnglishFallbacks = [
    "no detailed risk analysis available", 
    "no english explanation available",
    "explanation not available" 
  ];
  const isEnglishExplanationGeneric = !displayExplanation || 
    genericEnglishFallbacks.some(fallback => displayExplanation?.toLowerCase().includes(fallback));
  // If we have audio analysis but generic text explanation, use audio analysis as the primary explanation
  if (audioAnalysisContent) {
    if (isEnglishExplanationGeneric) {
      // Replace with audio analysis completely with clear header
      displayExplanation = `Voice Recording Analysis: ${audioAnalysisContent}`;
      
      // If there are detected scam indicators, enhance the explanation
      if (Object.entries(indicators).filter(([_, data]) => data.detected).length > 0) {
        const detectedPatterns = Object.entries(indicators)
          .filter(([_, data]) => data.detected)
          .map(([name, _]) => name)
          .slice(0, 3)
          .join(", ");
        
        displayExplanation += `\n\nThe voice recording contains suspicious patterns including: ${detectedPatterns}.`;
      }
    } else if (displayExplanation) {
      // Append audio analysis to existing explanation for completeness
      displayExplanation = `${displayExplanation}\n\nAdditional Voice Analysis: ${audioAnalysisContent}`;
    }
  } else if (!displayExplanation) { 
    displayExplanation = "No English explanation available."; 
  }
  // Prepare display explanation for Tagalog
  let displayExplanationTagalog = analysisResult.explanationTagalog;
  const genericTagalogFallbacks = [
    "hindi available ang paliwanag sa tagalog", 
    "hindi available ang detalyadong pagsusuri ng panganib",
    "walang available na paliwanag"
  ];
  const isTagalogExplanationGeneric = !displayExplanationTagalog ||
    genericTagalogFallbacks.some(fallback => displayExplanationTagalog?.toLowerCase().includes(fallback));
  // If we have audio analysis but generic Tagalog explanation, use audio analysis info
  if (audioAnalysisContent) {
    if (isTagalogExplanationGeneric) {
      // Replace with audio analysis for Tagalog with clear header
      displayExplanationTagalog = `Pagsusuri ng Voice Recording: ${audioAnalysisContent}`;
      
      // If there are detected scam indicators, enhance the Tagalog explanation
      if (Object.entries(indicators).filter(([_, data]) => data.detected).length > 0) {
        const detectedPatterns = Object.entries(indicators)
          .filter(([_, data]) => data.detected)
          .map(([name, _]) => {
            // Simple translation of common indicator names (just basic examples)
            switch(name) {
              case "Urgent action required": return "Kailangang-kailangan daw na aksyunan agad";
              case "Financial information request": return "Hiling ng impormasyon tungkol sa pananalapi";
              case "Too good to be true": return "Napakagandang alok na hindi kapani-paniwala";
              case "Voice message scam": return "Panloloko gamit ang voice message";
              case "Filipino investment scam": return "Panloloko sa pamumuhunan";
              default: return name; // Keep English if no translation
            }
          })
          .slice(0, 3)
          .join(", ");
        
        displayExplanationTagalog += `\n\nAng voice recording ay naglalaman ng kahina-hinalang mga pattern gaya ng: ${detectedPatterns}.`;
      }
    } else if (displayExplanationTagalog) {
      // Append audio analysis to existing Tagalog explanation
      displayExplanationTagalog = `${displayExplanationTagalog}\n\nKaragdagang Pagsusuri ng Audio: ${audioAnalysisContent}`;
    }
  } else if (!displayExplanationTagalog) {
    displayExplanationTagalog = "Hindi available ang paliwanag sa Tagalog.";
  }
  
  // Extract any additional indicators from the original AI explanation for keyword processing
  const originalExplanationForIndicators = analysisResult.explanation || "";
  const extractedIndicators = extractScamIndicators(originalExplanationForIndicators);
  
  // Get all detected indicators from the standard pattern matching
  const detectedIndicators = Object.entries(indicators)
    .filter(([_, data]) => data.detected)
    .map(([name, _]) => name)
    // Sort by severity (highest first)
    .sort((a, b) => {
      return (indicators[b].severity || 0) - (indicators[a].severity || 0);
    });

  // The 'keywords' field is no longer in ScamDetectionResult from the API.
  // If keyword extraction is still needed, it would have to be done client-side
  // or the API would need to be updated to provide them.
  // For now, this section is effectively disabled as analysisResult.keywords will be undefined.

  // if (analysisResult.keywords && analysisResult.keywords.length > 0) { 
  //   const displayKeywordMap: {[key: string]: string} = {
  //     'limited-context': 'Limited Context Analysis'
  //   };
  //   analysisResult.keywords.forEach((keyword: string) => {
  //     if (displayKeywordMap[keyword]) {
  //       detectedIndicators.push(displayKeywordMap[keyword]);
  //     }
  //     else {
  //       const formattedKeyword = keyword
  //         .split('-')
  //         .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
  //         .join(' ');
  //       if (!detectedIndicators.includes(formattedKeyword)) {
  //         detectedIndicators.push(formattedKeyword);
  //       }
  //     }
  //   });
  // }
  
  // If no indicators were detected but we have AI-extracted ones
  if (detectedIndicators.length === 0 && extractedIndicators.length > 0) {
    // Use the first 3 extracted ones as simple phrases
    for (let i = 0; i < Math.min(3, extractedIndicators.length); i++) {
      const text = extractedIndicators[i];
      // Extract a short phrase (5 words or less)
      const shortPhrase = text.split(/\s+/).slice(0, 4).join(" ")
        .replace(/[.,;:!?].*$/, "") // Remove endings with punctuation
        .replace(/^\W+|\W+$/, ""); // Trim non-word characters
        
      if (shortPhrase.length > 3) {
        detectedIndicators.push(shortPhrase);
      }
    }
  }
  
  // Remove duplicates and limit to reasonable number
  const uniqueIndicators = [...new Set(detectedIndicators)];
  const finalIndicators = uniqueIndicators.slice(0, 8); // Limit to top 8 for display purposes
    
  // Get badge color based on risk percentage - matches the risk thresholds exactly
  const getBadgeColorClass = () => {
    if (finalRiskPercentage >= 75) return 'bg-red-900 border-red-700 text-white';
    if (finalRiskPercentage >= 50) return 'bg-orange-800 border-orange-700 text-white';
    if (finalRiskPercentage >= 25) return 'bg-yellow-700 border-yellow-600 text-white';
    return 'bg-green-700 border-green-600 text-white';
  };  // Generate a consistent status based on the calculated risk percentage
  const getConsistentRiskStatus = (percentage: number): string => {
    // Using strict thresholds to ensure UI consistency
    if (percentage >= 75) return "Very High Risk Content";
    if (percentage >= 50) return "High Risk Content";
    if (percentage >= 25) return "Moderate Risk Content";
    return "Low Risk Content";
  };
    // Use API's status if present, but ensure it doesn't have inconsistent risk level wording
  // This primarily handles the content type portion (e.g., "Audio Analysis")
  let displayStatus = analysisResult.status || "Analysis Results";
  
  // If status contains risk level wording that might conflict with the calculated risk,
  // replace it with a more neutral form
  const riskWords = ['low risk', 'moderate risk', 'high risk', 'very high risk'];
  if (riskWords.some(word => displayStatus.toLowerCase().includes(word))) {
    // Extract content type if possible
    const contentType = analysisResult.contentType || 
                       (displayStatus.includes(':') ? displayStatus.split(':')[0].trim() : "");
    
    // For audio content specifically, make it clearer this is an audio analysis
    if (contentType && contentType.toLowerCase() === 'audio') {
      displayStatus = "Voice Recording Analysis";
    } else {
      displayStatus = contentType ? `${contentType} Analysis` : "Analysis Results";
    }
  }// Intelligent assessment that adapts based on content type, purpose, and risk level
  const getAssessmentText = (): string => {
    const contentType = (analysisResult.contentType || "").toLowerCase();    const contentPurpose = (analysisResult.contentPurpose || "").toLowerCase();
    const audienceTarget = (analysisResult.audienceTarget || "").toLowerCase();
    // Removed unused audioAnalysisText variable as it's no longer needed with unified audio handling

    // Check for API assessment, but NEVER use it if it mentions "scam"
    const apiAssessmentHasScam = analysisResult.assessment && 
                              analysisResult.assessment.toLowerCase().includes("scam");    // Audio content assessment uses EXACTLY the same assessment text as other content types
    // We don't need special handling for audio content anymore - it uses the same detection system
    // The audio analysis is treated as part of the content's text, just like image analysis text
    
    // Function to get content category based on available information
    const getContentCategory = () => {
      // Check for software/tech related content
      if (contentPurpose.match(/software|activation|license|windows|office|product key|crack|keygen|patch/i) ||
          contentType.includes("software")) {
        return "software";
      }
      
      // Check for financial content
      if (contentPurpose.match(/invest|banking|loan|credit|money|payment|financial|finance|bitcoin|crypto|earn|income/i) ||
          audienceTarget.match(/investor|saver|borrower|customer/i)) {
        return "financial";
      }
      
      // Check for e-commerce content
      if (contentPurpose.match(/buy|sell|shop|product|store|discount|offer|deal|purchase/i) ||
          contentType.match(/store|shop|ecommerce/i)) {
        return "ecommerce";
      }
      
      // Check for communication content
      if (contentType.match(/email|message|chat|sms|communication/i) ||
          contentPurpose.match(/contact|reach out|verify|confirm|account/i)) {
        return "communication";
      }
      
      // Check for social media content
      if (contentType.match(/social media|profile|post|account/i) ||
          contentPurpose.match(/friend|follow|like|share|connect/i)) {
        return "social";
      }
      
      // Check for health-related content
      if (contentPurpose.match(/health|medical|treatment|cure|medicine|weight|diet|supplement/i)) {
        return "health";
      }

      // Check for audio content (if not caught by the specific scam override above)
      if (contentType.includes("audio")) {
        return "audio"; 
      }
      
      // Website is a fallback if we know it's a website but can't categorize further
      if (contentType.match(/website|url|web page/i)) {
        return "website";
      }
      
      // General content - no specific category identified
      return "general";
    };
    
    // Get the content category
    const category = getContentCategory();
    
    // If API assessment exists but contains "scam", or no API assessment, override/provide our content-specific assessment
    if (apiAssessmentHasScam || !analysisResult.assessment) {
      // Provide assessments based on content category and risk level
      switch (category) {
        case "software":
          if (finalRiskPercentage >= 75) return "Potentially Harmful Software Resource";
          if (finalRiskPercentage >= 50) return "Unauthorized Software Modification Tool";
          if (finalRiskPercentage >= 25) return "Software With Potential Security Concerns";
          return "Standard Software Resource";
          
        case "financial":
          if (finalRiskPercentage >= 75) return "Highly Questionable Financial Proposition";
          if (finalRiskPercentage >= 50) return "Financially Risky Opportunity";
          if (finalRiskPercentage >= 25) return "Financial Content With Some Concerns";
          return "Standard Financial Information";
          
        case "ecommerce":
          if (finalRiskPercentage >= 75) return "Potentially Fraudulent Marketplace";
          if (finalRiskPercentage >= 50) return "Questionable Shopping Resource";
          if (finalRiskPercentage >= 25) return "Online Store With Verification Needed";
          return "Standard E-commerce Platform";
          
        case "communication":
          if (finalRiskPercentage >= 75) return "Highly Suspicious Communication";
          if (finalRiskPercentage >= 50) return "Potentially Misleading Message";
          if (finalRiskPercentage >= 25) return "Communication With Some Concerns";
          return "Standard Digital Communication";
          
        case "social":
          if (finalRiskPercentage >= 75) return "Highly Questionable Social Media Content";
          if (finalRiskPercentage >= 50) return "Potentially Misleading Social Content";
          if (finalRiskPercentage >= 25) return "Social Media Content With Some Concerns";
          return "Standard Social Media Content";
          
        case "health":
          if (finalRiskPercentage >= 75) return "Potentially Dangerous Health Claims";
          if (finalRiskPercentage >= 50) return "Questionable Health Information";
          if (finalRiskPercentage >= 25) return "Health Content Requiring Verification";
          return "General Health Information";
          case "audio": // General audio category, if not overridden by specific scam detection
          if (finalRiskPercentage >= 75) return "Voice Recording With Critical Security Risks";
          if (finalRiskPercentage >= 50) return "Voice Recording With Significant Concerns";
          if (finalRiskPercentage >= 25) return "Voice Recording With Moderate Concerns";
          return "Normal Voice Recording";
          
        case "website":
          if (finalRiskPercentage >= 75) return "Website With Critical Security Risks";
          if (finalRiskPercentage >= 50) return "Website With Significant Security Concerns";
          if (finalRiskPercentage >= 25) return "Website With Moderate Security Concerns";
          return "Standard Website Content";
          
        case "general":
        default:
          if (finalRiskPercentage >= 75) return "Content With Critical Security Concerns";
          if (finalRiskPercentage >= 50) return "Content With Significant Risk Factors";
          if (finalRiskPercentage >= 25) return "Content With Moderate Concerns";
          return "Content With Minimal Risk Factors";
      }
    }
    
    // Use API's assessment only if it doesn't contain "scam"
    if (analysisResult.assessment && !apiAssessmentHasScam) {
      return analysisResult.assessment;
    }
    
    // Ultimate fallback
    return getConsistentRiskStatus(finalRiskPercentage);
  };

  const assessmentText = getAssessmentText();
  // --- Enhanced Advice Section ---
  let displayAdvice: string | undefined = undefined;
  const audioScamWarning = "This voice recording shows strong characteristics of a scam. ";
  const filipinoInvestmentScamWarning = "This appears to be a Filipino investment scam promising guaranteed earnings with minimal investment. ";
  const genericAdviceKeywords = ["no specific advice available", "no advice provided", "no specific advice"];

  const apiProvidedAdvice = analysisResult.advice;
  const isApiAdviceGeneric = !apiProvidedAdvice || 
    genericAdviceKeywords.some(keyword => apiProvidedAdvice.toLowerCase().includes(keyword));

  if (isApiAdviceGeneric) {
    // API advice is generic or missing - provide more specific advice based on detected indicators
    if (detectionResult.patternMatches["Filipino investment scam"]) {
      // Specific advice for Filipino investment scams
      displayAdvice = filipinoInvestmentScamWarning + 
        "These are typically fraudulent schemes. Legitimate investments never guarantee earnings or promise 'no risk' returns. " +
        "Do not send any money, share personal information, or communicate further. Report this to authorities immediately.";
    } else if (isAudioClearlyScam) {
      displayAdvice = audioScamWarning + "Do not trust this recording. Do not call any numbers, click any links, or provide any personal information. Report this immediately.";
    } else {
      // Fallback to risk-based generic advice if not a clear audio scam but API advice is generic
      if (finalRiskPercentage >= 75) {
        displayAdvice = "This content is highly suspicious and likely unsafe. Do not interact with it. Avoid sharing any personal or financial information. Report this content to relevant authorities immediately.";
      } else if (finalRiskPercentage >= 50) {
        displayAdvice = "Exercise significant caution with this content. Verify information through trusted, independent sources before taking any action. Be wary of requests for personal data or money.";
      } else if (finalRiskPercentage >= 25) {
        displayAdvice = "Review this content with some caution. If it involves requests or claims, cross-check information with other reliable sources. Be mindful of general internet safety practices.";
      } else {
        displayAdvice = "This content appears to be low risk. However, always maintain general awareness and practice safe internet habits.";
      }
    }  } else {
    // API provided specific advice
    displayAdvice = apiProvidedAdvice;
    
    // Add appropriate warning prefix based on scam type detected
    if (detectionResult.patternMatches["Filipino investment scam"] && apiProvidedAdvice && 
        !apiProvidedAdvice.toLowerCase().includes("filipino") && 
        !apiProvidedAdvice.toLowerCase().includes("investment scam") &&
        !apiProvidedAdvice.toLowerCase().includes("guaranteed earnings")) {
      // Add Filipino investment scam warning
      displayAdvice = filipinoInvestmentScamWarning + apiProvidedAdvice;
    }
    else if (isAudioClearlyScam && apiProvidedAdvice && !apiProvidedAdvice.toLowerCase().startsWith(audioScamWarning.toLowerCase())) {
      // If it's an audio scam and the specific API advice doesn't already start with a similar warning, prepend it.
      // This avoids double warnings if the API advice is already audio-scam-specific.
      if (!apiProvidedAdvice.toLowerCase().includes("audio") && !apiProvidedAdvice.toLowerCase().includes("voice")) {
         displayAdvice = audioScamWarning + apiProvidedAdvice;
      }
    }
  }
  
  // Final fallback, though previous logic should cover most cases
  if (!displayAdvice) {
    displayAdvice = "No specific advice available. Always exercise caution online.";
  }

  // --- Enhanced Safety & Security Tips ---
  let displayTutorialsAndTips: string[] = analysisResult.tutorialsAndTips || [];
  const audioScamSafetyTip = "Be especially cautious with voice messages asking for urgent action, payments, or personal information. Always verify such requests through an official, independent channel before responding.";
  const defaultSafetyTips = [
      "Verify the identity of anyone contacting you, especially if unsolicited, before sharing personal information.",
      "Be wary of requests for money, gift cards, or financial details, particularly if they create urgency or fear.",
      "Use strong, unique passwords for all your accounts and enable two-factor authentication wherever possible.",
      "Keep your software, operating system, and antivirus programs updated to protect against known vulnerabilities.",
      "Think before you click on links or download attachments, especially from unknown or unverified sources."
  ];

  if (!displayTutorialsAndTips.length || (displayTutorialsAndTips.length === 1 && displayTutorialsAndTips[0].toLowerCase().includes("verify the identity"))) {
    displayTutorialsAndTips = [...defaultSafetyTips];
  }
  
  if (isAudioClearlyScam && !displayTutorialsAndTips.some(tip => tip.toLowerCase().includes("voice message"))) {
    displayTutorialsAndTips.push(audioScamSafetyTip);
  }


  // --- Enhanced Reporting Resources ---
  let displayComplaintFilingIntro = analysisResult.complaintFilingInfo?.introduction;
  const genericComplaintIntroKeywords = ["report suspicious", "no specific reporting", "authorities to protect yourself"];
  const isComplaintIntroGeneric = !displayComplaintFilingIntro || 
                                  genericComplaintIntroKeywords.some(keyword => displayComplaintFilingIntro.toLowerCase().includes(keyword));

  if (isComplaintIntroGeneric) {
    if (isAudioClearlyScam) {
      displayComplaintFilingIntro = "This audio recording appears to be a scam. Reporting such attempts helps protect others. Consider using the following resources:";
    } else if (finalRiskPercentage >= 50) {
      displayComplaintFilingIntro = "This content has raised significant concerns. If you believe it's harmful or deceptive, reporting it can make a difference. Resources:";
    } else {
      displayComplaintFilingIntro = "If you encounter content you believe is suspicious or harmful, consider reporting it. Here are some general resources:";
    }
  } else if (!displayComplaintFilingIntro) {
     displayComplaintFilingIntro = "Consider reporting highly suspicious content to relevant authorities.";
  }

  let displayComplaintAgencies: ApiReportAgency[] = analysisResult.complaintFilingInfo?.agencies || [];
  if (!displayComplaintAgencies.length) {
    displayComplaintAgencies = [
      { name: "Federal Trade Commission (FTC)", url: "https://reportfraud.ftc.gov/", description: "For reporting scams, fraud, and bad business practices in the US." },
      { name: "Internet Crime Complaint Center (IC3)", url: "https://www.ic3.gov/", description: "For reporting internet-related criminal complaints in the US (a partnership between the FBI and NW3C)." }
    ];
    // Example for Philippines, can be expanded with more context
    if (isAudioClearlyScam && (audioAnalysisContent && audioAnalysisContent.toLowerCase().includes("peso") || displayExplanationTagalog.includes("peso"))) {
        displayComplaintAgencies.push({ name: "PNP Anti-Cybercrime Group (Philippines)", url: "https://acg.pnp.gov.ph/eComplaint/", description: "For reporting cybercrimes in the Philippines." });
    }
  }
  
  return (
    <div className="space-y-6">      {/* Main Results Card */}
      <div className={`p-6 rounded-xl border-2 ${statusStyles.containerClasses} shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${statusStyles.textClasses} flex items-center`}>
            <span className="mr-3 text-3xl">{analysisResult.contentType?.toLowerCase() === 'audio' ? '🎤' : statusStyles.icon}</span>
            {displayStatus}
          </h2>
          <span className={`px-4 py-2 rounded-full text-lg font-bold ${statusStyles.badgeClasses} shadow-md`}>
            {`${Math.round(finalRiskPercentage)}%`}
          </span>
        </div>
        
        {/* Risk Visualization */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden shadow-inner relative">
            <div 
              className={`h-6 rounded-full ${statusStyles.barColor} transition-all duration-1000 ease-out flex items-center justify-end pr-2`} 
              style={{ width: `${finalRiskPercentage}%` }}
              title={`Risk level: ${Math.round(finalRiskPercentage)}%`}
            >
              {finalRiskPercentage > 15 && (
                <span className="text-xs font-bold text-white drop-shadow-md">
                  {Math.round(finalRiskPercentage)}%
                </span>
              )}
            </div>
            {finalRiskPercentage <= 15 && (
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-bold text-gray-700 dark:text-gray-300">
                {Math.round(finalRiskPercentage)}%
              </span>
            )}
          </div>
            
          <div className="grid grid-cols-4 text-xs mt-2 font-medium">
            <div className="text-green-600 dark:text-green-400 flex flex-col items-center">
              <span className={finalRiskPercentage < 25 ? 'font-bold' : ''}>
                {finalRiskPercentage < 25 ? `${Math.round(finalRiskPercentage)}%` : '0-24%'}
              </span>
              <span>Low Risk</span>
            </div>
            <div className="text-yellow-600 dark:text-yellow-400 flex flex-col items-center">
              <span className={finalRiskPercentage >= 25 && finalRiskPercentage < 50 ? 'font-bold' : ''}>
                {finalRiskPercentage >= 25 && finalRiskPercentage < 50 ? `${Math.round(finalRiskPercentage)}%` : '25-49%'}
              </span>
              <span>Moderate Risk</span>
            </div>
            <div className="text-orange-600 dark:text-orange-400 flex flex-col items-center">
              <span className={finalRiskPercentage >= 50 && finalRiskPercentage < 75 ? 'font-bold' : ''}>
                {finalRiskPercentage >= 50 && finalRiskPercentage < 75 ? `${Math.round(finalRiskPercentage)}%` : '50-74%'}
              </span>
              <span>High Risk</span>
            </div>
            <div className="text-red-600 dark:text-red-400 flex flex-col items-center">
              <span className={finalRiskPercentage >= 75 ? 'font-bold' : ''}>
                {finalRiskPercentage >= 75 ? `${Math.round(finalRiskPercentage)}%` : '75-100%'}
              </span>
              <span>Very High Risk</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">          <div className="space-y-3">
            {analysisResult.contentType && (
              <p className="text-sm"><strong className={statusStyles.textClasses}>Content Type:</strong> {analysisResult.contentType}</p>
            )}
            <p className="text-sm"><strong className={statusStyles.textClasses}>Assessment:</strong> {assessmentText}</p>
            <p className="text-sm"><strong className={statusStyles.textClasses}>AI Confidence:</strong> {analysisResult.confidence || "Unknown"}</p>
            {(analysisResult.contentPurpose || (isAudioClearlyScam && analysisResult.audienceAnalysis)) && (
              <p className="text-sm"><strong className={statusStyles.textClasses}>Content Purpose:</strong> {analysisResult.contentPurpose || (isAudioClearlyScam ? "See Audience Analysis below for purpose inferred from audio" : "Not specified")}</p>
            )}
            {(analysisResult.audienceTarget || (isAudioClearlyScam && analysisResult.audienceAnalysis)) && (
              <p className="text-sm"><strong className={statusStyles.textClasses}>Target Audience:</strong> {analysisResult.audienceTarget || (isAudioClearlyScam ? "See Audience Analysis below for target inferred from audio" : "Not specified")}</p>
            )}
            {isAudioClearlyScam && analysisResult.audienceAnalysis && (
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                <p className="text-sm"><strong className={statusStyles.textClasses}>Audience Analysis (from Audio):</strong></p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed mt-1">{analysisResult.audienceAnalysis}</p>
              </div>
            )}
          </div>          <div className={`p-4 rounded-lg ${statusStyles.badgeClasses} bg-opacity-20 border border-current border-opacity-30`}>            <p className="font-bold text-lg">
              {finalRiskPercentage >= 75 
                ? '🚨 Very High Risk Content' 
                : finalRiskPercentage >= 50 
                  ? '⚠️ High Risk Content'
                  : finalRiskPercentage >= 25 
                    ? '⚠️ Moderate Risk Content'
                    : '✅ Low Risk Content'
              } ({Math.round(finalRiskPercentage)}%)
            </p><p className="text-sm mt-2 opacity-90">
              {analysisResult.riskSummary && !isRiskSummaryInconsistent(analysisResult.riskSummary, finalRiskPercentage)
                ? analysisResult.riskSummary 
                : (finalRiskPercentage < 25 
                    ? '✅ Low risk content with no concerning elements detected' 
                    : finalRiskPercentage < 50 
                      ? '⚠️ Content with some potentially concerning elements'
                      : finalRiskPercentage < 75
                        ? '🚨 High risk content with multiple concerning elements'
                        : '🔴 Very high risk content that requires careful consideration')
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* Detected Indicators Section */}
      {finalRiskPercentage > 15 && (
        <div className={`p-6 rounded-xl border-2 ${statusStyles.containerClasses} shadow-lg`}>          <h3 className={`text-xl font-bold mb-4 ${statusStyles.textClasses} flex items-center`}>
            <span className="mr-2">🔎</span>
            Content Analysis Factors
          </h3>{/* Use API-provided indicators if available, otherwise fallback to detected ones */}
            {(analysisResult.indicators && analysisResult.indicators.length > 0) ? (
              <div className="bg-gray-900/80 rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                  {analysisResult.indicators.map((indicator, index) => (
                    <span 
                      key={index}
                      className={`py-2 px-4 rounded-lg text-sm font-medium ${getBadgeColorClass()} border shadow-md inline-block`}
                    >
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>            ) : finalIndicators.length === 0 ? (
              <div className="bg-white/60 dark:bg-gray-900/30 rounded-lg p-4 border border-current border-opacity-30">
                <p className="text-sm italic text-gray-600 dark:text-gray-400">
                  {finalRiskPercentage < 25 
                    ? 'No significant factors detected in this content.' 
                    : 'No specific factors identified. Please refer to the detailed explanation below.'}
                </p>
              </div>
            ) : (
              <div className="bg-gray-900/80 rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                  {finalIndicators.map((indicator, index) => (
                    <span 
                      key={index}
                      className={`py-2 px-4 rounded-lg text-sm font-medium ${getBadgeColorClass()} border shadow-md inline-block`}
                    >
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}      {/* Image Analysis Section */}
      {analysisResult.image_analysis && (
        <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-blue-800 dark:text-blue-200 flex items-center">
            <span className="mr-2">🖼️</span>
            Image Analysis Results
          </h3>          <div className="bg-white dark:bg-blue-950/50 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
            <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap leading-relaxed">{analysisResult.image_analysis || "No image analysis available."}</p>
          </div>
        </div>
      )}
      
      {/* Audio Analysis Section */}
      {analysisResult.audioAnalysis && ( // Changed from audio_analysis
        <div className="p-6 rounded-xl bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-purple-800 dark:text-purple-200 flex items-center">
            <span className="mr-2">🎤</span>
            Voice Recording Analysis
          </h3>            <div className="bg-white dark:bg-purple-950/50 rounded-lg p-4 border border-purple-200 dark:border-purple-600">
            {/* Main audio analysis content - using same risk assessment as text content */}
            <div className="mb-4">
              <h4 className="text-md font-semibold mb-2 text-purple-700 dark:text-purple-300">Content Transcript Analysis:</h4>
              <p className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap leading-relaxed">{analysisResult.audioAnalysis || "No audio analysis available."}</p>
            </div>
            
            {/* Audio risk rating - uses EXACTLY the same risk assessment as text content */}
            <div className="mb-4 p-3 bg-purple-100/50 dark:bg-purple-900/30 rounded-lg">
              <h4 className="text-md font-semibold mb-2 text-purple-700 dark:text-purple-300">Risk Assessment:</h4>
              <p className="text-sm">
                <span className="font-medium">
                  {finalRiskPercentage >= 75 
                    ? '🚨 Very High Risk Content' 
                    : finalRiskPercentage >= 50 
                      ? '⚠️ High Risk Content'
                      : finalRiskPercentage >= 25 
                        ? '⚠️ Moderate Risk Content'
                        : '✅ Low Risk Content'}
                </span> - {Math.round(finalRiskPercentage)}% risk detected
              </p>
              
              {/* Show risk indicators from unified analysis system */}
              {Object.keys(detectionResult.patternMatches).length > 0 && (
                <div className="mt-2 text-xs text-purple-800 dark:text-purple-300">
                  <p className="font-medium">Risk indicators from content analysis:</p>
                  <p>
                    {Object.keys(detectionResult.patternMatches)
                      .slice(0, 5)
                      .join(", ")}
                    {Object.keys(detectionResult.patternMatches).length > 5 ? ", ..." : ""}
                  </p>
                </div>
              )}
            </div>

            {/* If audio has keyPoints, display them */}
            {analysisResult.keyPoints && analysisResult.keyPoints.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-2 text-purple-700 dark:text-purple-300">Key Points (from audio transcript):</h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysisResult.keyPoints.map((point, idx) => (
                    <li key={`kp-audio-${idx}`} className="text-sm text-purple-900 dark:text-purple-100 pl-2">{point}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Display indicators specific to audio if available */}
            {analysisResult.indicators && analysisResult.indicators.length > 0 && (
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-2 text-purple-700 dark:text-purple-300">Detected Factors:</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.indicators.map((indicator, idx) => (
                    <span key={`ind-audio-${idx}`} className="px-3 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full text-xs">{indicator}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Display content-specific detail fields from audio analysis if available*/}
            {analysisResult.contentDetails && (
              <div className="mt-4 border-t border-purple-200 dark:border-purple-700 pt-4">
                <h4 className="text-md font-semibold mb-2 text-purple-700 dark:text-purple-300">Audio Details:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {analysisResult.contentDetails.format && (
                    <div><span className="font-medium">Format:</span> {analysisResult.contentDetails.format}</div>
                  )}
                  {analysisResult.contentDetails.duration && (
                    <div><span className="font-medium">Duration:</span> {analysisResult.contentDetails.duration}</div>
                  )}
                  {analysisResult.contentDetails.speakers !== undefined && (
                    <div><span className="font-medium">Speakers:</span> {analysisResult.contentDetails.speakers}</div>
                  )}
                  {analysisResult.contentDetails.languages && analysisResult.contentDetails.languages.length > 0 && (
                    <div><span className="font-medium">Languages:</span> {analysisResult.contentDetails.languages.join(', ')}</div>
                  )}
                </div>
                {analysisResult.contentDetails.contentSummary && (
                  <div className="mt-2">
                    <span className="font-medium">Content Summary:</span> 
                    <p className="mt-1 text-sm">{analysisResult.contentDetails.contentSummary}</p>
                  </div>
                )}
                {analysisResult.contentDetails.contentSummaryTagalog && (
                  <div className="mt-2">
                    <span className="font-medium">Content Summary (Tagalog):</span> 
                    <p className="mt-1 text-sm">{analysisResult.contentDetails.contentSummaryTagalog}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
            <span className="mr-2">🔍</span>
            Explanation (English)
          </h3>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{displayExplanation}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
            <span className="mr-2">🔍</span>
            Paliwanag (Tagalog)
          </h3>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{displayExplanationTagalog}</p> {/* Changed from analysisResult.explanationTagalog */}
          </div>
        </div>
      </div>

      {/* Advice Section */}
      <div className={`p-6 rounded-xl border-2 ${statusStyles.containerClasses} shadow-lg`}>
        <h3 className={`text-xl font-bold mb-4 ${statusStyles.textClasses} flex items-center`}>
          <span className="mr-2">💡</span>
          Recommended Actions
        </h3>
        <div className="bg-white dark:bg-gray-900/30 rounded-lg p-4 border border-current border-opacity-30">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayAdvice}</p>
        </div>
      </div>

      {/* How to Avoid Scams (Tutorials and Tips) */}
      <div className={`p-6 rounded-xl border-2 ${statusStyles.containerClasses} shadow-lg`}>
        <h3 className={`text-xl font-bold mb-4 ${statusStyles.textClasses} flex items-center`}>
          <span className="mr-2">🛡️</span>
          Safety & Security Tips
        </h3>
        <div className="bg-white dark:bg-gray-900/30 rounded-lg p-4 border border-current border-opacity-30">
          <ul className="space-y-3">
            {displayTutorialsAndTips.length > 0 ?
              displayTutorialsAndTips.map((tip, index) => (
                <li key={index} className="flex items-start text-sm">
                  <span className={`flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5`}>
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              )) :
              <li className="flex items-start text-sm">
                <span className="leading-relaxed">No specific safety tips available at this time. Always practice general online safety: be cautious with unsolicited messages, verify information, and protect your personal data.</span>
              </li>
            }
          </ul>
        </div>
      </div>

      {/* Reporting Section (Complaint Filing Info) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
          <span className="mr-2">📢</span>
          Relevant Reporting Resources
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          {displayComplaintFilingIntro && (
            <p className="text-sm mb-3 italic text-gray-600 dark:text-gray-400">
              {displayComplaintFilingIntro}
            </p>
          )}
          <ul className="space-y-3">
            {displayComplaintAgencies.length > 0 ?
              displayComplaintAgencies.map((agency: ApiReportAgency, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                  <div>
                    <a
                      href={agency.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium hover:underline transition-colors"
                    >
                      {agency.name}
                    </a>
                    {agency.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{agency.description}</p>
                    )}
                  </div>
                </li>
              )) :
              <p className="text-sm text-gray-600 dark:text-gray-400">No specific reporting agencies listed. You can search for local consumer protection or cybercrime reporting agencies in your region (e.g., search for 'report scam [your country/region]').</p>
            }
          </ul>
        </div>
      </div>

      {/* Audio Content Verification Section - Enhanced */}
      {(analysisResult.audioContentVerification || analysisResult.audioContentVerificationTagalog) && (
        <div className="p-6 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 border-2 border-cyan-200 dark:border-cyan-700 shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-cyan-800 dark:text-cyan-200 flex items-center">
            <span className="mr-2">🗣️</span>
            Audio Content Verification
          </h3>
          <div className="bg-white dark:bg-cyan-950/50 rounded-lg p-4 border border-cyan-200 dark:border-cyan-600">
            {/* Add a verification status indicator based on risk percentage */}
            <div className="mb-4 flex items-center">
              <div className={`w-4 h-4 rounded-full mr-2 ${
                finalRiskPercentage >= 75 ? 'bg-red-500' : 
                finalRiskPercentage >= 50 ? 'bg-orange-500' : 
                finalRiskPercentage >= 25 ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
                {finalRiskPercentage >= 75 ? 'Highly Suspicious Content' : 
                 finalRiskPercentage >= 50 ? 'Potentially Misleading Content' : 
                 finalRiskPercentage >= 25 ? 'Content With Minor Concerns' : 'Likely Legitimate Content'}
              </span>
            </div>

            {analysisResult.audioContentVerification && (
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-2 text-cyan-700 dark:text-cyan-300">Verification Analysis:</h4>
                <p className="text-sm text-cyan-900 dark:text-cyan-100 whitespace-pre-wrap leading-relaxed">
                  {analysisResult.audioContentVerification}
                </p>
              </div>
            )}
            
            {/* Technical details from audio verification */}
            {isAudioClearlyScam && (
              <div className="mb-4 p-3 bg-cyan-100/50 dark:bg-cyan-900/30 rounded-lg">
                <h4 className="text-sm font-semibold mb-1 text-cyan-700 dark:text-cyan-300">Technical Analysis:</h4>
                <p className="text-sm text-cyan-900 dark:text-cyan-100">
                  Voice recordings with scam characteristics often contain specific vocal patterns, 
                  including artificial urgency, pressuring language, and inconsistent audio quality. 
                  This recording shows these characteristics.
                </p>
              </div>
            )}
            
            {analysisResult.audioContentVerificationTagalog && (
              <>
                <div className="mt-4 pt-3 border-t border-cyan-200 dark:border-cyan-700">
                  <h4 className="text-lg font-semibold mb-2 text-cyan-800 dark:text-cyan-200">
                    Patunay sa Nilalaman ng Audio (Tagalog)
                  </h4>
                  <p className="text-sm text-cyan-900 dark:text-cyan-100 whitespace-pre-wrap leading-relaxed">
                    {analysisResult.audioContentVerificationTagalog}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content Authenticity Check (formerly True vs. False Analysis Section) - Enhanced */}
      {(analysisResult.true_vs_false || analysisResult.true_vs_false_tagalog || isAudioClearlyScam) && (
        <div className="p-6 rounded-xl bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-green-800 dark:text-green-200 flex items-center">
            <span className="mr-2">✅</span>
            Content Authenticity Check
          </h3>
          <div className="bg-white dark:bg-green-950/50 rounded-lg p-4 border border-green-200 dark:border-green-600">
            {/* Authenticity Rating */}
            <div className="mb-4 flex items-center">
              <div className={`w-4 h-4 rounded-full mr-2 ${
                finalRiskPercentage >= 75 ? 'bg-red-500' : 
                finalRiskPercentage >= 50 ? 'bg-orange-500' : 
                finalRiskPercentage >= 25 ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                {finalRiskPercentage >= 75 ? 'Very Low Authenticity Rating' : 
                 finalRiskPercentage >= 50 ? 'Low Authenticity Rating' : 
                 finalRiskPercentage >= 25 ? 'Medium Authenticity Rating' : 'High Authenticity Rating'}
              </span>
            </div>
            
            {analysisResult.true_vs_false && (
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-2 text-green-700 dark:text-green-300">Authenticity Analysis:</h4>
                <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap leading-relaxed">
                  {analysisResult.true_vs_false}
                </p>
              </div>
            )}
              {/* For audio content specifically - enhanced with investment scam detection */}
            {analysisResult.contentType?.toLowerCase() === 'audio' && (
              <div className="mb-4 p-3 bg-green-100/50 dark:bg-green-900/30 rounded-lg">
                <h4 className="text-sm font-semibold mb-1 text-green-700 dark:text-green-300">Audio Authenticity Factors:</h4>
                <ul className="list-disc list-inside text-sm text-green-900 dark:text-green-100">
                  <li>Background noise consistency: {isAudioClearlyScam ? "Suspicious variations detected" : "Normal levels"}</li>
                  <li>Voice modulation: {isAudioClearlyScam ? "Potential artificial manipulation" : "Natural speaking patterns"}</li>
                  <li>Content consistency: {isAudioClearlyScam ? "Contains logical inconsistencies" : "Logically consistent"}</li>
                  {isAudioClearlyScam && <li>Urgency tactics: Present - creating artificial time pressure</li>}
                  {/* Filipino investment scam specific factors */}
                  {detectionResult.patternMatches["Filipino investment scam"] && (
                    <>
                      <li>Investment fraud patterns: Detected typical Filipino investment scam terms</li>
                      <li>Risk-free claims: Suspicious guarantees of no-risk investments</li>
                      <li>Limited slot tactics: Creating false scarcity</li>
                    </>
                  )}
                  {detectionResult.patternMatches["Investment opportunity"] && !detectionResult.patternMatches["Filipino investment scam"] && (
                    <li>Investment fraud patterns: Contains suspicious investment terminology</li>
                  )}
                </ul>
              </div>
            )}
            
            {analysisResult.true_vs_false_tagalog && (
              <>
                <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-700">
                  <h4 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-200">
                    Pagsusuri ng Katotohanan (Tagalog)
                  </h4>
                  <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap leading-relaxed">
                    {analysisResult.true_vs_false_tagalog}
                  </p>
                </div>
              </>
            )}
            
            {/* Fallback message if provided fields are empty */}
            {!analysisResult.true_vs_false && !analysisResult.true_vs_false_tagalog && !isAudioClearlyScam && (
                <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap leading-relaxed">
                    No specific authenticity information available.
                </p>
            )}
          </div>
        </div>
      )}

      {/* Reporting information */}
    </div>
  );
}
