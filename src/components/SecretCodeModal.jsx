import React, { useState, useEffect, useRef } from 'react';
import HeaderBanner from './HeaderBanner.jsx';
import nhLogo from '../assets/nhlogo.webp';
import { Eye, EyeOff, ShieldCheck, AlertCircle, KeyRound } from 'lucide-react';

export default function SecretCodeModal({ onUnlock, defaultCode = 'bepositive' }) {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.trim();

    if (!cleanCode) {
      setError('Please inscribe the sacred passkey.');
      triggerShake();
      return;
    }

    const validCode = import.meta.env.VITE_SECRET_CODE || defaultCode;
    if (cleanCode === validCode) {
      setError('');
      onUnlock(cleanCode);
    } else {
      setError('The secret code is incorrect. The seal remains unbroken.');
      triggerShake();
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  return (
    <div style={styles.pageContainer}>
      {/* 1. Exactly Styled Header Banner */}
      <HeaderBanner />

      {/* 2. Main Body matching The Secret image layout */}
      <main style={styles.mainContent}>
        <div
          className={`parchment-card ${isShaking ? 'animate-shake' : 'animate-fade-in'}`}
          style={styles.cardContainer}
        >
          {/* Hexagonal Gold N&H Seal */}
          <div style={styles.waxSealCenter}>
            <div style={styles.waxSealRing}>
              <img src={nhLogo} alt="NH Seal" style={styles.sealImg} />
            </div>
          </div>

          {/* Golden Roman Heading (Matches "READ THE SECRET STORIES") */}
          <h1 className="secret-heading-gold" style={styles.headingTitle}>
            ENTER THE SECRET CODE
          </h1>

          {/* Introductory Literary Paragraph */}
          <p style={styles.introParagraph}>
            Only those who hold the ancient cipher may unlock the private correspondence
            between <strong>Profile N</strong> and <strong>Profile H</strong>.
            Inscribe the secret passkey below to break the seal and reveal the hidden scrolls...
          </p>

          {/* Prompt Callout (Matches "Looking to continue your own journey?") */}
          <h2 style={styles.journeyPrompt}>
            Ready to continue your secret journey?
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputWrapper}>
              <input
                ref={inputRef}
                type={showCode ? 'text' : 'password'}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Inscribe the secret code..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                className="antique-input"
                style={styles.secretInput}
                id="secret-code-input"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                style={styles.eyeBtn}
                title={showCode ? 'Conceal passkey' : 'Reveal passkey'}
                tabIndex={-1}
              >
                {showCode ? (
                  <EyeOff size={18} color="var(--color-ink-muted)" />
                ) : (
                  <Eye size={18} color="var(--color-ink-muted)" />
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={styles.errorBox} className="animate-fade-in">
                <AlertCircle size={16} color="var(--color-wax-red)" />
                <span>{error}</span>
              </div>
            )}

            {/* The Secret Framed Burgundy Button (Matches "EXPLORE THE SECRET STORE") */}
            <div style={styles.buttonRow}>
              <button
                type="submit"
                id="continue-button"
                className="secret-button-framed"
                style={styles.submitBtn}
              >
                <KeyRound size={16} />
                <span>EXPLORE THE SECRET</span>
              </button>
            </div>
          </form>

          {/* Engraved Divider Line */}
          <div style={styles.dividerLine} />

          {/* Footer Cryptographic Seal */}
          <div style={styles.securitySealFooter}>
            <ShieldCheck size={16} color="var(--color-gold)" />
            <span>End-to-End Encrypted with AES-256-GCM & PBKDF2</span>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  pageContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    background: 'radial-gradient(circle at center, #fdfbf7 0%, #ebe2d3 100%)',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  cardContainer: {
    width: '100%',
    maxWidth: '720px',
    padding: '50px 48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    border: '1px solid #d4c2a7',
    background: 'rgba(255, 252, 246, 0.94)',
  },
  waxSealCenter: {
    marginBottom: '20px',
  },
  waxSealRing: {
    width: '74px',
    height: '74px',
    borderRadius: '12px',
    background: 'radial-gradient(circle, #1a0f05 0%, #000000 100%)',
    border: '2px solid #b38734',
    boxShadow: '0 8px 24px rgba(70, 45, 15, 0.45), inset 0 0 10px rgba(179, 135, 52, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
  },
  sealImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  headingTitle: {
    fontSize: '32px',
    letterSpacing: '0.18em',
    marginBottom: '18px',
    color: '#9c7429',
  },
  introParagraph: {
    fontFamily: 'var(--font-body)',
    fontSize: '20px',
    lineHeight: '1.6',
    color: 'var(--color-ink-secondary)',
    maxWidth: '560px',
    marginBottom: '28px',
  },
  journeyPrompt: {
    fontFamily: 'var(--font-heading)',
    fontSize: '17px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    color: 'var(--color-ink)',
    marginBottom: '24px',
  },
  form: {
    width: '100%',
    maxWidth: '460px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '18px',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  secretInput: {
    width: '100%',
    height: '52px',
    padding: '0 48px 0 18px',
    textAlign: 'center',
    letterSpacing: '0.1em',
    fontSize: '18px',
  },
  eyeBtn: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: 'var(--color-wax-red)',
    fontFamily: 'var(--font-body)',
    fontSize: '17px',
    fontStyle: 'italic',
  },
  buttonRow: {
    marginTop: '6px',
  },
  submitBtn: {
    minWidth: '260px',
  },
  dividerLine: {
    width: '80%',
    height: '1px',
    background: 'linear-gradient(to right, transparent, rgba(179, 135, 52, 0.4), transparent)',
    margin: '36px 0 20px 0',
  },
  securitySealFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '0.08em',
    color: 'var(--color-ink-muted)',
    textTransform: 'uppercase',
  },
};
