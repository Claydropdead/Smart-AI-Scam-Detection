// Modern refactored landing page for ThreatShield AI with enhanced interactivity
"use client";
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('hero');
  const [isScrolled, setIsScrolled] = useState(false);
  const [threatIndex, setThreatIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  // Enhanced data structures
  const threats = [
    {
      type: "Banking Phishing",
      example: "URGENT: Your BPI account will be suspended. Verify now: https://bpi-verify.net",
      risk: 95,
      indicators: ["Urgent language", "Fake URL", "Account threat", "Immediate action required"]
    },
    {
      type: "Deepfake Content",
      example: "Video call from your CEO: 'Transfer ₱500,000 to this emergency account immediately'",
      risk: 88,
      indicators: ["Deepfake audio/video", "Authority impersonation", "Urgent financial request", "Bypass procedures"]
    },
    {
      type: "AI-Generated Threats",
      example: "Sophisticated email mimicking your colleague's writing style requesting sensitive data",
      risk: 92,
      indicators: ["AI-crafted content", "Perfect grammar", "Familiar tone", "Sensitive data request"]
    },
    {
      type: "Social Engineering",
      example: "WhatsApp from 'family member': 'In emergency, need money for hospital, phone broken'",
      risk: 90,
      indicators: ["Emotional manipulation", "Urgency tactics", "Identity theft", "Financial pressure"]
    }
  ];
  const testimonials = [
    {
      name: "Maria Santos",
      role: "Teacher, Manila",
      message: "This tool saved me from a sophisticated deepfake attack! The AI detected threats I never would have spotted.",
      rating: 5,
      avatar: "👩‍🏫"
    },
    {
      name: "Juan Dela Cruz",
      role: "OFW, Dubai",
      message: "As an OFW, I face various digital threats daily. ThreatShield AI gives me complete peace of mind.",
      rating: 5,
      avatar: "👨‍💼"
    },
    {
      name: "Ana Rodriguez",
      role: "Senior Citizen, Cebu",
      message: "The AI explains complex cyber threats in simple terms. Now I can protect myself from all kinds of attacks!",
      rating: 5,
      avatar: "👵"
    }
  ];

  useEffect(() => {
    // Scroll detection
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Section detection for active navigation
      const sections = ['hero', 'how-it-works', 'threats'];
      const current = sections.find(section => {
        const element = sectionsRef.current[section];
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setCurrentSection(current);
    };

    window.addEventListener('scroll', handleScroll);

    // Auto-rotate threats and testimonials
    const threatInterval = setInterval(() => {
      setThreatIndex(prev => (prev + 1) % threats.length);
    }, 6000);

    const testimonialInterval = setInterval(() => {
      setTestimonialIndex(prev => (prev + 1) % testimonials.length);
    }, 4000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(threatInterval);
      clearInterval(testimonialInterval);
    };
  }, [threats.length, testimonials.length]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-x-hidden">      {/* Modern Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-slate-900/95 backdrop-blur-lg shadow-2xl border-b border-slate-700/50' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg blur opacity-70 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">S</span>
                </div>
              </div>              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  ThreatShield AI
                </span>
                <span className="text-xs text-slate-400">Powered by AI</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              { [
                { id: 'hero', label: 'Home' },
                { id: 'how-it-works', label: 'How It Works' },
                { id: 'threats', label: 'Threats' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    currentSection === id
                      ? 'text-cyan-400'
                      : 'text-slate-300 hover:text-cyan-400'
                  }`}
                >
                  {label}
                  {currentSection === id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link
                href="/analysis"
                className="relative group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
              >
                <span className="relative z-10">Analyze Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-700/50 transition-all duration-300"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`lg:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-80 opacity-100 mt-4' : 'max-h-0 opacity-0'
          } overflow-hidden`}>
            <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-6 space-y-4">
              { [
                { id: 'hero', label: 'Home' },
                { id: 'how-it-works', label: 'How It Works' },
                { id: 'threats', label: 'Threats' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="block w-full text-left px-4 py-3 text-slate-300 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition-all duration-300"
                >
                  {label}
                </button>
              ))}
              <Link
                href="/analysis"
                className="block w-full text-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                Analyze Now
              </Link>
            </div>
          </div>
        </div>
      </nav>      {/* Hero Section */}
      <section 
        id="hero" 
        ref={el => { if (el) sectionsRef.current.hero = el; }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          <div className="max-w-5xl mx-auto">
            {/* Main Headline */}
            <div className="mb-8">              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                <span className="block text-white">Protect Yourself from</span>
                <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                  Digital Threats
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Advanced AI technology that analyzes messages, emails, and images to detect trending threats and cyber attacks before you become a victim. 
                <span className="text-cyan-400 font-semibold"> Powered by cutting-edge machine learning</span>.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex justify-center mb-12">
              <Link
                href="/analysis"
                className="group relative bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/25"
              >
                <span className="relative z-10 flex items-center">
                  🚀 Start Threat Analysis
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Common Threats Section */}
      <section id="common-threats" className="py-16 bg-slate-900/80">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">Digital Threats Detection</h2>
          <p className="text-center text-slate-300 mb-12 max-w-3xl mx-auto">Our AI system is trained to detect traditional scams, emerging cyber threats, and sophisticated attack vectors. Click on any card to see more details.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Scam Type 1 */}
            <div className="group bg-gradient-to-br from-red-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-red-800/30 cursor-pointer hover:border-red-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl">
              <div className="text-3xl mb-3 group-hover:animate-bounce">📱</div>              <h3 className="text-xl font-semibold mb-2 text-red-300 group-hover:text-red-200 transition-colors">SMS & Messaging Threats</h3>
              <p className="text-slate-300 text-sm mb-3 group-hover:text-slate-200 transition-colors">Malicious messages including phishing, smishing, malware links, and social engineering attacks via text.</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono group-hover:bg-black/50 transition-colors">
                "Congrats! You've won P50,000 from [Bank]. Click link to claim: https://bit.ly/claim-prze"
              </div>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded-full">High Risk</span>
              </div>
            </div>
            
            {/* Scam Type 2 */}
            <div className="group bg-gradient-to-br from-amber-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-amber-800/30 cursor-pointer hover:border-amber-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl">
              <div className="text-3xl mb-3 group-hover:animate-bounce">💼</div>              <h3 className="text-xl font-semibold mb-2 text-amber-300 group-hover:text-amber-200 transition-colors">Employment & Business Fraud</h3>
              <p className="text-slate-300 text-sm mb-3 group-hover:text-slate-200 transition-colors">Fraudulent job offers, pyramid schemes, and business opportunity scams designed to extract money or personal information.</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono group-hover:bg-black/50 transition-colors">
                "HIRING: Work from home, P5,000/day. No experience needed. Registration fee P500 only."
              </div>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-1 rounded-full">High Risk</span>
              </div>
            </div>
            
            {/* Scam Type 3 */}
            <div className="group bg-gradient-to-br from-purple-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-purple-800/30 cursor-pointer hover:border-purple-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl">
              <div className="text-3xl mb-3 group-hover:animate-bounce">👨‍👩‍👧</div>              <h3 className="text-xl font-semibold mb-2 text-purple-300 group-hover:text-purple-200 transition-colors">Social Engineering Attacks</h3>
              <p className="text-slate-300 text-sm mb-3 group-hover:text-slate-200 transition-colors">Psychological manipulation tactics including impersonation, urgency creation, and emotional exploitation to extract sensitive information.</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono group-hover:bg-black/50 transition-colors">
                "Hi ito si Kuya. Emergency. Nahold ang ATM ko. Padalhan mo ako load 2000. Babayaran ko bukas."
              </div>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded-full">Very High Risk</span>
              </div>
            </div>
            
            {/* Scam Type 4 */}
            <div className="group bg-gradient-to-br from-blue-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-blue-800/30 cursor-pointer hover:border-blue-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl">
              <div className="text-3xl mb-3 group-hover:animate-bounce">🏦</div>              <h3 className="text-xl font-semibold mb-2 text-blue-300 group-hover:text-blue-200 transition-colors">Financial Phishing Attacks</h3>
              <p className="text-slate-300 text-sm mb-3 group-hover:text-slate-200 transition-colors">Sophisticated attacks targeting banking credentials, cryptocurrency wallets, and financial account access.</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono group-hover:bg-black/50 transition-colors">
                "URGENT: Your [Bank] account will be locked. Update your information: [fake link]"
              </div>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full">Very High Risk</span>
              </div>
            </div>
            
            {/* Scam Type 5 */}
            <div className="group bg-gradient-to-br from-green-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-green-800/30 cursor-pointer hover:border-green-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl">
              <div className="text-3xl mb-3 group-hover:animate-bounce">🛒</div>              <h3 className="text-xl font-semibold mb-2 text-green-300 group-hover:text-green-200 transition-colors">E-commerce Fraud</h3>
              <p className="text-slate-300 text-sm mb-3 group-hover:text-slate-200 transition-colors">Fake marketplaces, counterfeit goods, payment fraud, and non-delivery scams across online shopping platforms.</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono group-hover:bg-black/50 transition-colors">
                "Limited offer! iPhone 15 Pro, 80% off. Payment via GCash only. No COD."
              </div>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded-full">High Risk</span>
              </div>
            </div>
            
            {/* Scam Type 6 */}
            <div className="group bg-gradient-to-br from-pink-900/40 to-slate-800 p-6 rounded-xl shadow-lg border border-pink-800/30 cursor-pointer hover:border-pink-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl">
              <div className="text-3xl mb-3 group-hover:animate-bounce">💕</div>
              <h3 className="text-xl font-semibold mb-2 text-pink-300 group-hover:text-pink-200 transition-colors">Romance Scams</h3>
              <p className="text-slate-300 text-sm mb-3 group-hover:text-slate-200 transition-colors">People who build online relationships and then ask for money for "emergencies" or to "visit you."</p>
              <div className="bg-black/30 p-3 rounded-md text-xs text-slate-300 italic font-mono group-hover:bg-black/50 transition-colors">
                "My love, I need P20,000 for my flight to Manila. I can't wait to meet you finally."
              </div>
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs bg-pink-900/50 text-pink-300 px-2 py-1 rounded-full">Very High Risk</span>
              </div>
            </div>
          </div>
  
        </div>
      </section>{/* Cyber Attack Detection Section */}
      <section id="cyber-threats" className="py-16 bg-gradient-to-br from-indigo-900 to-slate-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">Protects You Against All Forms of Digital Attacks</h2>
          <p className="text-center text-slate-300 mb-12 max-w-3xl mx-auto">
            Our system uses cutting-edge AI to detect and block a wide range of cybersecurity threats designed to compromise your privacy, data, and safety—before they reach you.
          </p>
          
          <div className="max-w-5xl mx-auto bg-slate-800/40 rounded-2xl p-6 border border-indigo-700/30 mb-10">
            <h3 className="text-2xl font-semibold mb-4 text-center text-white">🔍 Detectable Threat Types:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Threat Type 1 */}
              <div className="bg-gradient-to-br from-blue-900/30 to-transparent p-4 rounded-xl border border-blue-700/30 flex items-start">
                <div className="text-3xl mr-3 text-blue-400 mt-0.5">🎣</div>
                <div>
                  <h4 className="font-semibold text-blue-300 mb-2">Phishing & Smishing Attacks</h4>
                  <p className="text-slate-300 text-sm">Fake emails and text messages pretending to be banks, delivery companies, or government institutions.</p>
                </div>
              </div>
              
              {/* Threat Type 2 */}
              <div className="bg-gradient-to-br from-purple-900/30 to-transparent p-4 rounded-xl border border-purple-700/30 flex items-start">
                <div className="text-3xl mr-3 text-purple-400 mt-0.5">🧠</div>
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Social Engineering Scams</h4>
                  <p className="text-slate-300 text-sm">Deceptive messages that manipulate emotion to trick users into revealing sensitive information.</p>
                </div>
              </div>
              
              {/* Threat Type 3 */}
              <div className="bg-gradient-to-br from-amber-900/30 to-transparent p-4 rounded-xl border border-amber-700/30 flex items-start">
                <div className="text-3xl mr-3 text-amber-400 mt-0.5">🎁</div>
                <div>
                  <h4 className="font-semibold text-amber-300 mb-2">Fake Giveaways & Prizes</h4>
                  <p className="text-slate-300 text-sm">Scams that claim you've won something and ask for personal or payment information.</p>
                </div>
              </div>
              
              {/* Threat Type 4 */}
              <div className="bg-gradient-to-br from-emerald-900/30 to-transparent p-4 rounded-xl border border-emerald-700/30 flex items-start">
                <div className="text-3xl mr-3 text-emerald-400 mt-0.5">💰</div>
                <div>
                  <h4 className="font-semibold text-emerald-300 mb-2">Investment & Cryptocurrency Scams</h4>
                  <p className="text-slate-300 text-sm">Suspicious offers promising guaranteed returns or urgent investment "opportunities."</p>
                </div>
              </div>
              
              {/* Threat Type 5 */}
              <div className="bg-gradient-to-br from-red-900/30 to-transparent p-4 rounded-xl border border-red-700/30 flex items-start">
                <div className="text-3xl mr-3 text-red-400 mt-0.5">🦠</div>
                <div>
                  <h4 className="font-semibold text-red-300 mb-2">Malicious Links & Attachments</h4>
                  <p className="text-slate-300 text-sm">Dangerous files or URLs that could install spyware, ransomware, or keyloggers.</p>
                </div>
              </div>
              
              {/* Threat Type 6 */}
              <div className="bg-gradient-to-br from-sky-900/30 to-transparent p-4 rounded-xl border border-sky-700/30 flex items-start">
                <div className="text-3xl mr-3 text-sky-400 mt-0.5">🎭</div>
                <div>
                  <h4 className="font-semibold text-sky-300 mb-2">Impersonation & Identity Fraud</h4>
                  <p className="text-slate-300 text-sm">Messages pretending to be from your boss, a loved one, or a company to trick you into sending money or information.</p>
                </div>
              </div>
              
              {/* Threat Type 7 */}
              <div className="bg-gradient-to-br from-fuchsia-900/30 to-transparent p-4 rounded-xl border border-fuchsia-700/30 flex items-start">
                <div className="text-3xl mr-3 text-fuchsia-400 mt-0.5">📱</div>
                <div>
                  <h4 className="font-semibold text-fuchsia-300 mb-2">QR Code & Barcode Traps</h4>
                  <p className="text-slate-300 text-sm">Fraudulent images leading to phishing sites or malware downloads.</p>
                </div>
              </div>
              
              {/* Threat Type 8 */}
              <div className="bg-gradient-to-br from-orange-900/30 to-transparent p-4 rounded-xl border border-orange-700/30 flex items-start">
                <div className="text-3xl mr-3 text-orange-400 mt-0.5">🔐</div>
                <div>
                  <h4 className="font-semibold text-orange-300 mb-2">Tech Support or Device Access Scams</h4>
                  <p className="text-slate-300 text-sm">Fraudsters pose as IT staff, customer support, or software providers, urging users to install remote access apps or "security software"—allowing attackers to control your device or steal data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>      </section>
      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-slate-800/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group flex flex-col items-center cursor-pointer hover:transform hover:scale-105 transition-all duration-500">
              <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4 shadow-lg group-hover:shadow-2xl group-hover:animate-pulse transition-all duration-300">1</div>              <h3 className="text-xl font-semibold mb-2 group-hover:text-sky-400 transition-colors">Input Content</h3>
              <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">Navigate to the 'Analyze Content' page and paste suspicious text, upload images, or provide audio files for comprehensive threat analysis.</p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-slate-700/50 p-3 rounded-lg border border-sky-500/30">
                  <div className="text-xs text-sky-400 font-mono">"Suspicious message here..."</div>
                </div>
              </div>
            </div>
            <div className="group flex flex-col items-center cursor-pointer hover:transform hover:scale-105 transition-all duration-500">
              <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4 shadow-lg group-hover:shadow-2xl group-hover:animate-pulse transition-all duration-300">2</div>              <h3 className="text-xl font-semibold mb-2 group-hover:text-sky-400 transition-colors">AI Threat Analysis</h3>
              <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">Our advanced AI system analyzes content using multiple detection models to identify various threat types and attack vectors.</p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-slate-700/50 p-3 rounded-lg border border-sky-500/30">
                  <div className="text-xs text-sky-400 flex items-center">
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-ping mr-2"></div>
                    Analyzing...
                  </div>
                </div>
              </div>
            </div>
            <div className="group flex flex-col items-center cursor-pointer hover:transform hover:scale-105 transition-all duration-500">
              <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-4 shadow-lg group-hover:shadow-2xl group-hover:animate-pulse transition-all duration-300">3</div>              <h3 className="text-xl font-semibold mb-2 group-hover:text-sky-400 transition-colors">View Results</h3>
              <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">Receive detailed threat assessment with risk levels, attack indicators, protective recommendations, and reporting guidance.</p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-slate-700/50 p-3 rounded-lg border border-red-500/30">
                  <div className="text-xs text-red-400 font-semibold">Risk: Very High</div>
                  <div className="text-xs text-slate-300">Probability: 95%</div>
                </div>
              </div>
            </div>
          </div>
  
        </div>
      </section>
        {/* Image Analysis Highlight */}
      <section id="image-analysis" className="py-16 bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-5xl mx-auto">
            <div className="w-full md:w-1/2 order-2 md:order-1">              <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced: Multi-Modal Threat Analysis</h2>
              <p className="text-slate-300 mb-6">
                Our AI system analyzes images, videos, and audio content to detect sophisticated threats including deepfakes, manipulated media, and visual deception tactics.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">✓</span>
                  <span className="text-slate-300">Detect deepfake videos and AI-generated content</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">✓</span>
                  <span className="text-slate-300">Analyze suspicious QR codes and malicious links</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">✓</span>
                  <span className="text-slate-300">Identify manipulated images and fake documents</span>
                </li>
                <li className="flex items-start">
                  <span className="text-sky-400 mr-2">✓</span>
                  <span className="text-slate-300">Detect voice cloning and audio manipulation</span>
                </li>
              </ul>
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
      </section>        {/* CTA Banner */}
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
        {/* Floating elements for visual interest */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-500"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-fade-in">
              Stay Protected from Scams Today
            </h2>
            <p className="text-white/80 text-lg mb-8 animate-fade-in delay-200">
              Don't risk becoming a victim of fraud. Our free tool helps you verify suspicious messages and images instantly.
            </p>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">            <div className="text-center md:text-left mb-4">
              <Link href="/" className="text-2xl font-bold text-sky-400 hover:text-sky-300 transition-colors">
                ThreatShield AI
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
            <p className="text-slate-400 text-sm">&copy; 2025 ThreatShield AI. All rights reserved.</p>
          </div>
        </div>      </footer>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col space-y-3">
          {/* Scroll to Top Button */}
          {isScrolled && (
            <button
              onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
              className="bg-slate-800/90 backdrop-blur-sm hover:bg-slate-700/90 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 border border-slate-600/50 hover:border-cyan-500/50"
              aria-label="Scroll to top"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          )}
          
          {/* Main CTA Button */}
          <Link
            href="/analysis"
            className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-cyan-500/25"
            aria-label="Analyze content"
          >
            <div className="relative">
              <svg className="w-7 h-7 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
