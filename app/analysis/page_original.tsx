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
  };  // Extract numeric value from percentage string (e.g., "75%" => 75)
  const extractPercentage = (percentStr: string): number => {
    // Handle direct numeric values or ranges
    if (!percentStr) return 0;
    
    if (percentStr.includes('-')) {
      // Handle ranges like "75-100%" by using the average
      const [min, max] = percentStr.split('-').map(part => {
        const match = part.match(/(\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
      });
      return (min + max) / 2;
    }
    
    // Handle exact percentages
    const match = percentStr.match(/(\d+(?:\.\d+)?)%/);
    if (match) return parseFloat(match[1]);
    
    // If it's just a number without % sign
    const numericMatch = percentStr.match(/(\d+(?:\.\d+)?)/);
    return numericMatch ? parseFloat(numericMatch[1]) : 0;
  };
  // Extract potential scam indicators from explanation text
  const extractScamIndicators = (explanationText: string): string[] => {
    if (!explanationText) return [];
    
    // Common phrases that introduce lists of indicators in AI explanations
    const introductionPhrases = [
      "indicators include:", "red flags include:", "suspicious elements include:",
      "warning signs include:", "suspicious indicators include:", "concerning elements include:",
      "signs of a scam:", "scam indicators:", "suspicious patterns:", "red flags:",
      "concerning aspects:", "alarm bells include:", "suspicious factors:", "signs include:"
    ];
    
    // Try to find any section that might list indicators
    let indicators: string[] = [];
    
    // Look for standard bullet points or numbered lists
    const bulletMatches = explanationText.match(/[•\-\*]([^•\-\*\n]+)/g);
    if (bulletMatches && bulletMatches.length > 0) {
      indicators = bulletMatches.map(item => 
        item.replace(/^[•\-\*]\s*/, '').trim()
      ).filter(item => item.length > 5);
    }
    
    // Look for numbered lists
    const numberMatches = explanationText.match(/\d+\.\s+([^\n]+)/g);
    if (numberMatches && numberMatches.length > 0) {
      const numberedItems = numberMatches.map(item => 
        item.replace(/^\d+\.\s+/, '').trim()
      ).filter(item => item.length > 5);
      indicators = [...indicators, ...numberedItems];
    }
    
    // If no structured lists found, try to extract sentences after introduction phrases
    if (indicators.length === 0) {
      for (const phrase of introductionPhrases) {
        const index = explanationText.toLowerCase().indexOf(phrase);
        if (index !== -1) {
          const relevantText = explanationText.substring(index + phrase.length).trim();
          const sentences = relevantText.split(/[.!?]/).filter(s => s.trim().length > 5);
          if (sentences.length > 0) {
            indicators = sentences.slice(0, Math.min(5, sentences.length)).map(s => s.trim());
            break;
          }
        }
      }
    }
    
    // Look for key phrases like "This message contains..." or "I detected..."
    if (indicators.length === 0) {
      const keyPhrases = [
        "this message contains", "i detected", "this contains", 
        "suspicious due to", "appears to be", "this shows signs of",
        "this is likely", "red flag is", "contains elements of"
      ];
      
      for (const phrase of keyPhrases) {
        const regex = new RegExp(phrase + "\\s+([^.!?]+)[.!?]", "i");
        const match = explanationText.match(regex);
        if (match && match[1]) {
          indicators.push(match[1].trim());
        }
      }
    }
    
    // If still no indicators, extract key phrases from the beginning of the explanation
    if (indicators.length === 0) {
      const sentences = explanationText.split(/[.!?]/).filter(s => s.trim().length > 5);
      if (sentences.length > 0) {
        indicators = sentences.slice(0, Math.min(3, sentences.length)).map(s => s.trim());
      }
    }
    
    // Process the indicators to make them more concise (extract key phrases)
    const processedIndicators = indicators.map(indicator => {
      // Look for key phrases like "contains X" or "presents X"
      const phrasePatterns = [
        /contains\s+(\w+(\s+\w+){0,3})/i,
        /presents\s+(\w+(\s+\w+){0,3})/i,
        /includes\s+(\w+(\s+\w+){0,3})/i,
        /with\s+(\w+(\s+\w+){0,3})/i,
        /has\s+(\w+(\s+\w+){0,3})/i,
        /showing\s+(\w+(\s+\w+){0,3})/i,
        /claiming\s+(\w+(\s+\w+){0,3})/i,
        /uses\s+(\w+(\s+\w+){0,3})/i
      ];
      
      for (const pattern of phrasePatterns) {
        const match = indicator.match(pattern);
        if (match && match[1] && match[1].length > 5) {
          return match[1].trim();
        }
      }
      
      // If no pattern match, just take the first few words
      return indicator.split(/\s+/).slice(0, 4).join(" ")
        .replace(/[.,;:!?].*$/, "") // Remove endings with punctuation
        .replace(/^\W+|\W+$/, ""); // Trim non-word characters
    });
    
    // Deduplicate and limit the number of indicators
    return Array.from(new Set(processedIndicators))
      .filter(indicator => indicator.length > 3)
      .slice(0, 5)
      .map(indicator => {
        // Capitalize first letter
        return indicator.charAt(0).toUpperCase() + indicator.slice(1);
      });
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
                  
                  <div className="relative">
                    <textarea
                      id="scamContent"
                      name="scamContent"
                      rows={7}
                      className={`w-full p-4 border-2 ${
                        !hasAcceptedTerms 
                          ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
                          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400'
                      } rounded-xl shadow-sm transition-all duration-200 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 dark:bg-gray-700/50 dark:text-gray-200 text-base placeholder-gray-500 dark:placeholder-gray-400 resize-none hover:shadow-md`}
                      placeholder={!hasAcceptedTerms 
                        ? "⚠️ Please accept the terms and conditions first..." 
                        : (imagePreview 
                          ? "💡 Optional: Add text for analysis alongside the image..." 
                          : "📱 Paste suspicious text here (SMS, email, message, etc.)...\n\nExample:\n'URGENT: Your account will be closed! Click here to verify: suspicious-link.com'"
                        )}
                      value={scamContent}
                      onChange={(e) => setScamContent(e.target.value)}
                      disabled={isLoading || !hasAcceptedTerms}
                      onClick={!hasAcceptedTerms ? () => setShowTermsModal(true) : undefined}
                      maxLength={5000}
                      aria-describedby="content-help"
                    />
                    
                    {/* Character Counter */}
                    <div className="absolute bottom-3 right-3 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
                      {scamContent.length}/5000
                    </div>
                  </div>
                  
                  <div id="content-help" className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>
                      Tip: The AI works best with complete messages. Include URLs, phone numbers, and any suspicious elements for accurate analysis.
                    </span>
                  </div>
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
                      <div className="space-y-6">                        {/* Main Results Card */}
                        <div className={`p-6 rounded-xl border-2 ${statusStyles.containerClasses} shadow-lg`}>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-2xl font-bold ${statusStyles.textClasses} flex items-center`}>
                              <span className="mr-3 text-3xl">{statusStyles.icon}</span>
                              {analysisResult.status || "Analysis Complete"}
                            </h2>                            <span className={`px-4 py-2 rounded-full text-lg font-bold ${statusStyles.badgeClasses} shadow-md`}>
                              {`${Math.round(percent)}%`}
                            </span>
                          </div>
                          
                          {/* Risk Visualization */}
                          <div className="mb-6">                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden shadow-inner relative">
                              <div 
                                className={`h-6 rounded-full ${statusStyles.barColor} transition-all duration-1000 ease-out flex items-center justify-end pr-2`} 
                                style={{ width: `${percent}%` }}
                                title={`Risk level: ${Math.round(percent)}%`}
                              >
                                {percent > 15 && (
                                  <span className="text-xs font-bold text-white drop-shadow-md">
                                    {Math.round(percent)}%
                                  </span>
                                )}
                              </div>
                              {percent <= 15 && (
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-bold text-gray-700 dark:text-gray-300">
                                  {Math.round(percent)}%
                                </span>
                              )}
                            </div><div className="grid grid-cols-4 text-xs mt-2 font-medium">
                              <div className="text-green-600 dark:text-green-400 flex flex-col items-center">
                                <span className={percent < 25 ? 'font-bold' : ''}>
                                  {percent < 25 ? `${Math.round(percent)}%` : '0-24%'}
                                </span>
                                <span>Low Risk</span>
                              </div>
                              <div className="text-yellow-600 dark:text-yellow-400 flex flex-col items-center">
                                <span className={percent >= 25 && percent < 50 ? 'font-bold' : ''}>
                                  {percent >= 25 && percent < 50 ? `${Math.round(percent)}%` : '25-49%'}
                                </span>
                                <span>Moderate</span>
                              </div>
                              <div className="text-orange-600 dark:text-orange-400 flex flex-col items-center">
                                <span className={percent >= 50 && percent < 75 ? 'font-bold' : ''}>
                                  {percent >= 50 && percent < 75 ? `${Math.round(percent)}%` : '50-74%'}
                                </span>
                                <span>High Risk</span>
                              </div>
                              <div className="text-red-600 dark:text-red-400 flex flex-col items-center">
                                <span className={percent >= 75 ? 'font-bold' : ''}>
                                  {percent >= 75 ? `${Math.round(percent)}%` : '75-100%'}
                                </span>
                                <span>Very High</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <p className="text-sm"><strong className={statusStyles.textClasses}>Assessment:</strong> {analysisResult.assessment}</p>
                              <p className="text-sm"><strong className={statusStyles.textClasses}>AI Confidence:</strong> {analysisResult.ai_confidence}</p>
                            </div>                            <div className={`p-4 rounded-lg ${statusStyles.badgeClasses} bg-opacity-20 border border-current border-opacity-30`}>
                              <p className="font-bold text-lg">{statusStyles.icon} {statusStyles.label} ({Math.round(percent)}%)</p>
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
                        </div>                        {/* Detected Indicators Section */}
                        {percent > 15 && (
                          <div className={`p-6 rounded-xl border-2 ${statusStyles.containerClasses} shadow-lg`}>
                            <h3 className={`text-xl font-bold mb-4 ${statusStyles.textClasses} flex items-center`}>
                              <span className="mr-2">🔎</span>
                              Detected Indicators
                            </h3>
                            
                            {/* Extract and display indicators from explanation */}
                            {(() => {                              // Comprehensive scam indicators organized by category
                              const commonIndicators = {
                                // Urgency Tactics
                                "Urgent action required": {
                                  patterns: ["urgent", "immediate", "act now", "expire", "deadline", "limited time", "running out of time", "must respond", "24 hours", "few hours left", "time sensitive", "act fast", "hurry", "quick action", "promptly", "only today"],
                                  severity: 3,
                                  detected: false
                                },
                                
                                // Link Manipulation
                                "Shortened URL": {
                                  patterns: ["bit.ly", "goo.gl", "tinyurl", "t.co", "short url", "shortened link", "click here", "click this link", "follow this url", "redirect", "tiny.cc", "ow.ly", "is.gd", "buff.ly"],
                                  severity: 4,
                                  detected: false
                                },
                                "Suspicious domain": {
                                  patterns: [".xyz", ".online", ".site", ".info", "strange url", "unusual domain", "misspelled domain", "lookalike domain", "resembles official", ".co ((?!m).)*$"],
                                  severity: 4, 
                                  detected: false
                                },
                                "Misleading link": {
                                  patterns: ["click to validate", "click to verify", "click to restore", "click to unlock", "click to continue", "download now", "install now"],
                                  severity: 4,
                                  detected: false
                                },
                                
                                // Data Collection
                                "Request for personal data": {
                                  patterns: ["personal information", "credit card", "bank details", "password", "login", "social security", "credentials", "account number", "cvv", "pin number", "security questions", "answer verification", "card information", "banking details", "payment details", "send photo", "selfie", "identity verification", "id card", "verify your identity"],
                                  severity: 5,
                                  detected: false
                                },
                                "Financial information request": {
                                  patterns: ["bank account", "credit card number", "payment info", "financial", "transaction", "banking", "wire transfer", "transfer money", "gcash", "maya", "paymaya", "paypal", "western union", "money gram"],
                                  severity: 5,
                                  detected: false
                                },
                                
                                // Financial Incentives
                                "Too good to be true": {
                                  patterns: ["prize", "winner", "won", "lottery", "gift", "free", "million", "reward", "claim your", "bonus", "cash prize", "jackpot", "congratulations", "lucky winner", "lump sum", "special offer", "exclusive deal", "unclaimed", "inheritance", "big money"],
                                  severity: 4,
                                  detected: false
                                },
                                "Investment opportunity": {
                                  patterns: ["investment", "high return", "guaranteed profit", "double your", "crypto", "bitcoin", "multiply your money", "passive income", "get rich", "financial freedom", "trading opportunity", "trading bot", "trading platform", "investment scheme", "high yield", "risk-free", "forex", "stock investment"],
                                  severity: 4,
                                  detected: false
                                },
                                
                                // Verification Issues
                                "No verification": {
                                  patterns: ["no verification", "without verification", "no need to verify", "bypass", "easy money", "quick money", "easy cash", "no checks", "skip verification", "no security check", "no background check"],
                                  severity: 4,
                                  detected: false
                                },
                                "Fake verification": {
                                  patterns: ["security check", "account verification", "verify your account", "confirm your details", "authenticate your", "validate your", "verify your identity", "double check", "confirm your information", "needs verification", "one-time verification", "identity check"],
                                  severity: 4,
                                  detected: false
                                },
                                
                                // Money Requests
                                "Payment upfront": {
                                  patterns: ["advance fee", "deposit required", "payment first", "send money", "wire transfer", "processing fee", "handling fee", "small fee", "nominal fee", "administrative cost", "registration fee", "shipping fee", "clearance fee", "lawyer fee", "tax payment", "upfront payment", "pay now to", "gcash", "paynow"],
                                  severity: 5,
                                  detected: false
                                },
                                "Money laundering scheme": {
                                  patterns: ["transfer money", "move funds", "receive money", "deposit funds", "process payment", "money mule", "commission", "keep percentage", "handle transaction", "receive and forward", "reshipper", "package processor"],
                                  severity: 5,
                                  detected: false
                                },
                                
                                // Trust Manipulation
                                "Suspicious sender": {
                                  patterns: ["official", "bank", "support", "service", "admin", "security", "unusual email", "unfamiliar sender", "government", "tax authority", "tax office", "microsoft", "apple", "google", "amazon", "facebook", "netflix", "paypal", "customer service", "IT department", "help desk", "HR department"],
                                  severity: 3,
                                  detected: false
                                },
                                "Impersonation attempt": {
                                  patterns: ["ceo", "executive", "boss", "manager", "director", "supervisor", "president", "friend", "family", "relative", "cousin", "sibling", "parent", "child", "loved one", "acquaintance", "colleague", "trusted", "authority figure"],
                                  severity: 4,
                                  detected: false
                                },
                                
                                // Text Quality Issues
                                "Grammatical errors": {
                                  patterns: ["poor grammar", "spelling error", "typo", "badly written", "awkward language", "translation error", "broken english", "strange wording", "unusual phrasing", "odd language", "improper grammar", "language mistakes"],
                                  severity: 2,
                                  detected: false
                                },
                                "Excessive formality": {
                                  patterns: ["dear customer", "dear valued", "dear beneficiary", "dear user", "dear client", "dear account holder", "dear member", "to whom it may concern", "dear sir/madam", "greetings of the day", "esteemed customer"],
                                  severity: 2,
                                  detected: false
                                },
                                
                                // Pressure Tactics
                                "Threatening language": {
                                  patterns: ["threaten", "suspend", "block", "legal action", "lawsuit", "police", "risk", "danger", "warning", "terminate", "close account", "penalty", "fine", "restriction", "consequence", "violation", "limited access", "permanent ban", "criminal", "illegal activity", "unauthorized access", "reported"],
                                  severity: 4,
                                  detected: false
                                },
                                "Account issue": {
                                  patterns: ["account problem", "security breach", "verify account", "unusual activity", "suspicious login", "unauthorized access", "locked account", "account suspended", "account disabled", "security alert", "suspicious activity", "unusual login", "login attempt", "security warning"],
                                  severity: 3,
                                  detected: false
                                },
                                
                                // Deception Tactics
                                "Unexpected package": {
                                  patterns: ["package", "parcel", "delivery", "shipment", "courier", "tracking number", "undelivered", "failed delivery", "shipping issue", "customs", "delivery attempt", "waiting for pickup", "delivery fee", "import tax", "customs fee", "delivery service"],
                                  severity: 3,
                                  detected: false
                                },
                                "Job offer scam": {
                                  patterns: ["job offer", "employment", "work from home", "remote job", "flexible hours", "earn from home", "hiring", "position available", "job opportunity", "no experience", "easy job", "part-time", "full-time", "recruitment", "vacancy", "job opening", "high salary", "competitive pay"],
                                  severity: 4,
                                  detected: false
                                },
                                "Emotional manipulation": {
                                  patterns: ["help me", "desperate", "trapped", "emergency", "accident", "hospital", "urgent help", "medical emergency", "life or death", "tragedy", "disaster", "crisis", "emotional appeal", "plea for help", "charitable", "donation", "funding", "support needed", "poverty"],
                                  severity: 3,
                                  detected: false
                                },
                                "Confidentiality request": {
                                  patterns: ["keep this private", "confidential", "secret", "don't tell", "between us", "discreet", "quiet", "hidden", "concealed", "no one should know", "don't share this", "tell no one", "private matter", "classified information"],
                                  severity: 4,
                                  detected: false
                                },
                                
                                // Technical Deception
                                "Attachment threat": {
                                  patterns: ["attachment", "download", "open file", "view document", "check document", "see attached", "review attached", ".zip", ".exe", ".docx", ".pdf", ".apk", "macro", "enable content", "enable editing"],
                                  severity: 4,
                                  detected: false
                                },
                                "Tech support scam": {
                                  patterns: ["technical support", "virus", "malware", "infection", "computer problem", "security issue", "computer alert", "microsoft support", "apple support", "system error", "remote access", "tech help", "PC repair", "system scan"],
                                  severity: 4,
                                  detected: false
                                },
                                
                                // Philippines-Specific Scams
                                "Remittance scam": {
                                  patterns: ["gcash", "paymaya", "maya", "cebuana", "palawan", "remittance", "padala", "western union", "mlhuillier", "money transfer", "send load", "pera padala", "cash pickup", "ofw", "overseas", "abroad", "pamilya", "kamag-anak"],
                                  severity: 5,
                                  detected: false
                                },
                                "Government impersonation": {
                                  patterns: ["dole", "dswd", "sss", "philhealth", "pag-ibig", "bir", "nbi", "police", "pulis", "government", "ayuda", "assistance", "benefit", "relief", "subsidy", "voucher", "certificate", "clearance", "license", "barangay", "philpost", "postal service"],
                                  severity: 4,
                                  detected: false
                                },
                                "Loan scam": {
                                  patterns: ["loan", "utang", "pautang", "low interest", "easy loan", "fast cash", "quick loan", "no collateral", "lending", "credit", "financing", "5-6", "sangla", "pawn", "approve", "disbursement", "cash loan"],
                                  severity: 4,
                                  detected: false
                                },
                                "Text and call scam": {
                                  patterns: ["sim", "text", "message", "call", "globe", "smart", "dito", "tm", "sun", "tnt", "load", "promo", "data", "points", "rewards", "winner", "subscriber", "subscriber"],
                                  severity: 3,
                                  detected: false
                                }
                              };
                                // Combine all text for analysis
                              const content = (
                                (analysisResult.explanation_english || "") + " " + 
                                (scamContent || "") + " " + 
                                (analysisResult.image_analysis || "")
                              ).toLowerCase();
                              
                              // Use regex for more accurate pattern matching
                              const patternMatches = {};
                              let totalSeverity = 0;
                              let maxPossibleSeverity = 0;
                              let detectedCount = 0;
                              
                              // Enhanced detection algorithm with confidence levels and pattern matching
                              for (const [indicator, data] of Object.entries(commonIndicators)) {
                                maxPossibleSeverity += data.severity;
                                let patternHits = 0;
                                let totalPatterns = data.patterns.length;
                                
                                // Count how many patterns match
                                for (const pattern of data.patterns) {
                                  // Use word boundary for more accurate matching when appropriate
                                  const patternToCheck = pattern.length > 3 ? 
                                    new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i') : 
                                    pattern.toLowerCase();
                                  
                                  if (typeof patternToCheck === 'object' && patternToCheck instanceof RegExp) {
                                    if (patternToCheck.test(content)) {
                                      patternHits++;
                                    }
                                  } else if (content.includes(patternToCheck)) {
                                    patternHits++;
                                  }
                                }
                                
                                // Calculate confidence based on number of patterns matched
                                const confidence = patternHits / totalPatterns;
                                
                                // Mark as detected with different thresholds based on severity
                                const detectionThreshold = data.severity >= 4 ? 0.1 : 0.15;  // Higher severity needs fewer matches
                                
                                if (confidence >= detectionThreshold) {
                                  data.detected = true;
                                  data.confidence = confidence;
                                  data.matches = patternHits;
                                  patternMatches[indicator] = {
                                    severity: data.severity,
                                    confidence: confidence,
                                    matches: patternHits
                                  };
                                  
                                  // Add to total severity score (weighted by confidence)
                                  totalSeverity += data.severity * Math.min(1, confidence * 1.5); // Boost confidence a bit
                                  detectedCount++;
                                }
                              }
                              
                              // Calculate our own risk percentage based on indicator severity
                              let calculatedRiskPercentage = 0;
                              if (maxPossibleSeverity > 0) {
                                // Base calculation on severity of detected indicators
                                calculatedRiskPercentage = Math.min(100, Math.round((totalSeverity / Math.max(28, maxPossibleSeverity * 0.3)) * 100));
                                
                                // Adjust based on number of indicators detected (more indicators = higher risk)
                                if (detectedCount >= 5) calculatedRiskPercentage = Math.min(100, calculatedRiskPercentage + 15);
                                else if (detectedCount >= 3) calculatedRiskPercentage = Math.min(100, calculatedRiskPercentage + 10);
                                else if (detectedCount >= 2) calculatedRiskPercentage = Math.min(100, calculatedRiskPercentage + 5);
                                
                                // If high-severity indicators detected, ensure minimum risk level
                                const hasHighSeverityIndicator = Object.values(patternMatches).some(m => m.severity >= 5);
                                if (hasHighSeverityIndicator) calculatedRiskPercentage = Math.max(calculatedRiskPercentage, 75);
                                
                                // If financial data or payment requested, ensure higher risk
                                const hasFinancialRequest = patternMatches["Request for personal data"] || 
                                                           patternMatches["Financial information request"] ||
                                                           patternMatches["Payment upfront"] ||
                                                           patternMatches["Remittance scam"];
                                if (hasFinancialRequest) calculatedRiskPercentage = Math.max(calculatedRiskPercentage, 70);
                              }
                              
                              // If no indicators detected but API reports high risk, set a baseline
                              if (detectedCount === 0 && percent > 50) {
                                calculatedRiskPercentage = Math.max(calculatedRiskPercentage, 55);
                              }
                              
                              // Blend our calculation with the API's report for a balanced assessment
                              // Weight more toward our calculation if we found multiple indicators
                              const finalRiskPercentage = detectedCount >= 3 ? 
                                Math.round(calculatedRiskPercentage * 0.7 + percent * 0.3) : 
                                Math.round(calculatedRiskPercentage * 0.5 + percent * 0.5);
                              
                              // Extract any additional indicators from the AI explanation
                              const extractedIndicators = extractScamIndicators(analysisResult.explanation_english);
                              
                              // Get all detected indicators
                              const detectedIndicators = Object.entries(commonIndicators)
                                .filter(([_, data]) => data.detected)
                                .map(([name, _]) => name)
                                // Sort by severity (highest first)
                                .sort((a, b) => {
                                  return (commonIndicators[b].severity || 0) - (commonIndicators[a].severity || 0);
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
                              
                              if (detectedIndicators.length === 0) {
                                return (
                                  <div className="bg-white/60 dark:bg-gray-900/30 rounded-lg p-4 border border-current border-opacity-30">
                                    <p className="text-sm italic text-gray-600 dark:text-gray-400">
                                      {percent < 25 
                                        ? 'No significant scam indicators detected in this content.' 
                                        : 'No specific indicators detected. Please refer to the detailed explanation below.'}
                                    </p>
                                  </div>
                                );
                              }
                              
                              // Get badge color based on risk percentage
                              const getBadgeColorClass = () => {
                                if (percent >= 75) return 'bg-red-900 border-red-700 text-white';
                                if (percent >= 50) return 'bg-red-800 border-red-700 text-white';
                                if (percent >= 25) return 'bg-red-700 border-red-600 text-white';
                                return 'bg-yellow-700 border-yellow-600 text-white';
                              };
                              
                              return (
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
                              );
                            })()}
                          </div>
                        )}

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
