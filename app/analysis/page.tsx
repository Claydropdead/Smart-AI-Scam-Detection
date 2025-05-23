"use client"; // Add this directive for client-side interactivity

import Link from 'next/link';
import Image from "next/image";
import { useState } from "react";

// Define interfaces for the expected response structure from the API
interface ReportAgency {
  name: string;
  link: string;
}

interface ScamDetectionResult {
  status: string;
  assessment: string;
  scam_probability: string;
  ai_confidence: string;
  explanation_english: string;
  explanation_tagalog: string;
  advice: string;
  how_to_avoid_scams: string[];
  where_to_report: ReportAgency[];
  raw_gemini_response?: string; // Optional for debugging
}

export default function Home() {
  const [scamContent, setScamContent] = useState("");
  const [analysisResult, setAnalysisResult] = useState<ScamDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetectScam = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/detect-scam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: scamContent }),
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

  const getStatusStyles = (status: string | undefined) => {
    const lowerStatus = status?.toLowerCase() || "";
    if (lowerStatus.includes('high risk')) {
      return {
        containerClasses: 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700',
        textClasses: 'text-red-700 dark:text-red-300',
        icon: '🚨'
      };
    } else if (lowerStatus.includes('medium risk')) {
      return {
        containerClasses: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
        textClasses: 'text-yellow-700 dark:text-yellow-300',
        icon: '⚠️'
      };
    } else if (lowerStatus.includes('low risk')) {
      return {
        containerClasses: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700',
        textClasses: 'text-green-700 dark:text-green-300',
        icon: '✅'
      };
    }
    return { // Default / Fallback
      containerClasses: 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600',
      textClasses: 'text-gray-700 dark:text-gray-300',
      icon: 'ℹ️'
    };
  };

  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Navigation Bar */}
      <nav className="w-full p-4 bg-slate-900/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-sky-400 hover:text-sky-300 transition-colors">
            ScamDetect AI
          </Link>
          <div className="space-x-4">
            <Link href="/" className="hover:text-sky-400 transition-colors text-white">
              Home
            </Link>
            <Link href="/analysis" className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900">
              Analyze Content
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content of analysis page, ensure pt-20 or similar to offset fixed nav */}
      <div className="flex flex-col items-center justify-center flex-grow p-4 md:p-8 pt-20 md:pt-24">
        <header className="mb-8 md:mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
            AI Scam Detection System
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
            Utilizing Gemini API for advanced scam detection (Philippines Context)
          </p>
        </header>

        <main className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div>
              <label
                htmlFor="scamContent"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Enter content to analyze (e.g., SMS, email, message):
              </label>
              <textarea
                id="scamContent"
                name="scamContent"
                rows={6}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 text-sm"
                placeholder="Paste text here..."
                value={scamContent}
                onChange={(e) => setScamContent(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button
              type="button"
              onClick={handleDetectScam}
              disabled={isLoading || !scamContent.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Analyzing..." : "Detect Scam"}
            </button>

            {error && (
              <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md">
                <h2 className="text-lg font-semibold mb-2">Error</h2>
                <p>{error}</p>
              </div>
            )}

            {analysisResult && !error && (
              (() => {
                const statusStyles = getStatusStyles(analysisResult.status);
                return (
                  <div className="mt-6 space-y-6">
                    <div className={`p-4 rounded-lg border ${statusStyles.containerClasses}`}>
                      <h2 className={`text-xl font-semibold mb-2 ${statusStyles.textClasses}`}>
                        {statusStyles.icon} {analysisResult.status || "Analysis Complete"}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <p><strong className={statusStyles.textClasses}>Assessment:</strong> {analysisResult.assessment}</p>
                        <p><strong className={statusStyles.textClasses}>Scam Probability:</strong> {analysisResult.scam_probability}</p>
                        <p><strong className={statusStyles.textClasses}>AI Confidence:</strong> {analysisResult.ai_confidence}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Explanation (English):</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{analysisResult.explanation_english}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Paliwanag (Tagalog):</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{analysisResult.explanation_tagalog}</p>
                    </div>

                    {/* Advice section styling can also be dynamic if needed, but keeping it yellow for now */}
                    <div className="p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/60 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
                      <h3 className="text-lg font-semibold mb-1">💡 Advice:</h3>
                      <p className="text-sm whitespace-pre-wrap">{analysisResult.advice}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">🛡️ How to Avoid Scams:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        {analysisResult.how_to_avoid_scams.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
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
                  </div>
                );
              })()
            )}

            {!isLoading && !analysisResult && !error && (
              <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md min-h-[100px] text-gray-700 dark:text-gray-300 flex items-center justify-center">
                <p>Awaiting analysis...</p>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-10 md:mt-12 text-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
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
        </footer>
      </div>
    </div>
  );
}
