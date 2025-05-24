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

    try {
      // Prepare request body with text content (can be empty if image is provided)
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
  };

  // Extract numeric value from percentage string (e.g., "75%" => 75)
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
  };

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 text-gray-900 dark:text-gray-100">
      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal 
        isOpen={showTermsModal} 
        onAccept={handleAcceptTerms} 
        onClose={handleCloseTerms} 
      />

      {/* Navigation Bar */}
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
      </nav>

      {/* Main Content */}
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
        </div>

        {/* Main Form Container */}
        <main className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-2xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <span className="mr-3 text-4xl">🔍</span>
                Content Analysis
              </h2>
              <p className="text-blue-100 mt-2 text-lg">Upload text or images to detect potential scams with AI-powered analysis</p>
            </div>

            {/* Form Content */}
            <div className="p-8 md:p-10">
              {/* Consent Manager */}
              <ConsentManager />
              
              <div className="space-y-8">
                {/* Text Input Section */}
                <div className="space-y-4">
                  <label
                    htmlFor="scamContent"
                    className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3"
                  >
                    📝 Enter content to analyze
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Paste suspicious SMS messages, emails, or any text content you want to verify for scam detection.
                  </p>
                  <textarea
                    id="scamContent"
                    name="scamContent"
                    rows={7}
                    className={`w-full p-4 border-2 ${
                      !hasAcceptedTerms 
                        ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
                    } rounded-xl shadow-sm transition-all duration-200 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 dark:bg-gray-700/50 dark:text-gray-200 text-base placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder={!hasAcceptedTerms 
                      ? "⚠️ Please accept the terms and conditions first..." 
                      : (imagePreview 
                        ? "💡 Optional: Add text for analysis alongside the image..." 
                        : "📱 Paste suspicious text here (SMS, email, message, etc.)..."
                      )}
                    value={scamContent}
                    onChange={(e) => setScamContent(e.target.value)}
                    disabled={isLoading || !hasAcceptedTerms}
                    onClick={!hasAcceptedTerms ? () => setShowTermsModal(true) : undefined}
                  />
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    🖼️ Upload image for analysis (optional)
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Upload screenshots of suspicious messages, fake websites, or any images that might contain scam content.
                  </p>
                  
                  <div className="mt-1 flex flex-col space-y-4">
                    {!imagePreview ? (
                      <div 
                        onClick={!hasAcceptedTerms ? () => setShowTermsModal(true) : undefined}
                        className={`flex flex-col items-center justify-center w-full h-40 border-2 ${
                          !hasAcceptedTerms 
                            ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                        } border-dashed rounded-xl ${hasAcceptedTerms ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''} bg-gray-50/50 dark:bg-gray-700/30 transition-all duration-200 relative group`}
                      >
                        {hasAcceptedTerms ? (
                          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                              </div>
                              <p className="mb-2 text-base font-medium text-gray-700 dark:text-gray-300">
                                <span className="font-bold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG, JPEG (MAX. 5MB)</p>
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
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
                              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                              </svg>
                            </div>
                            <p className="mb-2 text-base font-medium text-yellow-700 dark:text-yellow-300">
                              <span className="font-bold">Accept terms to upload images</span>
                            </p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">Terms & conditions required</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="relative w-full h-64 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
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
                            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                            disabled={isLoading}
                            title="Remove image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <span className="mr-2">✅</span>
                          Image uploaded successfully. Add optional text above for a more comprehensive analysis.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={hasAcceptedTerms ? handleDetectScam : () => setShowTermsModal(true)}
                  disabled={isLoading || (!scamContent.trim() && !imagePreview) || !hasAcceptedTerms}
                  className={`w-full font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 text-lg ${
                    hasAcceptedTerms && (scamContent.trim() || imagePreview) && !isLoading
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:scale-[1.02] focus:ring-blue-300 dark:focus:ring-blue-900/50'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing with AI...
                    </div>
                  ) : hasAcceptedTerms ? (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">🔍</span>
                      Analyze for Scams
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">⚠️</span>
                      Accept Terms to Analyze
                    </div>
                  )}
                </button>
                
                {!hasAcceptedTerms && (
                  <div className="text-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <span className="font-semibold">⚠️ Terms Required:</span> You must accept our terms and conditions before using this feature.{' '}
                      <button 
                        onClick={() => setShowTermsModal(true)} 
                        className="font-bold text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 underline transition-colors"
                      >
                        View Terms & Conditions
                      </button>
                    </p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-xl p-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold mb-2">❌ Analysis Error</h3>
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results Display */}
                {analysisResult && !error && (
                  (() => {
                    const statusStyles = getStatusStyles(analysisResult.status, analysisResult.scam_probability);
                    const percent = extractPercentage(analysisResult.scam_probability);
                    
                    return (
                      <div className="space-y-6">
                        {/* Main Results Card */}
                        <div className={`p-6 rounded-xl border-2 ${statusStyles.containerClasses} shadow-lg`}>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-2xl font-bold ${statusStyles.textClasses} flex items-center`}>
                              <span className="mr-3 text-3xl">{statusStyles.icon}</span>
                              {analysisResult.status || "Analysis Complete"}
                            </h2>
                            <span className={`px-4 py-2 rounded-full text-lg font-bold ${statusStyles.badgeClasses} shadow-md`}>
                              {analysisResult.scam_probability}
                            </span>
                          </div>
                          
                          {/* Risk Visualization */}
                          <div className="mb-6">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                              <div 
                                className={`h-4 rounded-full ${statusStyles.barColor} transition-all duration-1000 ease-out`} 
                                style={{ width: `${percent}%` }}
                                title={`Risk level: ${percent}%`}
                              ></div>
                            </div>
                            <div className="grid grid-cols-4 text-xs mt-2 font-medium">
                              <div className="text-green-600 dark:text-green-400">0-24%<br/>Low Risk</div>
                              <div className="text-yellow-600 dark:text-yellow-400">25-49%<br/>Moderate</div>
                              <div className="text-orange-600 dark:text-orange-400">50-74%<br/>High Risk</div>
                              <div className="text-red-600 dark:text-red-400 text-right">75-100%<br/>Very High</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <p className="text-sm"><strong className={statusStyles.textClasses}>Assessment:</strong> {analysisResult.assessment}</p>
                              <p className="text-sm"><strong className={statusStyles.textClasses}>AI Confidence:</strong> {analysisResult.ai_confidence}</p>
                            </div>
                            <div className={`p-4 rounded-lg ${statusStyles.badgeClasses} bg-opacity-20 border border-current border-opacity-30`}>
                              <p className="font-bold text-lg">{statusStyles.icon} {statusStyles.label} ({percent}%)</p>
                              <p className="text-sm mt-2 opacity-90">
                                {percent < 25 
                                  ? '✅ Safe content with no suspicious elements detected' 
                                  : percent < 50 
                                    ? '⚠️ Possibly suspicious but not clearly malicious'
                                    : percent < 75
                                      ? '🚨 Likely a scam with clear risk indicators'
                                      : '🔴 Dangerous content with multiple strong scam indicators'
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Image Analysis Section */}
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
                  })()
                )}

                {/* Awaiting Analysis State */}
                {!isLoading && !analysisResult && !error && (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {scamContent.trim() || imagePreview ? "Ready to Analyze" : "Upload Content to Start"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {scamContent.trim() || imagePreview 
                          ? "Click the analyze button to start AI-powered scam detection" 
                          : "Add text or upload an image to begin scam analysis"
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Enhanced Footer */}
        <footer className="mt-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🛡️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ScamDetect AI
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Protecting you from digital scams</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              &copy; {new Date().getFullYear()} AI Scam Detection. All rights reserved.
            </p>
            
            <div className="flex justify-center items-center space-x-6 mb-4">
              <div className="flex items-center space-x-2">
                <Image
                  src="/next.svg"
                  alt="Next.js Logo"
                  width={60}
                  height={12}
                  className="dark:invert opacity-75"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                <p className="font-mono text-xs text-gray-500 dark:text-gray-400">Powered by Gemini AI</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <button 
                onClick={() => setShowTermsModal(true)} 
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium hover:underline transition-colors"
              >
                📋 Terms and Conditions
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
