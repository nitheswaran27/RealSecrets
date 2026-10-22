import React from 'react';
import nhLogo from '../assets/nhlogo.webp';

export default function HeaderBanner() {
  return (
    <header style={styles.headerContainer}>
      {/* 1. Top Navy Announcement Ribbon (Exact match to image) */}
      <div className="navy-top-bar">
        <span>+UNTOUCHED BY TIME OR DISTANCE+</span>
      </div>

      {/* 2. Main Parchment Banner with nhlogo & Navigation */}
      <div className="parchment-header-banner">
        {/* Left: nhlogo (Website Logo) */}
        <div style={styles.logoSection}>
          {/* <div style={styles.logoFrame} title="Realsecrets — N & H Sacred Cipher">
            <img
              src={nhLogo}
              alt="Realsecrets N & H Logo"
              style={styles.logoImg}
              id="website-logo"
            />
          </div> */}
          <div style={styles.logoTitles}>
            <span style={styles.logoMainTitle}>Real secrets</span>
            <span style={styles.logoSubtitle}>The Secret Correspondence</span>
          </div>
        </div>

        {/* Center: Navigation Links in The Secret style */}
        <nav style={styles.navMenu}>
          <span className="desktop-only-nav" style={styles.navItem}>EXPLORE</span>
          <span className="desktop-only-nav" style={styles.navItem}>THE CIPHER</span>
          <span className="desktop-only-nav" style={styles.navItem}>SANCTUM</span>
          <span className="desktop-only-nav" style={styles.navItem}>SCROLLS</span>
        </nav>

        {/* Right: Clean Decorative Search Frame (Matches reference image) */}
        {/* <div style={styles.rightActions}>
          <div style={styles.searchIconFrame}>
            <Search size={16} color="#5a3818" />
          </div>
        </div> */}
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
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoFrame: {
    width: '50px',
    height: '50px',
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
    transition: 'color 0.2s ease, transform 0.15s ease',
  },
  rightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
