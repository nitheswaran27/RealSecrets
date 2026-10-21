import React from 'react';
import HeaderBanner from './HeaderBanner.jsx';
import nhLogo from '../assets/nhlogo.webp';
import { Shield, ArrowLeft } from 'lucide-react';

export default function ProfileSelector({ onSelectProfile, onLock }) {
  return (
    <div style={styles.pageContainer}>
      {/* 1. Exactly Styled Header Banner */}
      <HeaderBanner onLock={onLock} />

      {/* 2. Main Body */}
      <main style={styles.mainContent}>
        <div className="parchment-card animate-fade-in" style={styles.cardContainer}>
          {/* Top Lock Return */}
          <button
            onClick={onLock}
            style={styles.backButton}
            title="Lock Sanctum and Return"
            id="lock-session-button"
          >
            <ArrowLeft size={15} />
            <span>Lock Sanctum</span>
          </button>

          {/* Central Logo */}
          <div style={styles.logoCenter}>
            <div style={styles.sealFrame}>
              <img src={nhLogo} alt="NH Seal" style={styles.sealImg} />
            </div>
          </div>

          {/* Golden Roman Heading (Matches "READ THE SECRET STORIES") */}
          <h1 className="secret-heading-gold" style={styles.headingTitle}>
            WHO ARE YOU?
          </h1>

          {/* Introductory Paragraph */}
          <p style={styles.introParagraph}>
            This inner sanctum is consecrated for two souls alone.
            Select your true identity to unroll the secret parchment and communicate
            in real time across the cipher.
          </p>

          {/* Prompt Callout */}
          <h2 style={styles.journeyPrompt}>
            Looking to continue your own journey?
          </h2>

          {/* The Two Profile Cards: N and H */}
          <div style={styles.profilesGrid}>
            {/* Profile N */}
            <div style={styles.profileBox} className="profile-scroll-box">
              <div style={styles.profileBadgeN}>
                <span>N</span>
              </div>
              <div style={styles.profileTextCol}>
                <span style={styles.profileTitle}>N</span>
                <span style={styles.profileRole}>The First Inscription</span>
                <p style={styles.profileDesc}>
                  Inscribe as <strong>N</strong> to communicate directly with <strong>H</strong>.
                </p>
              </div>
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                  onSelectProfile('N');
                }}
                id="profile-btn-n"
                className="secret-button-framed"
                style={styles.profileBtn}
              >
                ENTER AS N
              </button>
            </div>

            {/* Profile H */}
            <div style={styles.profileBox} className="profile-scroll-box">
              <div style={styles.profileBadgeH}>
                <span>H</span>
              </div>
              <div style={styles.profileTextCol}>
                <span style={styles.profileTitle}>H</span>
                <span style={styles.profileRole}>The Second Inscription</span>
                <p style={styles.profileDesc}>
                  Inscribe as <strong>H</strong> to communicate directly with <strong>N</strong>.
                </p>
              </div>
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                  onSelectProfile('H');
                }}
                id="profile-btn-h"
                className="secret-button-framed"
                style={styles.profileBtn}
              >
                ENTER AS H
              </button>
            </div>
          </div>

          {/* Engraved Divider Line */}
          <div style={styles.dividerLine} />

          {/* Footer Notice */}
          <div style={styles.footerNotice}>
            <Shield size={15} color="var(--color-gold)" />
            <span>No other identities exist within this realm. Communication is strictly between N and H.</span>
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
    padding: '40px 20px',
  },
  cardContainer: {
    width: '100%',
    maxWidth: '820px',
    padding: '50px 48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    border: '1px solid #d4c2a7',
    background: 'rgba(255, 252, 246, 0.94)',
  },
  backButton: {
    position: 'absolute',
    top: '24px',
    left: '24px',
    background: 'rgba(139, 30, 45, 0.08)',
    border: '1px solid var(--color-wax-red)',
    borderRadius: '2px',
    padding: '6px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    color: 'var(--color-wax-red)',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  logoCenter: {
    marginBottom: '16px',
    marginTop: '10px',
  },
  sealFrame: {
    width: '68px',
    height: '68px',
    borderRadius: '10px',
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
    fontSize: '32px',
    letterSpacing: '0.18em',
    marginBottom: '16px',
    color: '#9c7429',
  },
  introParagraph: {
    fontFamily: 'var(--font-body)',
    fontSize: '20px',
    lineHeight: '1.6',
    color: 'var(--color-ink-secondary)',
    maxWidth: '620px',
    marginBottom: '24px',
  },
  journeyPrompt: {
    fontFamily: 'var(--font-heading)',
    fontSize: '17px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    color: 'var(--color-ink)',
    marginBottom: '28px',
  },
  profilesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    width: '100%',
  },
  profileBox: {
    background: 'rgba(255, 255, 255, 0.75)',
    border: '1px solid rgba(179, 135, 52, 0.35)',
    borderRadius: '3px',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 4px 14px rgba(60, 40, 15, 0.08)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  profileBadgeN: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #dfb86c 0%, #b38734 70%, #7a5416 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-title)',
    fontSize: '24px',
    fontWeight: '700',
    boxShadow: '0 4px 12px rgba(179, 135, 52, 0.4)',
    border: '2px solid #ffffff',
  },
  profileBadgeH: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #b83344 0%, #8b1e2d 70%, #520e18 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-title)',
    fontSize: '24px',
    fontWeight: '700',
    boxShadow: '0 4px 12px rgba(139, 30, 45, 0.4)',
    border: '2px solid #ffffff',
  },
  profileTextCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  profileTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    color: 'var(--color-ink)',
    textTransform: 'uppercase',
  },
  profileRole: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontStyle: 'italic',
    color: 'var(--color-gold-dark)',
  },
  profileDesc: {
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    color: 'var(--color-ink-secondary)',
    marginTop: '6px',
  },
  profileBtn: {
    width: '100%',
    marginTop: '8px',
    fontSize: '12px',
    padding: '10px 20px',
  },
  dividerLine: {
    width: '80%',
    height: '1px',
    background: 'linear-gradient(to right, transparent, rgba(179, 135, 52, 0.4), transparent)',
    margin: '36px 0 20px 0',
  },
  footerNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    color: 'var(--color-ink-muted)',
  },
};
