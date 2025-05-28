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
  // Use direct probability from API (0-100)
  const apiPercent = analysisResult.probability;
  
  // Initialize indicators for detection
  const indicators = getInitializedIndicators();
    // Combine all text for analysis
  const content = (
    (analysisResult.explanation || "") + " " + // Changed from explanation_english
    (scamContent || "") + " " + 
    (analysisResult.image_analysis || "") + " " +
    (analysisResult.audioAnalysis || "") // Changed from audio_analysis
  );
  
  // Run the detection algorithm
  const detectionResult = detectIndicators(content, indicators);
    // Calculate the final risk percentage
  let finalRiskPercentage = calculateRiskPercentage(
    detectionResult.patternMatches,
    detectionResult,
    apiPercent
  );
  
  // Additional safeguard to ensure consistent risk display
  // Make sure percentage values don't fall right at category boundaries
  if (finalRiskPercentage === 50 || finalRiskPercentage === 49) finalRiskPercentage = 48; // Clear moderate
  if (finalRiskPercentage === 75 || finalRiskPercentage === 74) finalRiskPercentage = 73; // Clear high
  if (finalRiskPercentage === 25 || finalRiskPercentage === 24) finalRiskPercentage = 23; // Clear low
  
  // Get UI styles based on calculated risk percentage to ensure consistency
  const statusStyles = getColorByPercentage(finalRiskPercentage);
    // Extract any additional indicators from the AI explanation
  const extractedIndicators = extractScamIndicators(analysisResult.explanation); // Changed from explanation_english
  
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
  };
  // Generate a consistent status based on the calculated risk percentage
  const getConsistentRiskStatus = (percentage: number): string => {
    // Using strict thresholds to ensure UI consistency
    if (percentage >= 75) return "Very High Risk Content";
    if (percentage >= 50) return "High Risk Content";
    if (percentage >= 25) return "Moderate Risk Content";
    return "Low Risk Content";
  };
  // Use API's status if present, otherwise fallback to derived status
  const displayStatus = analysisResult.status || 
    (analysisResult.riskLevel ? 
      `${analysisResult.riskLevel.charAt(0).toUpperCase() + analysisResult.riskLevel.slice(1)} Risk Detected` :
      getConsistentRiskStatus(finalRiskPercentage)); // Fallback to calculated
  // Determine assessment text based on risk level rather than focusing only on scams
  const getAssessmentText = (): string => {
    // First use the direct assessment if available from API
    if (analysisResult.assessment) return analysisResult.assessment;
    
    // Otherwise calculate it based on risk percentage for a more neutral assessment
    if (finalRiskPercentage >= 75) return "Very High Risk Content";
    if (finalRiskPercentage >= 50) return "High Risk Content";
    if (finalRiskPercentage >= 25) return "Moderate Risk Content";
    return "Low Risk Content";
  };

  const assessmentText = getAssessmentText();
  
  return (
    <div className="space-y-6">
      {/* Main Results Card */}
      <div className={`p-6 rounded-xl border-2 ${statusStyles.containerClasses} shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${statusStyles.textClasses} flex items-center`}>
            <span className="mr-3 text-3xl">{statusStyles.icon}</span>
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
            {analysisResult.contentPurpose && (
              <p className="text-sm"><strong className={statusStyles.textClasses}>Content Purpose:</strong> {analysisResult.contentPurpose}</p>
            )}
            {analysisResult.audienceTarget && (
              <p className="text-sm"><strong className={statusStyles.textClasses}>Target Audience:</strong> {analysisResult.audienceTarget}</p>
            )}
          </div>
          <div className={`p-4 rounded-lg ${statusStyles.badgeClasses} bg-opacity-20 border border-current border-opacity-30`}>            <p className="font-bold text-lg">
              {finalRiskPercentage >= 75 
                ? '🚨 Very High Risk Content' 
                : finalRiskPercentage >= 50 
                  ? '⚠️ High Risk Content'
                  : finalRiskPercentage >= 25 
                    ? '⚠️ Moderate Risk Content'
                    : '✅ Low Risk Content'
              } ({Math.round(finalRiskPercentage)}%)
            </p><p className="text-sm mt-2 opacity-90">
              {analysisResult.riskSummary || 
                (finalRiskPercentage < 25 
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
          </h3>          <div className="bg-white dark:bg-purple-950/50 rounded-lg p-4 border border-purple-200 dark:border-purple-600">
            <p className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap leading-relaxed">{analysisResult.audioAnalysis || "No audio analysis available."}</p>
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
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{analysisResult.explanation || "No English explanation available."}</p> {/* Changed from explanation_english */}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
            <span className="mr-2">🔍</span>
            Paliwanag (Tagalog)
          </h3>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{analysisResult.explanationTagalog || "Hindi available ang paliwanag sa Tagalog."}</p> {/* Changed from explanation_tagalog */}
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
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{analysisResult.advice || "No specific advice available."}</p>
        </div>
      </div>

      {/* Limited Context Warning - This section is removed as limited_context is no longer part of ScamDetectionResult */}

      {/* How to Avoid Scams (Tutorials and Tips) */}
      <div className={`p-6 rounded-xl border-2 ${statusStyles.containerClasses} shadow-lg`}>        <h3 className={`text-xl font-bold mb-4 ${statusStyles.textClasses} flex items-center`}>
          <span className="mr-2">🛡️</span>
          Safety & Security Tips
        </h3>
        <div className="bg-white dark:bg-gray-900/30 rounded-lg p-4 border border-current border-opacity-30">
          <ul className="space-y-3">
            {analysisResult.tutorialsAndTips?.length ? // Changed from how_to_avoid_scams
              analysisResult.tutorialsAndTips.map((tip, index) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              )) : 
              <li className="flex items-start text-sm">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  1
                </span>
                <span className="leading-relaxed">Verify the identity of anyone contacting you online or by phone before sharing any personal information.</span>
              </li>
            }
          </ul>
        </div>
      </div>

      {/* Reporting Section (Complaint Filing Info) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
          <span className="mr-2">📢</span>
          Relevant Reporting Resources
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          {analysisResult.complaintFilingInfo?.introduction && (
            <p className="text-sm mb-3 italic text-gray-600 dark:text-gray-400">
              {analysisResult.complaintFilingInfo.introduction}
            </p>
          )}
          <ul className="space-y-3">
            {analysisResult.complaintFilingInfo?.agencies?.length ? 
              analysisResult.complaintFilingInfo.agencies.map((agency: ApiReportAgency, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                  <div>
                    <a 
                      href={agency.url} // Changed from link to url
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
              <>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <a 
                    href="https://www.consumer.ftc.gov/features/scam-alerts" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium hover:underline transition-colors"
                  >
                    Federal Trade Commission (FTC)
                  </a>
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <a 
                    href="https://www.ic3.gov" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium hover:underline transition-colors"
                  >
                    Internet Crime Complaint Center (IC3)
                  </a>
                </li>
              </>
            }
          </ul>
        </div>
      </div>

      {/* True vs False Information */}
      {(analysisResult.true_vs_false || analysisResult.true_vs_false_tagalog) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analysisResult.true_vs_false && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-green-800 dark:text-green-200 flex items-center">
                <span className="mr-2">🔍</span>
                True vs False Information (English)
              </h3>
              <div className="bg-white dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-600">
                <p className="text-sm text-green-800 dark:text-green-100 whitespace-pre-wrap leading-relaxed">
                  {analysisResult.true_vs_false || "No information available on distinguishing true vs false information."}
                </p>
              </div>
            </div>
          )}
          
          {analysisResult.true_vs_false_tagalog && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-green-800 dark:text-green-200 flex items-center">
                <span className="mr-2">🔍</span>
                Tunay vs Hindi Tunay (Tagalog)
              </h3>
              <div className="bg-white dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-600">
                <p className="text-sm text-green-800 dark:text-green-100 whitespace-pre-wrap leading-relaxed">
                  {analysisResult.true_vs_false_tagalog || "Walang available na impormasyon tungkol sa pagkilala ng totoo sa hindi totoong impormasyon."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* What to Do Section - Adding new section to provide neutral advice based on content analysis */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-700 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-indigo-800 dark:text-indigo-200 flex items-center">
          <span className="mr-2">🛠️</span>
          What To Do With This Content
        </h3>
        <div className="bg-white dark:bg-indigo-950/30 rounded-lg p-4 border border-indigo-200 dark:border-indigo-600">
          <p className="text-sm text-indigo-800 dark:text-indigo-100 whitespace-pre-wrap leading-relaxed mb-4">
            Based on the analysis of this content, here are some recommended actions:
          </p>
          <ul className="space-y-3">
            {finalRiskPercentage >= 75 ? (
              <>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">!</span>
                  <span className="leading-relaxed">Exercise extreme caution with this content as it contains significant indicators of potential harm.</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                  <span className="leading-relaxed">Do not provide personal information, financial details, or access to your devices.</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                  <span className="leading-relaxed">Consider reporting this content to the appropriate authorities or platform administrators.</span>
                </li>
              </>
            ) : finalRiskPercentage >= 50 ? (
              <>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                  <span className="leading-relaxed">Approach this content with caution as our analysis detected potential concerns.</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                  <span className="leading-relaxed">Verify information through official or trusted sources before taking action.</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                  <span className="leading-relaxed">Be especially cautious if the content requests any personal or financial information.</span>
                </li>
              </>
            ) : finalRiskPercentage >= 25 ? (
              <>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                  <span className="leading-relaxed">Review this content with some caution as our analysis indicates some minor concerns.</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                  <span className="leading-relaxed">Consider cross-checking information with other sources if you have any doubts.</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                  <span className="leading-relaxed">Use general internet safety practices when interacting with this content.</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                  <span className="leading-relaxed">This content appears to be low risk based on our analysis.</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                  <span className="leading-relaxed">As with all online content, standard internet safety practices are still recommended.</span>
                </li>
                <li className="flex items-start text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                  <span className="leading-relaxed">Feel free to interact with the content while adhering to normal digital literacy practices.</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
