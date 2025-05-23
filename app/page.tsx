// This is a Next.js page component for the landing page of the ScamDetect AI application.
"use client";
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white font-[family-name:var(--font-geist-sans)]">
      {/* Navigation Bar */}
      <nav className="w-full p-4 bg-slate-900/50 backdrop-blur-md shadow-lg fixed top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-sky-400 hover:text-sky-300 transition-colors">
            ScamDetect AI
          </Link>
          <div className="space-x-4">
            <Link href="/" className="hover:text-sky-400 transition-colors">
              Home
            </Link>
            <Link href="/analysis" className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900">
              Analyze Content
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow container mx-auto px-4 pt-28 pb-12 flex flex-col items-center text-center">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            Advanced AI-Powered <span className="text-sky-400">Scam Detection</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8">
            Our intelligent system analyzes text messages, emails, and other content to identify potential scams, helping you stay safe from fraudulent activities. Powered by cutting-edge AI, we provide detailed insights and actionable advice.
          </p>
          <Link href="/analysis" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-xl transition-transform transform hover:scale-105 duration-150">
            Get Started - Analyze Now
          </Link>
        </div>

        <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          {/* Feature 1 */}
          <div className="bg-slate-800/70 p-6 rounded-xl shadow-2xl border border-slate-700 hover:border-sky-500 transition-all duration-300">
            <div className="text-3xl mb-3 text-sky-400">🛡️</div>
            <h3 className="text-xl font-semibold mb-2">Comprehensive Analysis</h3>
            <p className="text-slate-400 text-sm">
              Leverages advanced AI (Gemini API) to dissect text for subtle scam indicators, including typosquatting, suspicious links, and manipulative language.
            </p>
          </div>
          {/* Feature 2 */}
          <div className="bg-slate-800/70 p-6 rounded-xl shadow-2xl border border-slate-700 hover:border-sky-500 transition-all duration-300">
            <div className="text-3xl mb-3 text-sky-400">📊</div>
            <h3 className="text-xl font-semibold mb-2">Structured Risk Assessment</h3>
            <p className="text-slate-400 text-sm">
              Receive a clear risk status (Low, Medium, High), probability score, and AI confidence level for each analysis.
            </p>
          </div>
          {/* Feature 3 */}
          <div className="bg-slate-800/70 p-6 rounded-xl shadow-2xl border border-slate-700 hover:border-sky-500 transition-all duration-300">
            <div className="text-3xl mb-3 text-sky-400">🇵🇭</div>
            <h3 className="text-xl font-semibold mb-2">Bilingual & Localized</h3>
            <p className="text-slate-400 text-sm">
              Get explanations in both English and Tagalog, with advice and reporting channels relevant to the Philippines.
            </p>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="py-16 bg-slate-800/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="bg-sky-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">1</div>
              <h3 className="text-xl font-semibold mb-2">Input Text</h3>
              <p className="text-slate-400 text-sm">Navigate to the 'Analyze Content' page and paste the suspicious text (SMS, email, etc.) into the input field.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-sky-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">2</div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-slate-400 text-sm">Our system sends the text to the Gemini API, which performs an in-depth analysis based on a sophisticated prompt.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-sky-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">3</div>
              <h3 className="text-xl font-semibold mb-2">View Results</h3>
              <p className="text-slate-400 text-sm">Receive a structured JSON response with risk status, explanations, advice, and reporting channels, all clearly displayed.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full p-8 text-center text-slate-400 text-sm bg-slate-900">
        <p>&copy; ${new Date().getFullYear()} ScamDetect AI. All rights reserved.</p>
        <p className="mt-1">Powered by Gemini API & Next.js</p>
      </footer>
    </div>
  );
}
