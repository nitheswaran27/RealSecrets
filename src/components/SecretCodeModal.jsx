import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

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
      setError('Please enter the secret code.');
      triggerShake();
      return;
    }

    // Verify secret code (matches configured code or default 'bepositive')
    const validCode = import.meta.env.VITE_SECRET_CODE || defaultCode;
    if (cleanCode === validCode) {
      setError('');
      onUnlock(cleanCode);
    } else {
      setError('Incorrect secret code. Access denied.');
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
    <div style={styles.overlay}>
      <div
        className={`glass-panel ${isShaking ? 'animate-shake' : 'animate-fade-in'}`}
        style={styles.modal}
      >
        {/* Glowing Shield Icon */}
        <div style={styles.iconWrapper}>
          <div style={styles.iconGlow} />
          <div style={styles.iconCircle}>
            <Lock size={28} color="#8b5cf6" strokeWidth={2.2} />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 style={styles.title}>Realsecrets</h1>
        <p style={styles.subtitle}>Enter the secret code</p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputContainer}>
            <input
              ref={inputRef}
              type={showCode ? 'text' : 'password'}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError('');
              }}
              placeholder="••••••••••••"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              style={styles.input}
              id="secret-code-input"
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              style={styles.eyeButton}
              title={showCode ? 'Hide secret' : 'Show secret'}
              tabIndex={-1}
            >
              {showCode ? (
                <EyeOff size={18} color="var(--text-secondary)" />
              ) : (
                <Eye size={18} color="var(--text-secondary)" />
              )}
            </button>
          </div>

          {/* Friendly Error Message */}
          {error && (
            <div style={styles.errorBox} className="animate-fade-in">
              <AlertCircle size={16} color="var(--accent-danger)" />
              <span>{error}</span>
            </div>
          )}

          {/* Continue Button */}
          <button
            type="submit"
            id="continue-button"
            style={styles.continueButton}
          >
            <span>Continue</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Subtle Security Badge */}
        <div style={styles.footerNote}>
          <ShieldCheck size={14} color="var(--accent-n)" />
          <span>Client-Side End-to-End Encrypted (AES-256-GCM)</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: '18px',
  },
  iconGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, transparent 70%)',
    filter: 'blur(10px)',
  },
  iconCircle: {
    position: 'relative',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'rgba(26, 29, 44, 0.95)',
    border: '1px solid rgba(139, 92, 246, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px -4px rgba(139, 92, 246, 0.25)',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    marginBottom: '6px',
    background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    marginBottom: '28px',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: '50px',
    padding: '0 48px 0 18px',
    borderRadius: 'var(--radius-md)',
    fontSize: '16px',
    letterSpacing: '0.04em',
  },
  eyeButton: {
    position: 'absolute',
    right: '14px',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'var(--accent-danger-bg)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: '500',
  },
  continueButton: {
    height: '50px',
    width: '100%',
    borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 8px 20px -4px rgba(109, 40, 217, 0.5)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  footerNote: {
    marginTop: '28px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    letterSpacing: '0.02em',
  },
};
