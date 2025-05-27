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
    localStorage.setItem('threatShieldConsents', JSON.stringify(existingConsents));
    
    // Also save as simple flag for maximum compatibility
    if (consentType === 'termsAndConditions') {
      localStorage.setItem('threatShieldTermsAccepted', 'true');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user consent:', error);
    return false;
  }
};

// Get all user consents from localStorage
export const getUserConsents = () => {
  try {
    // Try the new key first, then fall back to the old key for backward compatibility
    let consentsStr = localStorage.getItem('threatShieldConsents');
    if (!consentsStr) {
      consentsStr = localStorage.getItem('scamDetectConsents');
    }
    return consentsStr ? JSON.parse(consentsStr) : {};
  } catch (error) {
    console.error('Error retrieving user consents:', error);
    return {};
  }
};

// Check if a specific consent has been given
export const hasUserConsent = (consentType: string) => {
  try {
    // First check the legacy simple flags (more reliable)
    if (consentType === 'termsAndConditions') {
      if (localStorage.getItem('threatShieldTermsAccepted') === 'true' || 
          localStorage.getItem('scamDetectTermsAccepted') === 'true') {
        return true;
      }
    }
    
    // Then check the modern format
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
      localStorage.setItem('threatShieldConsents', JSON.stringify(existingConsents));
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
    // Clear all possible consent storage locations
    localStorage.removeItem('threatShieldConsents');
    localStorage.removeItem('scamDetectConsents'); // Clear old format
    localStorage.removeItem('threatShieldTermsAccepted'); // Clear simple flag
    localStorage.removeItem('scamDetectTermsAccepted'); // Clear legacy format
    return true;
  } catch (error) {
    console.error('Error clearing all user consents:', error);
    return false;
  }
};
