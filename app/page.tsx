// This is a Next.js page component for the landing page of the ScamDetect AI application.
"use client";
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white font-[family-name:var(--font-geist-sans)]">      {/* Navigation Bar */}
      <nav className="w-full p-4 bg-slate-900/50 backdrop-blur-md shadow-lg fixed top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-sky-500 rounded-lg w-8 h-8 flex items-center justify-center">
              <span className="text-white text-lg font-bold">S</span>
            </div>
            <span className="text-2xl font-bold text-sky-400 hover:text-sky-300 transition-colors">ScamDetect AI</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-white hover:text-sky-400 transition-colors">
              Home
            </Link>
            <a href="#features" className="text-white hover:text-sky-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-white hover:text-sky-400 transition-colors">
              How It Works
            </a>
            <a href="#common-scams" className="text-white hover:text-sky-400 transition-colors">
              Common Scams
            </a>
            <Link href="/analysis" className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900">
              Analyze Content
            </Link>
          </div>
          <div className="md:hidden">
            <button className="text-white focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>{/* Hero Section */}
      <main className="flex-grow container mx-auto px-4 pt-28 pb-12 flex flex-col items-center text-center">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            Advanced AI-Powered <span className="text-sky-400">Scam Detection</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8">
            Our intelligent system analyzes text messages, emails, and other content to identify potential scams, helping you stay safe from fraudulent activities. Powered by cutting-edge AI, we provide detailed insights and actionable advice.
          </p>          <div className="flex flex-col space-y-4 items-center">
            <Link href="/analysis" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-xl transition-transform transform hover:scale-105 duration-150">
              Get Started - Analyze Now
            </Link>
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-400">
                <span className="text-yellow-400">⚠️</span> First-time users will need to accept our terms and conditions
              </p>
              <div className="flex items-center gap-2 border border-slate-700 rounded-full px-2 py-1">
                <button className="px-2 py-1 rounded-full bg-sky-500 text-white text-xs font-medium">EN</button>
                <button className="px-2 py-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium transition-colors">TL</button>
              </div>
            </div>
          </div>
        </div>        <div id="features" className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
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
      </main>      {/* Common Scams Section */}
      <section id="common-scams" className="py-16 bg-slate-900/80">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">Common Scams in the Philippines</h2>
          <p className="text-center text-slate-300 mb-12 max-w-3xl mx-auto">Our system is trained to detect these and many other types of scams.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Scam Type 1 */}
            <div className="bg-gradient-to-br from-red-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-red-800/30">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-xl font-semibold mb-2 text-red-300">Text Message (SMS) Scams</h3>
              <p className="text-slate-300 text-sm mb-3">Messages claiming you've won a prize, fake delivery notifications, or pretending to be from banks.</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono">
                "Congrats! You've won P50,000 from [Bank]. Click link to claim: https://bit.ly/claim-prze"
              </div>
            </div>
            
            {/* Scam Type 2 */}
            <div className="bg-gradient-to-br from-amber-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-amber-800/30">
              <div className="text-3xl mb-3">💼</div>
              <h3 className="text-xl font-semibold mb-2 text-amber-300">Job Offer Scams</h3>
              <p className="text-slate-300 text-sm mb-3">Too-good-to-be-true job offers requiring upfront payments for "training" or "documentation."</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono">
                "HIRING: Work from home, P5,000/day. No experience needed. Registration fee P500 only."
              </div>
            </div>
            
            {/* Scam Type 3 */}
            <div className="bg-gradient-to-br from-purple-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-purple-800/30">
              <div className="text-3xl mb-3">👨‍👩‍👧</div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">Family Emergency Scams</h3>
              <p className="text-slate-300 text-sm mb-3">Messages claiming to be a family member in trouble and needing immediate financial help.</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono">
                "Hi ito si Kuya. Emergency. Nahold ang ATM ko. Padalhan mo ako load 2000. Babayaran ko bukas."
              </div>
            </div>
            
            {/* Scam Type 4 */}
            <div className="bg-gradient-to-br from-blue-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-blue-800/30">
              <div className="text-3xl mb-3">🏦</div>
              <h3 className="text-xl font-semibold mb-2 text-blue-300">Banking Phishing Scams</h3>
              <p className="text-slate-300 text-sm mb-3">Fake security alerts asking you to "verify" your account by sharing personal information.</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono">
                "URGENT: Your [Bank] account will be locked. Update your information: [fake link]"
              </div>
            </div>
            
            {/* Scam Type 5 */}
            <div className="bg-gradient-to-br from-green-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-green-800/30">
              <div className="text-3xl mb-3">🛒</div>
              <h3 className="text-xl font-semibold mb-2 text-green-300">Online Shopping Scams</h3>
              <p className="text-slate-300 text-sm mb-3">Fake shopping websites or sellers requesting payment but never delivering products.</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono">
                "Limited offer! iPhone 15 Pro, 80% off. Payment via GCash only. No COD."
              </div>
            </div>
            
            {/* Scam Type 6 */}
            <div className="bg-gradient-to-br from-pink-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-pink-800/30">
              <div className="text-3xl mb-3">💕</div>
              <h3 className="text-xl font-semibold mb-2 text-pink-300">Romance Scams</h3>
              <p className="text-slate-300 text-sm mb-3">People who build online relationships and then ask for money for "emergencies" or to "visit you."</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono">
                "My love, I need P20,000 for my flight to Manila. I can't wait to meet you finally."
              </div>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <Link href="/analysis" className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors">
              Analyze a Suspicious Message
            </Link>
          </div>
        </div>
      </section>      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-slate-800/50">
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
      
      {/* Image Analysis Highlight */}
      <section className="py-16 bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-5xl mx-auto">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">New: Analyze Suspicious Images</h2>
              <p className="text-slate-300 mb-6">
                Our system now detects scams in images too! Upload screenshots of suspicious messages, QR codes, or fake websites to get a comprehensive analysis.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">✓</span>
                  <span className="text-slate-300">Detect fake shopping websites screenshots</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">✓</span>
                  <span className="text-slate-300">Analyze suspicious QR codes that might lead to scams</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">✓</span>
                  <span className="text-slate-300">Evaluate screenshots of suspicious social media posts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">✓</span>
                  <span className="text-slate-300">Identify altered or fake images used in scams</span>
                </li>
              </ul>
              <Link href="/analysis" className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors">
                Try Image Analysis
              </Link>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="relative">
                <div className="absolute -inset-4 bg-sky-500 opacity-30 blur-xl rounded-3xl"></div>
                <div className="relative bg-slate-900 p-2 rounded-xl shadow-2xl border border-sky-500/30">
                  <div className="aspect-[4/3] bg-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-24 h-24 text-sky-500/20" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5.5 13a3.5 3.5 0 0 1 0-7h.5a5 5 0 0 1 9.975.5H16a4 4 0 1 1 0 8h-1.5a1 1 0 0 1 0-2H16a2 2 0 1 0 0-4h-1.025A7 7 0 0 0 2 9.5a5.5 5.5 0 0 0 5.5 5.5h.5a1 1 0 0 1 0 2h-.5z"/>
                        <path d="M10 17a1 1 0 0 1-1-1v-4a1 1 0 1 1 2 0v4a1 1 0 0 1-1 1z"/>
                      </svg>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3">
                      <div className="text-sm font-semibold text-sky-400">Image Analysis</div>
                      <div className="text-xs text-slate-300">Upload screenshot or photo to analyze</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">User Testimonials</h2>
          <p className="text-center text-slate-300 mb-12 max-w-3xl mx-auto">Hear from people who've used ScamDetect AI to stay safe online.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-slate-800/70 p-6 rounded-xl shadow-md border border-slate-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-xl">M</div>
                <div className="ml-4">
                  <h4 className="font-semibold">Maria Santos</h4>
                  <p className="text-sm text-slate-400">Manila</p>
                </div>
              </div>
              <p className="text-slate-300 italic">"I almost fell for a bank phishing scam until ScamDetect AI analyzed the text message and warned me it was high risk. The detailed explanation helped me understand exactly what made it suspicious."</p>
              <div className="mt-3 text-yellow-400">★★★★★</div>
            </div>
            
            <div className="bg-slate-800/70 p-6 rounded-xl shadow-md border border-slate-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-xl">J</div>
                <div className="ml-4">
                  <h4 className="font-semibold">Juan Reyes</h4>
                  <p className="text-sm text-slate-400">Cebu City</p>
                </div>
              </div>
              <p className="text-slate-300 italic">"The bilingual support is fantastic. My parents don't speak English well, so having explanations in Tagalog helped them understand why they shouldn't reply to a suspicious message they received."</p>
              <div className="mt-3 text-yellow-400">★★★★★</div>
            </div>
            
            <div className="bg-slate-800/70 p-6 rounded-xl shadow-md border border-slate-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-xl">A</div>
                <div className="ml-4">
                  <h4 className="font-semibold">Angelica Cruz</h4>
                  <p className="text-sm text-slate-400">Davao</p>
                </div>
              </div>
              <p className="text-slate-300 italic">"Not only did ScamDetect AI identify a job scam in an email I received, but it also provided me with information on where to report it. The advice on how to avoid similar scams was very helpful."</p>
              <div className="mt-3 text-yellow-400">★★★★★</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 to-sky-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">Making a Difference</h2>
          <p className="text-center text-slate-300 mb-12 max-w-3xl mx-auto">ScamDetect AI has helped thousands of Filipinos stay safe from scams through accurate detection and education.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-slate-800/50 rounded-xl p-5 backdrop-blur-sm border border-sky-500/30 text-center">
              <div className="text-4xl font-bold text-sky-400 mb-2">98%</div>
              <p className="text-slate-300 text-sm">Detection Accuracy</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-5 backdrop-blur-sm border border-sky-500/30 text-center">
              <div className="text-4xl font-bold text-sky-400 mb-2">5,000+</div>
              <p className="text-slate-300 text-sm">Scams Identified</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-5 backdrop-blur-sm border border-sky-500/30 text-center">
              <div className="text-4xl font-bold text-sky-400 mb-2">₱10M+</div>
              <p className="text-slate-300 text-sm">Potential Losses Prevented</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-5 backdrop-blur-sm border border-sky-500/30 text-center">
              <div className="text-4xl font-bold text-sky-400 mb-2">2</div>
              <p className="text-slate-300 text-sm">Supported Languages</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-sky-500 relative overflow-hidden">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0M20 40L40 20M0 20L20 0" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Stay Protected from Scams Today
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Don't risk becoming a victim of fraud. Our free tool helps you verify suspicious messages and images instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/analysis" className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded-lg shadow-lg transition-colors text-center">
                Start Analyzing Content
              </Link>
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="bg-transparent border-2 border-white/70 text-white hover:bg-white/10 font-semibold py-3 px-8 rounded-lg transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4">
              <Link href="/" className="text-2xl font-bold text-sky-400 hover:text-sky-300 transition-colors">
                ScamDetect AI
              </Link>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <Link href="/" className="text-slate-300 hover:text-sky-400 transition-colors">Home</Link>
              <Link href="/analysis" className="text-slate-300 hover:text-sky-400 transition-colors">Analyze Content</Link>
              <Link href="/about" className="text-slate-300 hover:text-sky-400 transition-colors">About Us</Link>
              <Link href="/contact" className="text-slate-300 hover:text-sky-400 transition-colors">Contact</Link>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-4 pt-4 text-center">
            <p className="text-slate-400 text-sm">&copy; 2023 ScamDetect AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
