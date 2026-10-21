import React from 'react';
import nhLogo from '../assets/nhlogo.webp';
import { Lock, Shield, Search, Users } from 'lucide-react';

export default function HeaderBanner({
  currentProfile,
  partnerProfile,
  onLock,
  onSwitchProfile,
  onOpenSecurity,
  connectionStatus,
}) {
  return (
    <header style={styles.headerContainer}>
      {/* 1. Top Navy Announcement Ribbon (Exact match to image) */}
      <div className="navy-top-bar">
        <span>+ANCIENT END-TO-END CIPHER+ strictly between N & H</span>
        <span style={styles.topDot}>•</span>
        <span className="highlight" onClick={onOpenSecurity} role="button" tabIndex={0}>
          AES-256-GCM Cryptographic Seal Active
        </span>
      </div>

      {/* 2. Main Parchment Banner with nhlogo & Navigation */}
      <div className="parchment-header-banner">
        {/* Left: nhlogo (Website Logo) */}
        <div style={styles.logoSection}>
          <div style={styles.logoFrame} title="Realsecrets — N & H Sacred Cipher">
            <img
              src={nhLogo}
              alt="Realsecrets N & H Logo"
              style={styles.logoImg}
              id="website-logo"
            />
          </div>
          <div style={styles.logoTitles}>
            <span style={styles.logoMainTitle}>Realsecrets</span>
            <span style={styles.logoSubtitle}>The Secret Correspondence</span>
          </div>
        </div>

        {/* Center: Navigation Links in The Secret style */}
        <nav style={styles.navMenu}>
          <span style={styles.navItem} onClick={onOpenSecurity}>EXPLORE</span>
          <span style={styles.navItem} onClick={onOpenSecurity}>THE CIPHER</span>
          <span style={styles.navItem}>SANCTUM</span>
          <span style={styles.navItem}>SCROLLS</span>
          {currentProfile && (
            <span
              style={{ ...styles.navItem, color: '#8b1e2d', fontWeight: 700 }}
              onClick={onSwitchProfile}
              id="nav-switch-profile"
            >
              PROFILE {currentProfile} ⇄ {partnerProfile}
            </span>
          )}
        </nav>

        {/* Right: Actions & Identity */}
        <div style={styles.rightActions}>
          {/* Connection Status Seal */}
          {connectionStatus && (
            <div style={styles.statusPill} title={`Connection: ${connectionStatus}`}>
              <span
                style={{
                  ...styles.statusDot,
                  backgroundColor:
                    connectionStatus === 'CONNECTED' ||
                    connectionStatus === 'MOCK_REALTIME'
                      ? '#22c55e'
                      : '#eab308',
                }}
              />
              <span style={styles.statusText}>
                {connectionStatus === 'CONNECTED'
                  ? 'Cloud Synced'
                  : connectionStatus === 'MOCK_REALTIME'
                  ? 'Local Synced'
                  : 'Syncing...'}
              </span>
            </div>
          )}

          {/* Switch Profile if inside chat */}
          {currentProfile && onSwitchProfile && (
            <button
              onClick={onSwitchProfile}
              style={styles.headerIconButton}
              title="Switch identity between N and H"
              id="switch-profile-button"
            >
              <Users size={16} color="#4a2e12" />
            </button>
          )}

          {/* Security details button */}
          {onOpenSecurity && (
            <button
              onClick={onOpenSecurity}
              style={styles.headerIconButton}
              title="Cryptographic Security Details"
              id="security-info-button"
            >
              <Shield size={16} color="#8b1e2d" />
            </button>
          )}

          {/* Lock / Exit button */}
          {onLock && (
            <button
              onClick={onLock}
              style={styles.headerLockBtn}
              title="Lock sanctum and return to secret code"
              id="header-lock-button"
            >
              <Lock size={14} />
              <span>Lock Seal</span>
            </button>
          )}

          {!currentProfile && !onLock && (
            <div style={styles.searchIconFrame}>
              <Search size={16} color="#5a3818" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  headerContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
    zIndex: 100,
  },
  topDot: {
    opacity: 0.5,
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoFrame: {
    width: '52px',
    height: '52px',
    borderRadius: '8px',
    background: 'radial-gradient(circle, rgba(0,0,0,0.85) 0%, rgba(20,10,5,0.95) 100%)',
    border: '2px solid #b38734',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 0 8px rgba(179, 135, 52, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  logoTitles: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoMainTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '0.12em',
    textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(179, 135, 52, 0.6)',
  },
  logoSubtitle: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    fontStyle: 'italic',
    color: '#dfb86c',
    letterSpacing: '0.04em',
  },
  navMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  navItem: {
    fontFamily: 'var(--font-heading)',
    fontSize: '12.5px',
    fontWeight: '700',
    letterSpacing: '0.14em',
    color: '#2d1808',
    textShadow: '0 1px 1px rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    transition: 'color 0.2s ease, transform 0.15s ease',
  },
  rightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.45)',
    border: '1px solid rgba(139, 110, 75, 0.4)',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontFamily: 'var(--font-heading)',
    color: '#3a200a',
    letterSpacing: '0.08em',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  statusText: {
    fontWeight: '600',
  },
  headerIconButton: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    background: 'rgba(255, 255, 255, 0.5)',
    border: '1px solid rgba(139, 110, 75, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  headerLockBtn: {
    height: '32px',
    padding: '0 12px',
    borderRadius: '3px',
    border: '1.5px solid #8b1e2d',
    background: 'rgba(139, 30, 45, 0.1)',
    color: '#8b1e2d',
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  searchIconFrame: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
