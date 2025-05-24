"use client"; // Add this directive for client-side interactivity

import Link from 'next/link';
import Image from "next/image";
import { useState, useEffect } from "react";
import TermsAndConditionsModal from "../components/TermsAndConditionsModal";
import ConsentManager from "../components/ConsentManager";
import { hasUserConsent } from "../utils/consentManager";

// Define interfaces for the expected response structure from the API
interface ReportAgency {
  name: string;
  link: string;
}

interface ScamDetectionResult {
  status: string; // "Normal Conversation", "Low Risk Detected", "Moderate Risk Detected", "High Risk Detected", "Very High Risk Detected", "Requires More Context"
  assessment: string; // "Regular Message", "Likely Not a Scam", "Possibly Suspicious", "Likely a Scam", "Highly Likely a Scam", "Requires More Context"
  scam_probability: string; // Percentage strings like "10%", "25%", "50%", "75%" based on risk level 
  ai_confidence: string; // "Low", "Medium", "High"
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
  raw_gemini_response?: string; // Optional for debugging
}

export default function Home() {
  const [scamContent, setScamContent] = useState("");
  const [analysisResult, setAnalysisResult] = useState<ScamDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    // Check if user has previously accepted terms
  useEffect(() => {
    // Check if the user has consent using our new system
    const termsAccepted = hasUserConsent('termsAndConditions');
    
    // Also check the legacy format for backward compatibility
    const legacyTermsAccepted = localStorage.getItem('scamDetectTermsAccepted') === 'true';
    
    if (termsAccepted || legacyTermsAccepted) {
      setHasAcceptedTerms(true);
    } else {
      setShowTermsModal(true);
    }
  }, []);
  
  // Handle accepting terms
  const handleAcceptTerms = () => {
    // The saveUserConsent is now called inside the TermsAndConditionsModal component
    // But we'll keep the legacy format for backward compatibility
    localStorage.setItem('scamDetectTermsAccepted', 'true');
    setHasAcceptedTerms(true);
    setShowTermsModal(false);
  };
  
  // Handle closing terms (declining)
  const handleCloseTerms = () => {
    setShowTermsModal(false);
  };
  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleDetectScam = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {      // Prepare request body with text content (can be empty if image is provided)
      const requestBody: { content: string; imageBase64?: string } = {
        content: scamContent.trim(),
      };

      // If an image is selected, add its base64 data
      if (selectedImage && imagePreview) {
        // Extract the base64 data part (remove the "data:image/jpeg;base64," prefix)
        const base64Data = imagePreview.split(",")[1];
        requestBody.imageBase64 = base64Data;
      }

      const response = await fetch("/api/detect-scam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to analyze content");
      }

      const result: ScamDetectionResult = await response.json();
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };  // Extract numeric value from percentage string (e.g., "75%" => 75)
  const extractPercentage = (percentStr: string): number => {
    const match = percentStr.match(/(\d+(?:\.\d+)?)%/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Get color based on percentage value
  const getColorByPercentage = (percent: number) => {
    if (percent >= 75) return {
      color: 'red',
      containerClasses: 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700',
      textClasses: 'text-red-700 dark:text-red-300',
      badgeClasses: 'bg-red-500 text-white',
      barColor: 'bg-red-500',
      icon: '🚨',
      label: 'Very High Risk'
    };
    if (percent >= 50) return {
      color: 'orange',
      containerClasses: 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
      textClasses: 'text-orange-700 dark:text-orange-300',
      badgeClasses: 'bg-orange-500 text-white',
      barColor: 'bg-orange-500',
      icon: '⚠️',
      label: 'High Risk'
    };
    if (percent >= 25) return {
      color: 'yellow',
      containerClasses: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
      textClasses: 'text-yellow-700 dark:text-yellow-300',
      badgeClasses: 'bg-yellow-500 text-white',
      barColor: 'bg-yellow-500',
      icon: '⚠️',
      label: 'Moderate Risk'
    };
    return {
      color: 'green',
      containerClasses: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700',
      textClasses: 'text-green-700 dark:text-green-300',
      badgeClasses: 'bg-green-500 text-white',
      barColor: 'bg-green-500', 
      icon: '✅',
      label: 'Low Risk'
    };
  };

  // Get the appropriate styles based on risk level
  const getStatusStyles = (status: string | undefined, scamProbability?: string) => {
    // If we have a scam probability percentage, use it to determine color
    if (scamProbability) {
      const percent = extractPercentage(scamProbability);
      return getColorByPercentage(percent);
    }
    
    // Fallback to status-based styling if no percentage is available
    const lowerStatus = status?.toLowerCase() || "";
    if (lowerStatus.includes('very high risk')) {
      return {
        containerClasses: 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700',
        textClasses: 'text-red-700 dark:text-red-300',
        badgeClasses: 'bg-red-500 text-white',
        barColor: 'bg-red-500',
        icon: '🚨',
        label: 'Very High Risk'
      };
    } else if (lowerStatus.includes('high risk') && !lowerStatus.includes('medium')) {
      return {
        containerClasses: 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
        textClasses: 'text-orange-700 dark:text-orange-300',
        badgeClasses: 'bg-orange-500 text-white',
        barColor: 'bg-orange-500',
        icon: '⚠️',
        label: 'High Risk'
      };
    } else if (lowerStatus.includes('moderate risk') || lowerStatus.includes('medium risk')) {
      return {
        containerClasses: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
        textClasses: 'text-yellow-700 dark:text-yellow-300',
        badgeClasses: 'bg-yellow-500 text-white',
        barColor: 'bg-yellow-500',
        icon: '⚠️',
        label: 'Moderate Risk'
      };
    } else if (lowerStatus.includes('low risk')) {
      return {
        containerClasses: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700',
        textClasses: 'text-green-700 dark:text-green-300',
        badgeClasses: 'bg-green-500 text-white',
        barColor: 'bg-green-500',
        icon: '✅',
        label: 'Low Risk'
      };
    } else if (lowerStatus.includes('normal conversation')) {
      return {
        containerClasses: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
        textClasses: 'text-blue-700 dark:text-blue-300',
        badgeClasses: 'bg-blue-500 text-white',
        barColor: 'bg-blue-500',
        icon: '💬',
        label: 'Normal Conversation'
      };
    }
    return { // Default / Fallback
      containerClasses: 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600',
      textClasses: 'text-gray-700 dark:text-gray-300',
      badgeClasses: 'bg-gray-500 text-white',
      barColor: 'bg-gray-500',
      icon: 'ℹ️',
      label: 'Unknown'
    };
  };  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 text-gray-900 dark:text-gray-100">
      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal 
        isOpen={showTermsModal} 
        onAccept={handleAcceptTerms} 
        onClose={handleCloseTerms} 
      />      {/* Navigation Bar */}
      <nav className="w-full p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-500 hover:to-indigo-500 transition-all duration-300">
            🛡️ ScamDetect AI
          </Link>
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              Home
            </Link>
            <Link href="/analysis" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
              Analyze Content
            </Link>
            <button 
              onClick={() => setShowTermsModal(true)}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="View Privacy & Terms"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </nav>      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span>AI-Powered Scam Detection</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Smart AI Scam Detection
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Protect yourself from scams with advanced AI analysis. Get instant risk assessments for SMS, emails, 
            and suspicious images with Philippines-specific context.
          </p>
        </div>        <main className="max-w-4xl mx-auto">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3">🔍</span>
                Content Analysis
              </h2>
              <p className="text-blue-100 mt-1">Upload text or images to detect potential scams</p>
            </div>

            {/* Form Content */}
            <div className="p-6 md:p-8">
              {/* Consent Manager */}
              <ConsentManager />
              
              <div className="space-y-8">
            <div>              <label
                htmlFor="scamContent"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Enter content to analyze (e.g., SMS, email, message) or upload an image below:
              </label>              <textarea
                id="scamContent"
                name="scamContent"
                rows={6}
                className={`w-full p-3 border ${!hasAcceptedTerms ? 'border-yellow-300 dark:border-yellow-600' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 text-sm`}
                placeholder={!hasAcceptedTerms 
                  ? "Please accept the terms and conditions first..." 
                  : (imagePreview ? "Optional: Add text for analysis alongside the image..." : "Paste text here or upload an image below...")}
                value={scamContent}
                onChange={(e) => setScamContent(e.target.value)}
                disabled={isLoading || !hasAcceptedTerms}
                onClick={!hasAcceptedTerms ? () => setShowTermsModal(true) : undefined}
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload image for analysis (optional):
              </label>
              <div className="mt-1 flex flex-col space-y-4">                {!imagePreview ? (                  <div 
                    onClick={!hasAcceptedTerms ? () => setShowTermsModal(true) : undefined}
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 ${
                      !hasAcceptedTerms 
                        ? 'border-yellow-300 dark:border-yellow-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } border-dashed rounded-lg ${hasAcceptedTerms ? 'cursor-pointer' : ''} bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 relative`}
                  >
                    {hasAcceptedTerms ? (
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                          </svg>
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, JPEG (MAX. 5MB)</p>
                        </div>
                        <input 
                          id="dropzone-file" 
                          type="file" 
                          className="hidden" 
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleImageChange}
                          disabled={isLoading}
                        />
                      </label>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 text-yellow-500 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9.5M4 7h16M4 7v7a4 4 0 004 4h7M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2M9 21h3m3 0h3"></path>
                        </svg>
                        <p className="mb-2 text-sm text-yellow-600 dark:text-yellow-400">
                          <span className="font-semibold">Accept terms to upload images</span>
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">Terms & conditions required</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">                    <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                      {/* Using img tag is acceptable for user-uploaded images with dynamic sources */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        disabled={isLoading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Image will be analyzed for scam detection. You can optionally add text for a more comprehensive analysis.
                    </p>
                  </div>
                )}
              </div>
            </div>            <button
              type="button"
              onClick={hasAcceptedTerms ? handleDetectScam : () => setShowTermsModal(true)}
              disabled={isLoading || (!scamContent.trim() && !imagePreview) || !hasAcceptedTerms}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Analyzing..." : hasAcceptedTerms ? "Detect Scam" : "Accept Terms to Analyze"}
            </button>
            
            {!hasAcceptedTerms && (
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                You must accept the terms and conditions before using this feature. 
                <button 
                  onClick={() => setShowTermsModal(true)} 
                  className="text-blue-600 dark:text-blue-400 ml-1 hover:underline"
                >
                  View Terms
                </button>
              </p>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md">
                <h2 className="text-lg font-semibold mb-2">Error</h2>
                <p>{error}</p>
              </div>
            )}

            {analysisResult && !error && (
              (() => {
                const statusStyles = getStatusStyles(analysisResult.status, analysisResult.scam_probability);
                const percent = extractPercentage(analysisResult.scam_probability);
                
                return (
                  <div className="mt-6 space-y-6">
                    <div className={`p-4 rounded-lg border ${statusStyles.containerClasses}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className={`text-xl font-semibold ${statusStyles.textClasses}`}>
                          {statusStyles.icon} {analysisResult.status || "Analysis Complete"}
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles.badgeClasses}`}>
                          {analysisResult.scam_probability}
                        </span>
                      </div>
                      
                      {/* Risk probability visualization */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full ${statusStyles.barColor}`} 
                            style={{ width: `${percent}%` }}
                            title={`Risk level: ${percent}%`}
                          ></div>
                        </div>
                        <div className="grid grid-cols-4 text-xs mt-1">
                          <div className="text-green-600 dark:text-green-400">0-24%<br/>Low Risk</div>
                          <div className="text-yellow-600 dark:text-yellow-400">25-49%<br/>Moderate Risk</div>
                          <div className="text-orange-600 dark:text-orange-400">50-74%<br/>High Risk</div>
                          <div className="text-red-600 dark:text-red-400 text-right">75-100%<br/>Very High Risk</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="mb-1"><strong className={statusStyles.textClasses}>Assessment:</strong> {analysisResult.assessment}</p>
                          <p><strong className={statusStyles.textClasses}>AI Confidence:</strong> {analysisResult.ai_confidence}</p>
                        </div>
                        <div className={`p-3 rounded-md ${statusStyles.badgeClasses} bg-opacity-20`}>
                          <p className="font-medium">{statusStyles.icon} {statusStyles.label} ({percent}%)</p>
                          <p className="text-xs mt-1">
                            {percent < 25 
                              ? 'Safe message with no suspicious elements' 
                              : percent < 50 
                                ? 'Possibly suspicious content but not clearly malicious'
                                : percent < 75
                                  ? 'Likely a scam with clear risk indicators'
                                  : 'Dangerous content with multiple strong scam indicators'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {analysisResult.image_analysis && (
                      <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/60 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200">
                        <h3 className="text-lg font-semibold mb-1">🖼️ Image Analysis:</h3>
                        <p className="text-sm whitespace-pre-wrap">{analysisResult.image_analysis}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Explanation (English):</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{analysisResult.explanation_english}</p>
                    </div>                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Paliwanag (Tagalog):</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{analysisResult.explanation_tagalog}</p>
                    </div>

                    {/* Advice section with dynamic styling based on risk level */}
                    <div className={`p-4 rounded-md border ${statusStyles.containerClasses}`}>
                      <h3 className={`text-lg font-semibold mb-1 ${statusStyles.textClasses}`}>💡 Advice:</h3>
                      <p className="text-sm whitespace-pre-wrap">{analysisResult.advice}</p>
                    </div>                    <div className={`p-4 rounded-md border ${statusStyles.containerClasses} bg-opacity-10`}>
                      <h3 className={`text-lg font-semibold mb-2 ${statusStyles.textClasses}`}>🛡️ How to Avoid Scams:</h3>
                      <ul className="list-disc list-outside ml-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        {analysisResult.how_to_avoid_scams.map((tip, index) => (
                          <li key={index} className="pl-2">{tip}</li>
                        ))}
                      </ul>
                    </div><div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">📢 Where to Report This Scam:</h3>
                      <ul className="space-y-1 text-sm">
                        {analysisResult.where_to_report.map((agency, index) => (
                          <li key={index}>
                            <a href={agency.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                              {agency.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">🚨 What To Do If You've Been Scammed (English):</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                          {analysisResult.what_to_do_if_scammed.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">🚨 Ano Ang Gagawin Kung Na-scam Ka (Tagalog):</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                          {analysisResult.what_to_do_if_scammed_tagalog.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">🔍 True vs False Information (English):</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{analysisResult.true_vs_false}</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">🔍 Tunay vs Hindi Tunay na Impormasyon (Tagalog):</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{analysisResult.true_vs_false_tagalog}</p>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}            {!isLoading && !analysisResult && !error && (
              <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md min-h-[100px] text-gray-700 dark:text-gray-300 flex items-center justify-center">
                <p>{scamContent.trim() || imagePreview ? "Awaiting analysis..." : "Please enter text or upload an image to analyze"}</p>
              </div>
            )}
          </div>
        </main>        <footer className="mt-10 md:mt-12 text-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} AI Scam Detection. All rights
            reserved.
          </p>
          <div className="flex justify-center items-center gap-2 mt-2">
            <Image
              src="/next.svg"
              alt="Next.js Logo"
              width={70}
              height={14}
              className="dark:invert opacity-75"
            />
            <p className="font-mono text-xs">Powered by Gemini API</p>
          </div>
          <div className="mt-2">
            <button 
              onClick={() => setShowTermsModal(true)} 
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Terms and Conditions
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
