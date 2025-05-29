"use client"; // Add this directive for client-side interactivity

import Link from 'next/link';
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import TermsAndConditionsModal from "../components/TermsAndConditionsModal";
import ConsentManager from "../components/ConsentManager";
import { hasUserConsent } from "../utils/consentManager";
import { ScamDetectionResult } from './interfaces';
import ResultsDisplay from './ResultsDisplay';

export default function Home() {
  const [scamContent, setScamContent] = useState("");
  const [analysisResult, setAnalysisResult] = useState<ScamDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Check if user has previously accepted terms
  useEffect(() => {
    // Check if the user has consent using our new system
    const termsAccepted = hasUserConsent('termsAndConditions');
    
    // Also check the legacy formats for backward compatibility
    const legacyTermsAccepted = 
      localStorage.getItem('threatShieldTermsAccepted') === 'true' ||
      localStorage.getItem('scamDetectTermsAccepted') === 'true';
    
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
    localStorage.setItem('threatShieldTermsAccepted', 'true');
    setHasAcceptedTerms(true);
    setShowTermsModal(false);
  };
  
  // Handle closing terms (declining)
  const handleCloseTerms = () => {
    setShowTermsModal(false);
  };
  
  // Handle voice recording
  const startRecording = async () => {
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
      return;
    }
    
    try {
      // Clear previous recording data
      setAudioBlob(null);
      setAudioURL(null);
      setRecordingDuration(0);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Create URL for audio playback
        const audioURL = URL.createObjectURL(audioBlob);
        setAudioURL(audioURL);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer to track recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setPermissionDenied(true);
      setError("Microphone access denied. Please grant permission to use voice analysis.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };
  
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // Clear audio data
      setAudioBlob(null);
      setAudioURL(null);
      setRecordingDuration(0);
    }
  };
  
  const removeAudio = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingDuration(0);
  };
  
  // Format seconds to mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      // Prepare request body with text content (can be empty if image or audio is provided)
      const requestBody: { content: string; imageBase64?: string; audioBase64?: string } = {
        content: scamContent.trim(),
      };

      // If an image is selected, add its base64 data
      if (selectedImage && imagePreview) {
        // Extract the base64 data part (remove the "data:image/jpeg;base64," prefix)
        const base64Data = imagePreview.split(",")[1];
        requestBody.imageBase64 = base64Data;
      }
      
      // If audio is recorded, add its base64 data
      if (audioBlob) {
        // Convert audio blob to base64
        const audioBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            // Extract the base64 part without the prefix
            const base64Content = base64data.split(',')[1];
            resolve(base64Content);
          };
          reader.readAsDataURL(audioBlob);
        });
        
        requestBody.audioBase64 = audioBase64;
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

  return (
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
            🛡️ ThreatShield AI
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
            <span>AI-Powered Threat Detection</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Smart AI Threat Detection
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Protect yourself from evolving digital threats with advanced AI analysis. Get instant risk assessments for trending 
            attacks in messages, emails, websites, and voice communications with real-time threat intelligence.
          </p>
        </div>

        {/* Main Form Container */}
        <main className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-2xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">            {/* Form Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <span className="mr-3 text-4xl">🔍</span>
                Threat Analysis
              </h2>
              <p className="text-blue-100 mt-2 text-lg">Upload text, images, or voice recordings to detect trending threats with AI-powered analysis</p>
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
                  </label>                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Paste suspicious SMS messages, emails, or any text content you want to analyze for potential threats.
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
                      } rounded-xl shadow-sm transition-all duration-200 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 dark:bg-gray-700/50 dark:text-gray-200 text-base placeholder-gray-500 dark:placeholder-gray-400 resize-none hover:shadow-md`}                      placeholder={!hasAcceptedTerms 
                        ? "⚠️ Please accept the terms and conditions first..." 
                        : (imagePreview 
                          ? "💡 Optional: Add text for analysis alongside the image..." 
                          : "📱 Paste suspicious text here (SMS, email, message, etc.)...\n\nExample:\n'ALERT: New login detected from unknown location. Secure your account: unknown-security.com'"
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
                </div>                {/* Image Upload Section */}
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
                </div>                {/* Voice Recording Section */}                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    🎤 Record voice for analysis (optional)
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Record suspicious voice messages, calls, or conversations for AI-powered scam detection analysis.
                  </p>
                  
                  <div className="flex flex-col space-y-4">
                    {audioURL ? (
                      <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
                              Recorded Audio
                            </p>
                            <audio 
                              controls 
                              className="w-full h-12 bg-white dark:bg-gray-900 rounded-lg"
                              src={audioURL}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Tap play to review before submitting
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={removeAudio}
                            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                            disabled={isLoading}
                            title="Remove audio"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <span className="mr-2">✅</span>
                          Audio recorded successfully. You can add text or images for a comprehensive analysis.
                        </p>
                      </div>
                    ) : permissionDenied ? (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-xl p-5">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Microphone access denied</h3>
                            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                              Please grant microphone access in your browser to use voice recording.
                            </p>
                            <button
                              onClick={startRecording}
                              className="mt-3 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 underline"
                            >
                              Try again
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-44 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 transition-all duration-200 relative group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                            </svg>
                          </div>
                          <p className="mb-2 text-base font-medium text-gray-700 dark:text-gray-300">
                            <span className="font-bold text-blue-600 dark:text-blue-400">Click to record</span> your voice
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Record up to 5 minutes</p>
                        </div>
                        
                        {/* Recording Controls */}
                        {isRecording ? (
                          <div className="absolute inset-0 bg-black/5 dark:bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-xl">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 animate-pulse">
                              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                              </svg>
                            </div>
                            <p className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                              Recording... {formatDuration(recordingDuration)}
                            </p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
                              <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${Math.min(recordingDuration / 300 * 100, 100)}%` }}></div>
                            </div>
                            <div className="flex items-center space-x-4 w-full">
                              <button
                                onClick={stopRecording}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                                disabled={isLoading}
                              >
                                <div className="flex items-center justify-center">
                                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                  Stop Recording
                                </div>
                              </button>
                              <button
                                onClick={cancelRecording}
                                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                disabled={isLoading}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={startRecording}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                            disabled={isLoading}
                          >
                            <div className="flex items-center justify-center">
                              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                              </svg>
                              Start Recording
                            </div>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>{/* Submit Button */}
                <button
                  type="button"
                  onClick={hasAcceptedTerms ? handleDetectScam : () => setShowTermsModal(true)}
                  disabled={isLoading || (!scamContent.trim() && !imagePreview && !audioBlob) || !hasAcceptedTerms}
                  className={`w-full font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 text-lg ${
                    hasAcceptedTerms && (scamContent.trim() || imagePreview || audioBlob) && !isLoading
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
                      {audioBlob ? 'Analyzing voice recording...' : 'Analyzing with AI...'}
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
                  <ResultsDisplay 
                    analysisResult={analysisResult} 
                    scamContent={scamContent} 
                  />
                )}                {/* Awaiting Analysis State */}
                {!isLoading && !analysisResult && !error && (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {scamContent.trim() || imagePreview || audioBlob ? "Ready to Analyze" : "Upload Content to Start"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {scamContent.trim() || imagePreview || audioBlob 
                          ? "Click the analyze button to start AI-powered scam detection" 
                          : "Add text, upload an image, or record a voice message to begin scam analysis"
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
          <div className="text-center">          {/* Removed shield, name and tagline */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              &copy; 2025 ThreatShield AI. All rights reserved.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Made with <span className="text-red-500">❤</span> by <a href="https://pinesprojects.hashnode.dev" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors">Pinesprojects</a>
            </p>
              {/* Removed Next.js and Gemini logos */}
              {/* Removed Terms and Conditions button */}
          </div>
        </footer>
      </div>
    </div>
  );
}


