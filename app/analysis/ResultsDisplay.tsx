"use client";

import { ScamDetectionResult } from './interfaces';
import { extractPercentage, extractScamIndicators, getColorByPercentage } from './utils';
import { getInitializedIndicators, detectIndicators, calculateRiskPercentage } from './indicators';

interface ResultsDisplayProps {
  analysisResult: ScamDetectionResult;
  scamContent: string;
}

// Separate component for results display to improve code organization
export default function ResultsDisplay({ analysisResult, scamContent }: ResultsDisplayProps) {
  // Extract percentage from the API result
  const apiPercent = extractPercentage(analysisResult.scam_probability);
  
  // Initialize indicators for detection
  const indicators = getInitializedIndicators();
    // Combine all text for analysis
  const content = (
    (analysisResult.explanation_english || "") + " " + 
    (scamContent || "") + " " + 
    (analysisResult.image_analysis || "") + " " +
    (analysisResult.audio_analysis || "")
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
  const extractedIndicators = extractScamIndicators(analysisResult.explanation_english);
  
  // Get all detected indicators
  const detectedIndicators = Object.entries(indicators)
    .filter(([_, data]) => data.detected)
    .map(([name, _]) => name)
    // Sort by severity (highest first)
    .sort((a, b) => {
      return (indicators[b].severity || 0) - (indicators[a].severity || 0);
    });
  
  // If no standard indicators were detected but we have AI-extracted ones
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
    if (percentage >= 75) return "Very High Risk Detected";
    if (percentage >= 50) return "High Risk Detected";
    if (percentage >= 25) return "Moderate Risk Detected";
    return "Low Risk Detected";
  };
  
  // Use our calculated risk percentage to determine the displayed status
  const displayStatus = getConsistentRiskStatus(finalRiskPercentage);
  
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-sm"><strong className={statusStyles.textClasses}>Assessment:</strong> {analysisResult.assessment}</p>
            <p className="text-sm"><strong className={statusStyles.textClasses}>AI Confidence:</strong> {analysisResult.ai_confidence}</p>
          </div>            <div className={`p-4 rounded-lg ${statusStyles.badgeClasses} bg-opacity-20 border border-current border-opacity-30`}>
            <p className="font-bold text-lg">
              {finalRiskPercentage >= 75 
                ? '🚨 Very High Risk' 
                : finalRiskPercentage >= 50 
                  ? '⚠️ High Risk'
                  : finalRiskPercentage >= 25 
                    ? '⚠️ Moderate Risk'
                    : '✅ Low Risk'
              } ({Math.round(finalRiskPercentage)}%)
            </p>
            <p className="text-sm mt-2 opacity-90">
              {finalRiskPercentage < 25 
                ? '✅ Safe content with no suspicious elements detected' 
                : finalRiskPercentage < 50 
                  ? '⚠️ Possibly suspicious but not clearly malicious'
                  : finalRiskPercentage < 75
                    ? '🚨 Likely a scam with clear risk indicators'
                    : '🔴 Dangerous content with multiple strong scam indicators'
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* Detected Indicators Section */}
      {finalRiskPercentage > 15 && (
        <div className={`p-6 rounded-xl border-2 ${statusStyles.containerClasses} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${statusStyles.textClasses} flex items-center`}>
            <span className="mr-2">🔎</span>
            Detected Indicators
          </h3>
          
          {detectedIndicators.length === 0 ? (
            <div className="bg-white/60 dark:bg-gray-900/30 rounded-lg p-4 border border-current border-opacity-30">
              <p className="text-sm italic text-gray-600 dark:text-gray-400">
                {finalRiskPercentage < 25 
                  ? 'No significant scam indicators detected in this content.' 
                  : 'No specific indicators detected. Please refer to the detailed explanation below.'}
              </p>
            </div>
          ) : (
            <div className="bg-gray-900/80 rounded-xl p-4">
              <div className="flex flex-wrap gap-2">
                {detectedIndicators.map((indicator, index) => (
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
          </h3>
          <div className="bg-white dark:bg-blue-950/50 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
            <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap leading-relaxed">{analysisResult.image_analysis}</p>
          </div>
        </div>
      )}
      
      {/* Audio Analysis Section */}
      {analysisResult.audio_analysis && (
        <div className="p-6 rounded-xl bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-purple-800 dark:text-purple-200 flex items-center">
            <span className="mr-2">🎤</span>
            Voice Recording Analysis
          </h3>
          <div className="bg-white dark:bg-purple-950/50 rounded-lg p-4 border border-purple-200 dark:border-purple-600">
            <p className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap leading-relaxed">{analysisResult.audio_analysis}</p>
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
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{analysisResult.explanation_english}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200 flex items-center">
            <span className="mr-2">🔍</span>
            Paliwanag (Tagalog)
          </h3>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{analysisResult.explanation_tagalog}</p>
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
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{analysisResult.advice}</p>
        </div>
      </div>

      {/* How to Avoid Scams */}
      <div className={`p-6 rounded-xl border-2 ${statusStyles.containerClasses} shadow-lg`}>
        <h3 className={`text-xl font-bold mb-4 ${statusStyles.textClasses} flex items-center`}>
          <span className="mr-2">🛡️</span>
          How to Avoid Scams
        </h3>
        <div className="bg-white dark:bg-gray-900/30 rounded-lg p-4 border border-current border-opacity-30">
          <ul className="space-y-3">
            {analysisResult.how_to_avoid_scams.map((tip, index) => (
              <li key={index} className="flex items-start text-sm">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reporting Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
          <span className="mr-2">📢</span>
          Where to Report This Scam
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <ul className="space-y-3">
            {analysisResult.where_to_report.map((agency, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                <a 
                  href={agency.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium hover:underline transition-colors"
                >
                  {agency.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* What to Do If Scammed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-700 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-red-800 dark:text-red-200 flex items-center">
            <span className="mr-2">🚨</span>
            If You've Been Scammed (English)
          </h3>
          <div className="space-y-3">
            {analysisResult.what_to_do_if_scammed.map((step, index) => (
              <div key={index} className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-sm text-red-800 dark:text-red-200 leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-700 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-red-800 dark:text-red-200 flex items-center">
            <span className="mr-2">🚨</span>
            Kung Na-scam Ka (Tagalog)
          </h3>
          <div className="space-y-3">
            {analysisResult.what_to_do_if_scammed_tagalog.map((step, index) => (
              <div key={index} className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-sm text-red-800 dark:text-red-200 leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* True vs False Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-green-800 dark:text-green-200 flex items-center">
            <span className="mr-2">🔍</span>
            True vs False Information (English)
          </h3>
          <div className="bg-white dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-600">
            <p className="text-sm text-green-800 dark:text-green-100 whitespace-pre-wrap leading-relaxed">{analysisResult.true_vs_false}</p>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-green-800 dark:text-green-200 flex items-center">
            <span className="mr-2">🔍</span>
            Tunay vs Hindi Tunay (Tagalog)
          </h3>
          <div className="bg-white dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-600">
            <p className="text-sm text-green-800 dark:text-green-100 whitespace-pre-wrap leading-relaxed">{analysisResult.true_vs_false_tagalog}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
