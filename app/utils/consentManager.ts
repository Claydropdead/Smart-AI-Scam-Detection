// Storage utilities for user consent tracking

// Save user consent to localStorage
export const saveUserConsent = (consentType: string) => {
  try {
    // Get existing consents
    const existingConsents = getUserConsents();
    
    // Add new consent with timestamp
    existingConsents[consentType] = {
      timestamp: new Date().toISOString(),
      value: true
    };
    
    // Save back to localStorage
    localStorage.setItem('scamDetectConsents', JSON.stringify(existingConsents));
    
    return true;
  } catch (error) {
    console.error('Error saving user consent:', error);
    return false;
  }
};

// Get all user consents from localStorage
export const getUserConsents = () => {
  try {
    const consentsStr = localStorage.getItem('scamDetectConsents');
    return consentsStr ? JSON.parse(consentsStr) : {};
  } catch (error) {
    console.error('Error retrieving user consents:', error);
    return {};
  }
};

// Check if a specific consent has been given
export const hasUserConsent = (consentType: string) => {
  try {
    const consents = getUserConsents();
    return !!(consents[consentType]?.value);
  } catch (error) {
    console.error('Error checking user consent:', error);
    return false;
  }
};

// Clear a specific consent
export const clearUserConsent = (consentType: string) => {
  try {
    const existingConsents = getUserConsents();
    if (existingConsents[consentType]) {
      delete existingConsents[consentType];
      localStorage.setItem('scamDetectConsents', JSON.stringify(existingConsents));
    }
    return true;
  } catch (error) {
    console.error('Error clearing user consent:', error);
    return false;
  }
};

// Clear all consents
export const clearAllConsents = () => {
  try {
    localStorage.removeItem('scamDetectConsents');
    localStorage.removeItem('scamDetectTermsAccepted'); // Also clear the legacy format
    return true;
  } catch (error) {
    console.error('Error clearing all user consents:', error);
    return false;
  }
};
