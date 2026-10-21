import React, { useState } from 'react';
import SecretCodeModal from './components/SecretCodeModal.jsx';
import ChatInterface from './components/ChatInterface.jsx';
import { clearKeyCache } from './services/crypto.js';

const SESSION_CODE_KEY = 'realsecrets_session_code';
const SESSION_PROFILE_KEY = 'realsecrets_session_profile';

export default function App() {
  const [secretCode, setSecretCode] = useState(() => {
    return sessionStorage.getItem(SESSION_CODE_KEY) || '';
  });

  const [currentProfile, setCurrentProfile] = useState(() => {
    return sessionStorage.getItem(SESSION_PROFILE_KEY) || null;
  });

  const isUnlocked = Boolean(secretCode && currentProfile);

  // Authenticate with both Secret Code & DOB-determined Profile
  const handleUnlock = (verifiedCode, detectedProfile) => {
    setSecretCode(verifiedCode);
    setCurrentProfile(detectedProfile);
    sessionStorage.setItem(SESSION_CODE_KEY, verifiedCode);
    sessionStorage.setItem(SESSION_PROFILE_KEY, detectedProfile);
  };

  // Allows switching directly between N and H once authenticated
  const handleSwitchProfile = () => {
    const nextProfile = currentProfile === 'N' ? 'H' : 'N';
    setCurrentProfile(nextProfile);
    sessionStorage.setItem(SESSION_PROFILE_KEY, nextProfile);
  };

  // Lock sanctum: wipes session and keys, returns to Secret Code + DOB screen
  const handleLock = () => {
    setSecretCode('');
    setCurrentProfile(null);
    sessionStorage.removeItem(SESSION_CODE_KEY);
    sessionStorage.removeItem(SESSION_PROFILE_KEY);
    clearKeyCache();
  };

  return (
    <div style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      {/* Screen 1: Secret Code + Date of Birth Modal (Decides Profile N or H automatically) */}
      {!isUnlocked && (
        <SecretCodeModal
          onUnlock={handleUnlock}
          defaultCode="bepositive"
        />
      )}

      {/* Screen 2: Direct access to Two-Person Private Chat Interface */}
      {isUnlocked && (
        <ChatInterface
          currentProfile={currentProfile}
          secretCode={secretCode}
          onSwitchProfile={handleSwitchProfile}
          onLock={handleLock}
        />
      )}
    </div>
  );
}
