"use client";

// Defines interfaces for scam indicator data structure
export interface IndicatorData {
  patterns: string[];
  severity: number;
  detected: boolean;
  confidence?: number;
  matches?: number;
}

// Interface for pattern match data
export interface IndicatorMatch {
  severity: number;
  confidence: number;
  matches: number;
}

// Type for a collection of indicators
export type CommonIndicators = {
  [key: string]: IndicatorData;
}

// Define interfaces for the expected response structure from the API
export interface ReportAgency {
  name: string;
  link: string;
}

export interface UrlInfo {
  url: string;
  organization?: string;
  verification?: string;
  reason?: string;
}

export interface UrlAnalysis {
  verified_urls: UrlInfo[];
  suspicious_urls: UrlInfo[];
}

export interface LimitedContext {
  details: string;
  recommendations: string[];
}

export interface ScamDetectionResult {
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
  audio_analysis?: string; // Optional analysis of audio content if provided
  raw_gemini_response?: string; // Optional for debugging
  keywords?: string[]; // Optional keywords for additional context
  limited_context?: LimitedContext; // Optional context limitations
  url_analysis?: UrlAnalysis; // Optional URL analysis results
}
