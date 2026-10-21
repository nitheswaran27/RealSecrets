import React, { useState } from 'react';
import SecretCodeModal from './components/SecretCodeModal.jsx';
import ProfileSelector from './components/ProfileSelector.jsx';
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

  const isUnlocked = Boolean(secretCode);

  const handleUnlock = (verifiedCode) => {
    setSecretCode(verifiedCode);
    sessionStorage.setItem(SESSION_CODE_KEY, verifiedCode);
  };

  const handleSelectProfile = (profile) => {
    if (profile === 'N' || profile === 'H') {
      setCurrentProfile(profile);
      sessionStorage.setItem(SESSION_PROFILE_KEY, profile);
    }
  };

  const handleSwitchProfile = () => {
    setCurrentProfile(null);
    sessionStorage.removeItem(SESSION_PROFILE_KEY);
  };

  const handleLock = () => {
    setSecretCode('');
    setCurrentProfile(null);
    sessionStorage.removeItem(SESSION_CODE_KEY);
    sessionStorage.removeItem(SESSION_PROFILE_KEY);
    clearKeyCache();
  };

  return (
    <div style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      {/* Screen 1: Secret Code Popup Modal */}
      {!isUnlocked && (
        <SecretCodeModal
          onUnlock={handleUnlock}
          defaultCode="bepositive"
        />
      )}

      {/* Screen 2: Profile Selection (Who are you? N or H) */}
      {isUnlocked && !currentProfile && (
        <ProfileSelector
          onSelectProfile={handleSelectProfile}
          onLock={handleLock}
        />
      )}

      {/* Screen 3: Two-Person Private Chat Interface */}
      {isUnlocked && currentProfile && (
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
