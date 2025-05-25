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
export interface ApiReportAgency {
  name: string;
  url: string; // Changed from link to url, to match API
  description?: string; // Optional description
}

export interface ApiComplaintFilingInfo {
  introduction: string;
  agencies: ApiReportAgency[];
}

export interface ScamDetectionResult {
  // Fields directly from API
  isScam: boolean;
  probability: number; // number, 0-100. Was scam_probability (string)
  confidence: string;  // "Low", "Medium", "High". Was ai_confidence
  explanation: string; // Was explanation_english
  explanationTagalog: string; // Was explanation_tagalog
  riskLevel: string;   // "Low", "Medium", "High", "Very High". API provides this directly.
  advice: string;
  tutorialsAndTips: string[]; // Was how_to_avoid_scams
  complaintFilingInfo: ApiComplaintFilingInfo; // New structure, replaces where_to_report

  // Optional analysis types from API
  audioAnalysis?: string; // Was audio_analysis
  image_analysis?: string; // Kept optional as UI uses it, and API might provide it

  // Added back from previous version as per user request
  true_vs_false?: string;
  true_vs_false_tagalog?: string;

  // Note: Fields like status, assessment, keywords, what_to_do_if_scammed, limited_context
  // are no longer part of this interface as they are not directly returned by the new API structure.
  // ResultsDisplay.tsx will need to be updated to handle their absence or derive them if needed.
}
