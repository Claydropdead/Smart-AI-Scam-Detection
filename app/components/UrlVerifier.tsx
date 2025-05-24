"use client";

import { useState } from 'react';
import { analyzeUrl } from '../utils/domainUtils';

interface UrlVerifierProps {
  url: string;
  showDetails?: boolean;
}

export default function UrlVerifier({ url, showDetails = false }: UrlVerifierProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const verifyUrl = () => {
    setIsLoading(true);
    
    try {
      // Use domainUtils to analyze the URL
      const result = analyzeUrl(url);
      setAnalysis(result);
      setIsVerified(!result.isPotentialSpoofing && !result.hasSuspiciousPatterns);
    } catch (error) {
      console.error('Error analyzing URL:', error);
      setIsVerified(false);
    } finally {
      setIsLoading(false);
      setShowAnalysis(true);
    }
  };
  
  const getRiskLabel = (score: number) => {
    if (score >= 0.8) return { label: 'Very High Risk', color: 'text-red-600 dark:text-red-400' };
    if (score >= 0.6) return { label: 'High Risk', color: 'text-orange-600 dark:text-orange-400' };
    if (score >= 0.3) return { label: 'Moderate Risk', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'Low Risk', color: 'text-green-600 dark:text-green-400' };
  };
  
  return (
    <div className="mt-1">
      <div className="flex items-center">
        <button 
          onClick={verifyUrl} 
          disabled={isLoading}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors flex items-center"
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-1">⚙️</span>
              Verifying...
            </>
          ) : isVerified === null ? (
            <>
              <span className="mr-1">🔍</span>
              Verify URL
            </>
          ) : (
            <>
              <span className="mr-1">{isVerified ? '✓' : '⚠️'}</span>
              {isVerified ? 'Verified' : 'Suspicious'}
            </>
          )}
        </button>
        
        {showAnalysis && analysis && (
          <button 
            onClick={() => setShowAnalysis(!showAnalysis)} 
            className="ml-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>
      
      {showAnalysis && analysis && showDetails && (
        <div className="mt-2 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Domain</p>
              <p className="text-gray-600 dark:text-gray-400">{analysis.cleanDomain}</p>
            </div>
            
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Risk Score</p>
              <p className={getRiskLabel(analysis.riskScore).color}>
                {getRiskLabel(analysis.riskScore).label} ({Math.round(analysis.riskScore * 100)}%)
              </p>
            </div>
            
            {analysis.isLegitimateDomain && (
              <div className="col-span-2">
                <p className="font-medium text-gray-700 dark:text-gray-300">Organization</p>
                <p className="text-green-600 dark:text-green-400">{analysis.institution}</p>
              </div>
            )}
            
            {analysis.isPotentialSpoofing && (
              <div className="col-span-2">
                <p className="font-medium text-gray-700 dark:text-gray-300">Spoofing Target</p>
                <p className="text-red-600 dark:text-red-400">{analysis.spoofingTarget}</p>
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  Technique: {analysis.spoofingTechnique}
                </p>
              </div>
            )}
            
            {analysis.hasSuspiciousPatterns && (
              <div className="col-span-2">
                <p className="font-medium text-gray-700 dark:text-gray-300">Warning</p>
                <p className="text-red-600 dark:text-red-400">
                  This URL matches patterns commonly used in phishing attempts
                </p>
              </div>
            )}
            
            <div className="col-span-2 mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {analysis.isLegitimateDomain ? 
                  "This appears to be a legitimate domain. Always verify directly with the institution for security." :
                  analysis.isPotentialSpoofing || analysis.hasSuspiciousPatterns ? 
                    "Exercise extreme caution with this URL. It shows signs of being potentially dangerous." :
                    "This domain is not a verified financial institution but doesn't show obvious suspicious patterns."
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
