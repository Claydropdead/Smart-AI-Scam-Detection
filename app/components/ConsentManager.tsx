"use client";

import { useState, useEffect } from 'react';
import { getUserConsents, clearAllConsents } from '../utils/consentManager';

export default function ConsentManager() {
  const [consents, setConsents] = useState<Record<string, any>>({});
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Update consents whenever local storage changes
    const updateConsents = () => {
      setConsents(getUserConsents());
    };

    // Check initially
    updateConsents();

    // Set up listener for storage events (for multi-tab scenarios)
    window.addEventListener('storage', updateConsents);

    // Regular polling as a fallback
    const interval = setInterval(updateConsents, 5000);

    return () => {
      window.removeEventListener('storage', updateConsents);
      clearInterval(interval);
    };
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Handle clearing all consents
  const handleClearConsents = () => {
    if (confirm('Are you sure you want to clear all consent data? You will need to accept the terms again to use the service.')) {
      clearAllConsents();
      setConsents({});
      window.location.reload(); // Reload to show terms again
    }
  };

  // Legacy format support
  useEffect(() => {
    const legacyConsent = localStorage.getItem('scamDetectTermsAccepted');
    
    if (legacyConsent === 'true' && !consents?.termsAndConditions) {
      // We have a legacy consent but no new format - update display only
      setConsents(prev => ({
        ...prev,
        termsAndConditions: {
          value: true,
          timestamp: 'Unknown (legacy format)',
          legacy: true
        }
      }));
    }
  }, [consents]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Privacy & Consent</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-4 text-sm">
          <div className="mb-3">
            <p className="text-gray-600 dark:text-gray-300">
              This shows the current consent status for this device. You can revoke all consents by clicking the button below.
            </p>
          </div>
          
          {Object.keys(consents).length > 0 ? (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Active Consents:</h4>
              <ul className="space-y-2">
                {Object.entries(consents).map(([key, data]: [string, any]) => (
                  <li key={key} className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{key}:</span>
                    <span className="text-green-600 dark:text-green-400">
                      Accepted {data.legacy ? data.timestamp : `on ${formatDate(data.timestamp)}`}
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleClearConsents}
                  className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Revoke All Consents
                </button>
              </div>
            </div>
          ) : (
            <p className="text-yellow-600 dark:text-yellow-400">
              No consents have been given. You need to accept the terms to use the analysis features.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
