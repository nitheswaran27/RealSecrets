import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

export default function ProfileSelector({ onSelectProfile, onLock }) {
  return (
    <div style={styles.overlay}>
      <div className="glass-panel animate-fade-in" style={styles.card}>
        {/* Back / Lock button */}
        <button
          onClick={onLock}
          style={styles.backButton}
          title="Lock session and return to secret code screen"
          id="lock-session-button"
        >
          <ArrowLeft size={16} color="var(--text-secondary)" />
          <span>Lock</span>
        </button>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.shieldIcon}>
            <Shield size={22} color="var(--accent-n)" />
          </div>
          <h1 style={styles.title}>Who are you?</h1>
          <p style={styles.subtitle}>
            Select your private identity. Communication is strictly between N and H.
          </p>
        </div>

        {/* Exactly Two Profile Buttons: N and H */}
        <div style={styles.profilesGrid}>
          {/* Profile N */}
          <button
            onClick={() => onSelectProfile('N')}
            id="profile-btn-n"
            style={styles.profileCardN}
            className="profile-choice-btn"
          >
            <div style={styles.avatarN}>
              <span>N</span>
            </div>
            <div style={styles.profileInfo}>
              <div style={styles.profileNameRow}>
                <span style={styles.profileLetter}>Profile N</span>
                <span style={styles.badgeN}>Active</span>
              </div>
              <span style={styles.profileDescription}>
                Chat as N → Speak with H
              </span>
            </div>
          </button>

          {/* Profile H */}
          <button
            onClick={() => onSelectProfile('H')}
            id="profile-btn-h"
            style={styles.profileCardH}
            className="profile-choice-btn"
          >
            <div style={styles.avatarH}>
              <span>H</span>
            </div>
            <div style={styles.profileInfo}>
              <div style={styles.profileNameRow}>
                <span style={styles.profileLetter}>Profile H</span>
                <span style={styles.badgeH}>Active</span>
              </div>
              <span style={styles.profileDescription}>
                Chat as H → Speak with N
              </span>
            </div>
          </button>
        </div>

        {/* Security Notice */}
        <div style={styles.notice}>
          <p>
            No external registrations or accounts permitted. Only N and H have access.
          </p>
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
  card: {
    width: '100%',
    maxWidth: '460px',
    padding: '36px 30px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  header: {
    marginTop: '16px',
    marginBottom: '28px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  shieldIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'var(--accent-n-bg)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    color: '#ffffff',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    maxWidth: '340px',
    lineHeight: '1.45',
  },
  profilesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    width: '100%',
  },
  profileCardN: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(16, 185, 129, 0.07)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  profileCardH: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(139, 92, 246, 0.07)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  avatarN: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    boxShadow: '0 6px 16px -2px rgba(16, 185, 129, 0.4)',
    flexShrink: 0,
  },
  avatarH: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    boxShadow: '0 6px 16px -2px rgba(139, 92, 246, 0.4)',
    flexShrink: 0,
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  profileNameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileLetter: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#ffffff',
  },
  badgeN: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--accent-n-bg)',
    color: 'var(--accent-n)',
  },
  badgeH: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--accent-h-bg)',
    color: 'var(--accent-h)',
  },
  profileDescription: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  notice: {
    marginTop: '24px',
    paddingTop: '18px',
    borderTop: '1px solid var(--border-subtle)',
    textAlign: 'center',
    fontSize: '12px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
};
