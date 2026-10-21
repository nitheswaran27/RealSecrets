import React, { useState } from 'react';
import SecretCodeModal from './components/SecretCodeModal.jsx';
import ChatInterface from './components/ChatInterface.jsx';

// Wipe any legacy stored session keys on load so the app always opens fresh
try {
  sessionStorage.removeItem('realsecrets_session_code');
  sessionStorage.removeItem('realsecrets_session_profile');
} catch {
  // ignore
}

export default function App() {
  // Pure in-memory state: Never persist secret passkey or profile across page loads/sessions.
  // Every page visit opens fresh, requiring the Secret Code & Date of Birth.
  const [secretCode, setSecretCode] = useState('');
  const [currentProfile, setCurrentProfile] = useState(null);

  const isUnlocked = Boolean(secretCode && currentProfile);

  // Authenticate with both Secret Code & DOB-determined Profile
  const handleUnlock = (verifiedCode, detectedProfile) => {
    setSecretCode(verifiedCode);
    setCurrentProfile(detectedProfile);
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
        />
      )}
    </div>
  );
}
