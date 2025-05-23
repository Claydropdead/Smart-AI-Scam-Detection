"use client";

import { useState, useEffect } from 'react';
import { saveUserConsent } from '../utils/consentManager';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export default function TermsAndConditionsModal({ 
  isOpen, 
  onAccept, 
  onClose 
}: TermsAndConditionsModalProps) {
  const [language, setLanguage] = useState<'english' | 'tagalog'>('english');

  // Close modal with ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-4 pb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mt-16 sm:mt-8 mx-4 mb-4 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {language === 'english' ? 'Terms and Conditions' : 'Mga Tuntunin at Kondisyon'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('english')}
              className={`px-3 py-1 rounded text-sm ${
                language === 'english'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('tagalog')}
              className={`px-3 py-1 rounded text-sm ${
                language === 'tagalog'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              Tagalog
            </button>
          </div>
        </div>
          <div className="p-6 overflow-y-auto max-h-[50vh] sm:max-h-[60vh] md:max-h-[65vh] overflow-x-hidden">
          {language === 'english' ? (
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">ScamDetect AI Terms and Conditions</h3>
              
              <p>By using ScamDetect AI's scam analysis service, you agree to the following terms and conditions:</p>
              
              <h4 className="font-semibold mt-4">1. Purpose and Limitations</h4>
              <p>ScamDetect AI is designed to help identify potential scams in text messages, emails, and images. This service is provided for informational purposes only and should not be considered as definitive legal or financial advice.</p>
              
              <h4 className="font-semibold mt-4">2. No Guarantee of Accuracy</h4>
              <p>While we strive for accuracy in our analysis, ScamDetect AI cannot guarantee 100% accuracy in scam detection. False positives and false negatives may occur. Users should exercise their own judgment when acting on the information provided.</p>
              
              <h4 className="font-semibold mt-4">3. Data Usage</h4>
              <p>When you submit content for analysis:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Your text and images will be processed by our AI system to perform the analysis.</li>
                <li>We may store anonymized data to improve our service and detection capabilities.</li>
                <li>We do not sell or share your personal data with third parties for marketing purposes.</li>
              </ul>
              
              <h4 className="font-semibold mt-4">4. User Responsibility</h4>
              <p>Users are responsible for:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Providing accurate information for analysis.</li>
                <li>Complying with all applicable laws when using this service.</li>
                <li>Not submitting content that violates privacy rights or intellectual property laws.</li>
              </ul>
              
              <h4 className="font-semibold mt-4">5. Liability Limitation</h4>
              <p>ScamDetect AI and its operators shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services or for the cost of procurement of substitute services.</p>
              
              <h4 className="font-semibold mt-4">6. Changes to Terms</h4>
              <p>We reserve the right to modify these terms at any time. Continued use of the service after such modifications constitutes your acceptance of the revised terms.</p>
            </div>
          ) : (
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mga Tuntunin at Kondisyon ng ScamDetect AI</h3>
              
              <p>Sa paggamit ng serbisyo ng pagsusuri ng scam ng ScamDetect AI, sumasang-ayon ka sa mga sumusunod na tuntunin at kondisyon:</p>
              
              <h4 className="font-semibold mt-4">1. Layunin at Limitasyon</h4>
              <p>Ang ScamDetect AI ay dinisenyo upang matulungan ang pagtukoy ng mga potensyal na scam sa mga text message, email, at larawan. Ang serbisyong ito ay ibinibigay para sa layuning pagbibigay-kaalaman lamang at hindi dapat ituring na tiyak na legal o pinansyal na payo.</p>
              
              <h4 className="font-semibold mt-4">2. Walang Garantiya ng Katumpakan</h4>
              <p>Bagaman nagsisikap kami para sa katumpakan sa aming pagsusuri, hindi makakagarantiya ng ScamDetect AI ang 100% na katumpakan sa pagtukoy ng scam. Maaaring mangyari ang mga maling positibo at maling negatibong resulta. Ang mga gumagamit ay dapat gamitin ang sarili nilang paghatol kapag kumikilos batay sa impormasyong ibinigay.</p>
              
              <h4 className="font-semibold mt-4">3. Paggamit ng Data</h4>
              <p>Kapag nagsumite ka ng nilalaman para sa pagsusuri:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Ang iyong teksto at mga larawan ay ipoproseso ng aming AI system upang magsagawa ng pagsusuri.</li>
                <li>Maaari kaming mag-imbak ng hindi nagpapakilalang data upang mapabuti ang aming serbisyo at mga kakayahan sa pagtukoy.</li>
                <li>Hindi namin ibinebenta o ibinabahagi ang iyong personal na data sa mga third party para sa mga layuning pang-marketing.</li>
              </ul>
              
              <h4 className="font-semibold mt-4">4. Responsibilidad ng Gumagamit</h4>
              <p>Ang mga gumagamit ay may pananagutan para sa:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Pagbibigay ng tumpak na impormasyon para sa pagsusuri.</li>
                <li>Pagsunod sa lahat ng naaangkop na batas kapag gumagamit ng serbisyong ito.</li>
                <li>Hindi pagsumite ng nilalaman na lumalabag sa mga karapatan sa privacy o mga batas sa intellectual property.</li>
              </ul>
              
              <h4 className="font-semibold mt-4">5. Limitasyon ng Pananagutan</h4>
              <p>Ang ScamDetect AI at ang mga operator nito ay hindi mananagot para sa anumang direkta, hindi direkta, insidental, espesyal, o konsekwenteng pinsala na magreresulta mula sa paggamit o kawalan ng kakayahang gumamit ng aming mga serbisyo o para sa gastos ng pagkuha ng mga kapalit na serbisyo.</p>
              
              <h4 className="font-semibold mt-4">6. Mga Pagbabago sa Tuntunin</h4>
              <p>Nakalaan ang aming karapatan na baguhin ang mga tuntuning ito anumang oras. Ang patuloy na paggamit ng serbisyo pagkatapos ng nasabing mga pagbabago ay bumubuo sa iyong pagtanggap sa mga binagong tuntunin.</p>
            </div>
          )}
        </div>
        
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 order-2 sm:order-1"
          >
            {language === 'english' ? 'Decline' : 'Tanggihan'}
          </button>
          <button
            onClick={() => {
              saveUserConsent('termsAndConditions');
              onAccept();
            }}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 order-1 sm:order-2"
          >
            {language === 'english' ? 'I Accept the Terms' : 'Tinatanggap Ko ang Mga Tuntunin'}
          </button>
        </div>
      </div>
    </div>
  );
}
