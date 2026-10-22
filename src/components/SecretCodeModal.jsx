import React, { useState, useEffect, useRef } from 'react';
import HeaderBanner from './HeaderBanner.jsx';
import { Eye, EyeOff, AlertCircle, KeyRound, Calendar } from 'lucide-react';

import { parseProfileFromDob } from '../services/identity.js';

export default function SecretCodeModal({ onUnlock, defaultCode = 'bepositive' }) {
  const [code, setCode] = useState('');
  const [dob, setDob] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Disallow uppercase letters and spaces in the secret passkey
  const sanitizePasskey = (val) => val.replace(/[A-Z\s]/g, '');

  const handleCodeChange = (e) => {
    const sanitized = sanitizePasskey(e.target.value);
    setCode(sanitized);
    if (error) setError('');
  };

  const handleCodeKeyDown = (e) => {
    // Reject space
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      return;
    }
    // Reject single uppercase letters (typed with Shift or Caps Lock)
    if (
      e.key &&
      e.key.length === 1 &&
      /[A-Z]/.test(e.key) &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
    }
  };

  const handleCodeBeforeInput = (e) => {
    if (e.data && /[A-Z\s]/.test(e.data)) {
      e.preventDefault();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData('text') || '';
    const cleanPasted = sanitizePasskey(pastedText);
    if (!cleanPasted) return;

    const input = e.target;
    const start = input.selectionStart ?? code.length;
    const end = input.selectionEnd ?? code.length;
    const nextVal = sanitizePasskey(code.slice(0, start) + cleanPasted + code.slice(end));
    setCode(nextVal);
    if (error) setError('');
  };

  const handleDobChange = (e) => {
    const rawVal = e.target.value;
    // Auto-format digits to DD/MM/YYYY
    const digits = rawVal.replace(/\D/g, '').slice(0, 8);
    let formatted = rawVal;
    if (/^\d+$/.test(rawVal.replace(/\//g, ''))) {
      if (digits.length <= 2) {
        formatted = digits;
      } else if (digits.length <= 4) {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
      }
    }
    setDob(formatted);
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.trim();
    const cleanDob = dob.trim();

    if (!cleanCode) {
      setError('Please inscribe the sacred passkey.');
      triggerShake();
      return;
    }

    const validCode = import.meta.env.VITE_SECRET_CODE || defaultCode;
    if (cleanCode !== validCode) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([40, 60, 40]);
      setError('The secret code is incorrect. The seal remains unbroken.');
      triggerShake();
      return;
    }

    if (!cleanDob) {
      setError('Please inscribe your celestial Date of Birth (DD/MM/YYYY).');
      triggerShake();
      return;
    }

    const detectedProfile = parseProfileFromDob(cleanDob);
    if (!detectedProfile) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([40, 60, 40]);
      setError('This date of birth is not recognized by the sacred seal.');
      triggerShake();
      return;
    }

    // Success: unlock with the identified profile
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(25);
    setError('');
    onUnlock(cleanCode, detectedProfile);
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
          {/* <div style={styles.waxSealCenter}>
            <div style={styles.waxSealRing}>
              <img src={nhLogo} alt="NH Seal" style={styles.sealImg} />
            </div>
          </div> */}

          {/* Golden Roman Heading (Matches "READ THE SECRET STORIES") */}
          <h1 className="secret-heading-gold" style={styles.headingTitle}>
            ENTER THE SECRET SPACE
          </h1>

          {/* Introductory Literary Paragraph */}
          <p style={styles.introParagraph}>
            No distance fades a genuine connection, and no silence changes where we began <br />

            This space is kept safe across the years.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Box 1: Secret Code Input */}
            <div style={styles.fieldGroup}>
              <label htmlFor="secret-code-input" style={styles.fieldLabel}>
                our group name
              </label>
              <div style={styles.inputWrapper}>
                <input
                  ref={inputRef}
                  type={showCode ? 'text' : 'password'}
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={handleCodeKeyDown}
                  onBeforeInput={handleCodeBeforeInput}
                  onPaste={handleCodePaste}
                  placeholder="Name given to our first group"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  enterKeyHint="next"
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
            </div>

            {/* Box 2: Harry Potter Theme Date of Birth Input */}
            <div style={styles.fieldGroup}>
              <label htmlFor="dob-input" style={styles.fieldLabel}>
                <Calendar size={13} style={{ marginRight: '6px' }} />
                DATE OF BIRTH (DD/MM/YYYY)
              </label>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  value={dob}
                  onChange={handleDobChange}
                  placeholder="DD/MM/YYYY"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  enterKeyHint="go"
                  className="antique-input"
                  style={styles.dobInput}
                  id="dob-input"
                />
              </div>
              <span style={styles.dobHint}>
                Inscribe your date of birth to verify your sacred identity.
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div style={styles.errorBox} className="animate-fade-in" id="auth-error-message">
                <AlertCircle size={16} color="var(--color-wax-red)" />
                <span>{error}</span>
              </div>
            )}

            {/* The Secret Framed Burgundy Button */}
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
            <span>An open line for whenever you need it.No matter the years or the distance, i'm listening here</span>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  pageContainer: {
    width: '100vw',
    height: '100dvh',
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
    padding: '30px 16px',
  },
  cardContainer: {
    width: '100%',
    maxWidth: '680px',
    padding: '44px 38px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    border: '1px solid #d4c2a7',
    background: 'rgba(255, 252, 246, 0.94)',
  },
  waxSealCenter: {
    marginBottom: '16px',
  },
  waxSealRing: {
    width: '70px',
    height: '70px',
    borderRadius: '12px',
    background: 'radial-gradient(circle, #1a0f05 0%, #000000 100%)',
    border: '2px solid #b38734',
    boxShadow: '0 8px 24px rgba(70, 45, 15, 0.45), inset 0 0 10px rgba(179, 135, 52, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px',
  },
  sealImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  headingTitle: {
    fontSize: '30px',
    letterSpacing: '0.16em',
    marginBottom: '14px',
    color: '#9c7429',
  },
  introParagraph: {
    fontFamily: 'var(--font-body)',
    fontSize: '19px',
    lineHeight: '1.55',
    color: 'var(--color-ink-secondary)',
    maxWidth: '540px',
    marginBottom: '24px',
  },
  form: {
    width: '100%',
    maxWidth: '440px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  fieldGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '6px',
  },
  fieldLabel: {
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    color: 'var(--color-ink-secondary)',
    textTransform: 'uppercase',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  secretInput: {
    width: '100%',
    height: '50px',
    padding: '0 48px 0 16px',
    textAlign: 'center',
    letterSpacing: '0.08em',
    fontSize: '17px',
  },
  dobInput: {
    width: '100%',
    height: '50px',
    padding: '0 16px',
    textAlign: 'center',
    letterSpacing: '0.12em',
    fontSize: '18px',
    fontFamily: 'var(--font-heading)',
    fontWeight: '600',
  },
  dobHint: {
    fontSize: '12px',
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    color: 'var(--color-ink-muted)',
    marginTop: '2px',
    textAlign: 'left',
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
    fontSize: '16px',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonRow: {
    marginTop: '8px',
    width: '100%',
  },
  submitBtn: {
    width: '100%',
  },
  dividerLine: {
    width: '80%',
    height: '1px',
    background: 'linear-gradient(to right, transparent, rgba(179, 135, 52, 0.4), transparent)',
    margin: '30px 0 16px 0',
  },
  securitySealFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '0.08em',
    color: 'var(--color-ink-muted)',
    textTransform: 'uppercase',
  },
};
