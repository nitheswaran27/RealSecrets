import React, { useState, useEffect, useRef } from 'react';
import HeaderBanner from './HeaderBanner.jsx';
import nhLogo from '../assets/nhlogo.webp';
import {
  Lock,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCheck,
  Feather,
} from 'lucide-react';
import { encryptMessage, decryptMessage } from '../services/crypto.js';
import {
  fetchMessages,
  sendEncryptedMessage,
  subscribeToMessages,
} from '../services/chatService.js';
import { isSupabaseConfigured } from '../services/supabaseClient.js';

function formatMessageTime(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatMessageDate(isoString) {
  try {
    const date = new Date(isoString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ChatInterface({
  currentProfile,
  secretCode,
  onSwitchProfile,
  onLock,
}) {
  const partnerProfile = currentProfile === 'N' ? 'H' : 'N';
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const decryptedCacheRef = useRef(new Map());

  // Helper to decrypt a single message object
  const decryptSingleMessage = React.useCallback(
    async (msg) => {
      if (decryptedCacheRef.current.has(msg.id)) {
        return {
          ...msg,
          decryptedText: decryptedCacheRef.current.get(msg.id),
          decryptionError: false,
        };
      }

      try {
        const plaintext = await decryptMessage(msg.ciphertext, msg.nonce, secretCode);
        decryptedCacheRef.current.set(msg.id, plaintext);
        return {
          ...msg,
          decryptedText: plaintext,
          decryptionError: false,
        };
      } catch (err) {
        console.warn(`Failed to decrypt message ${msg.id}:`, err);
        return {
          ...msg,
          decryptedText: '[Encrypted Scroll — Decryption Failed]',
          decryptionError: true,
        };
      }
    },
    [secretCode]
  );

  const loadMessages = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const rawMessages = await fetchMessages();
      const decryptedList = await Promise.all(
        rawMessages.map((msg) => decryptSingleMessage(msg))
      );
      setMessages(decryptedList);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setErrorMessage(err.message || 'Failed to unroll conversation scrolls.');
    } finally {
      setIsLoading(false);
    }
  }, [decryptSingleMessage]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const rawMessages = await fetchMessages();
        const decryptedList = await Promise.all(
          rawMessages.map((msg) => decryptSingleMessage(msg))
        );
        if (isMounted) {
          setMessages(decryptedList);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to unroll conversation history.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    // Subscribe to real-time events
    const unsubscribe = subscribeToMessages(
      async (newMsg) => {
        const decrypted = await decryptSingleMessage(newMsg);
        if (isMounted) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, decrypted];
          });
        }
      },
      (status) => {
        if (isMounted) {
          setConnectionStatus(status);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [secretCode, decryptSingleMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentProfile]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    setErrorMessage('');

    try {
      const { ciphertext, nonce } = await encryptMessage(textToSend, secretCode);

      const inserted = await sendEncryptedMessage({
        sender: currentProfile,
        ciphertext,
        nonce,
      });

      decryptedCacheRef.current.set(inserted.id, textToSend);

      const localDecrypted = {
        ...inserted,
        decryptedText: textToSend,
        decryptionError: false,
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === inserted.id)) return prev;
        return [...prev, localDecrypted];
      });

      setInputText('');
    } catch (err) {
      console.error('Send message failed:', err);
      setErrorMessage(`Failed to seal and send message: ${err.message}`);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={styles.container}>
      {/* 1. Exactly Styled Header Banner with nhlogo & navigation */}
      <HeaderBanner
        currentProfile={currentProfile}
        partnerProfile={partnerProfile}
        onLock={onLock}
        onSwitchProfile={onSwitchProfile}
        onOpenSecurity={() => setShowSecurityModal(true)}
        connectionStatus={connectionStatus}
      />

      {/* 2. Main Scroll Room (Chat Messages Area) */}
      <main style={styles.chatArea} id="chat-messages-container">
        {/* Supabase status warning if in mock mode */}
        {!isSupabaseConfigured() && (
          <div style={styles.devNotice}>
            <Info size={16} color="var(--color-gold)" />
            <span>
              Sanctum operating in local multi-tab sync mode. Inscribe Supabase credentials in{' '}
              <code>.env</code> for cloud persistence.
            </span>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div style={styles.errorNotice} className="animate-fade-in">
            <AlertTriangle size={16} color="var(--color-wax-red)" />
            <span>{errorMessage}</span>
            <button onClick={loadMessages} style={styles.retryBtn}>
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div style={styles.loadingWrapper}>
            <div style={styles.spinner} />
            <span style={styles.loadingText}>Unrolling and deciphering ancient scrolls...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div style={styles.emptyContainer} className="animate-fade-in">
            <div style={styles.emptySeal}>
              <img src={nhLogo} alt="NH Seal" style={styles.emptyLogo} />
            </div>
            <h2 className="secret-heading-gold" style={styles.emptyTitle}>
              THE SECRET CONVERSATION
            </h2>
            <p style={styles.emptyDesc}>
              No correspondence has yet been inscribed between <strong>Profile N</strong> and{' '}
              <strong>Profile H</strong>. Inscribe the first ciphered scroll below to commence your journey...
            </p>
          </div>
        )}

        {/* Messages List */}
        {!isLoading &&
          messages.map((msg, index) => {
            const isMe = msg.sender === currentProfile;
            const isSenderN = msg.sender === 'N';
            const showDate =
              index === 0 ||
              formatMessageDate(msg.created_at) !==
                formatMessageDate(messages[index - 1]?.created_at);

            return (
              <React.Fragment key={msg.id || index}>
                {showDate && (
                  <div style={styles.dateDivider}>
                    <span style={styles.dateText}>
                      — {formatMessageDate(msg.created_at)} —
                    </span>
                  </div>
                )}

                <div
                  style={{
                    ...styles.messageRow,
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                  }}
                  className="animate-fade-in"
                  data-sender={msg.sender}
                >
                  {/* Partner Seal Avatar */}
                  {!isMe && (
                    <div
                      style={{
                        ...styles.sealAvatar,
                        background: isSenderN
                          ? 'radial-gradient(circle, #dfb86c 0%, #b38734 70%, #7a5416 100%)'
                          : 'radial-gradient(circle, #b83344 0%, #8b1e2d 70%, #520e18 100%)',
                      }}
                    >
                      <span>{msg.sender}</span>
                    </div>
                  )}

                  {/* Scroll Bubble */}
                  <div
                    style={{
                      ...styles.bubbleWrapper,
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {/* Scribe Label */}
                    <div style={styles.senderHeader}>
                      <span
                        style={{
                          ...styles.senderName,
                          color: isSenderN ? '#8b6b23' : '#8b1e2d',
                        }}
                      >
                        {isMe ? `You (Profile ${msg.sender})` : `Profile ${msg.sender}`}
                      </span>
                    </div>

                    {/* Parchment Message Body */}
                    <div
                      style={{
                        ...styles.messageScroll,
                        ...(isMe
                          ? isSenderN
                            ? styles.myScrollN
                            : styles.myScrollH
                          : styles.theirScroll),
                        ...(msg.decryptionError ? styles.corruptedScroll : {}),
                      }}
                    >
                      <p style={styles.scrollText}>{msg.decryptedText}</p>
                    </div>

                    {/* Meta info: Time and Cryptographic Seal */}
                    <div style={styles.metaRow}>
                      <span style={styles.timeLabel}>
                        {formatMessageTime(msg.created_at)}
                      </span>
                      <span
                        style={styles.sealIcon}
                        title="End-to-End Encrypted with AES-256-GCM"
                      >
                        <Lock size={11} color="var(--color-gold-dark)" />
                      </span>
                      {isMe && (
                        <CheckCheck size={13} color="var(--color-wax-red)" />
                      )}
                    </div>
                  </div>

                  {/* My Seal Avatar */}
                  {isMe && (
                    <div
                      style={{
                        ...styles.sealAvatar,
                        background: isSenderN
                          ? 'radial-gradient(circle, #dfb86c 0%, #b38734 70%, #7a5416 100%)'
                          : 'radial-gradient(circle, #b83344 0%, #8b1e2d 70%, #520e18 100%)',
                      }}
                    >
                      <span>{msg.sender}</span>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        <div ref={messagesEndRef} />
      </main>

      {/* 3. Ancient Scribe Desk (Footer Composer) */}
      <footer style={styles.footerDesk}>
        <form onSubmit={handleSendMessage} style={styles.composerForm}>
          <div style={styles.textareaWrapper}>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Inscribe secret message as Profile ${currentProfile}... (Enter ↵ to dispatch)`}
              rows={1}
              className="antique-input"
              style={styles.composerInput}
              id="message-input"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="secret-button-framed"
            style={styles.dispatchBtn}
            id="send-message-button"
            title="Seal and Dispatch Scroll"
          >
            {isSending ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <>
                <Feather size={16} />
                <span>DISPATCH</span>
              </>
            )}
          </button>
        </form>

        <div style={styles.deskFooter}>
          <div style={styles.e2eNotice}>
            <ShieldCheck size={14} color="var(--color-gold)" />
            <span>Client-side AES-256-GCM cipher active • Plaintext is never stored</span>
          </div>
          <span style={styles.shortcutTip}>Press Enter ↵ to Dispatch Scroll</span>
        </div>
      </footer>

      {/* 4. Security & Cryptographic Details Modal */}
      {showSecurityModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSecurityModal(false)}>
          <div
            className="parchment-card animate-fade-in"
            style={styles.securityModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.secHeader}>
              <div style={styles.secSealIcon}>
                <img src={nhLogo} alt="NH Seal" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h3 className="secret-heading-gold" style={{ fontSize: '20px' }}>
                THE SACRED CRYPTOGRAPHY
              </h3>
            </div>

            <div style={styles.secBody}>
              <div style={styles.secBox}>
                <strong style={styles.secTitle}>End-to-End Encryption (AES-256-GCM)</strong>
                <p>
                  Every message is encrypted directly inside the browser using AES-256-GCM
                  with a unique 96-bit cryptographic nonce and PBKDF2 (100,000 iterations).
                  The Supabase database receives strictly ciphertext and nonces.
                </p>
              </div>

              <div style={styles.secBox}>
                <strong style={styles.secTitle}>PostgreSQL Row Level Security</strong>
                <p>
                  Database policies validate that only senders strictly identified as <code>N</code> or{' '}
                  <code>H</code> are accepted. No third party accounts exist.
                </p>
              </div>

              <div style={styles.secBox}>
                <strong style={styles.secTitle}>Operational Privacy</strong>
                <p>
                  The encryption key exists only in volatile memory and is purged whenever the sanctum is locked.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSecurityModal(false)}
              className="secret-button-framed"
              style={{ width: '100%' }}
            >
              SEAL ARCHIVE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'radial-gradient(circle at center, #fdfbf7 0%, #ebe2d3 100%)',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '920px',
    width: '100%',
    margin: '0 auto',
  },
  devNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    background: 'rgba(212, 167, 85, 0.15)',
    border: '1px solid rgba(179, 135, 52, 0.4)',
    borderRadius: '2px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-ink)',
  },
  errorNotice: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'rgba(139, 30, 45, 0.12)',
    border: '1px solid var(--color-wax-red)',
    borderRadius: '2px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-wax-red)',
  },
  retryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'var(--color-wax-red)',
    color: '#ffffff',
    border: 'none',
    padding: '4px 8px',
    fontSize: '12px',
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '60px 0',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(179, 135, 52, 0.25)',
    borderTopColor: 'var(--color-gold)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: 'var(--font-body)',
    fontSize: '17px',
    fontStyle: 'italic',
    color: 'var(--color-ink-muted)',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '60px 20px',
    maxWidth: '520px',
    margin: 'auto',
  },
  emptySeal: {
    width: '76px',
    height: '76px',
    borderRadius: '12px',
    background: 'radial-gradient(circle, #1a0f05 0%, #000000 100%)',
    border: '2px solid #b38734',
    boxShadow: '0 8px 24px rgba(70, 45, 15, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    marginBottom: '18px',
  },
  emptyLogo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  emptyTitle: {
    fontSize: '24px',
    marginBottom: '10px',
    letterSpacing: '0.14em',
  },
  emptyDesc: {
    fontFamily: 'var(--font-body)',
    fontSize: '18px',
    lineHeight: '1.6',
    color: 'var(--color-ink-secondary)',
  },
  dateDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '12px 0',
  },
  dateText: {
    fontFamily: 'var(--font-heading)',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    color: 'var(--color-ink-muted)',
    textTransform: 'uppercase',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    width: '100%',
  },
  sealAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-title)',
    fontSize: '16px',
    fontWeight: '700',
    border: '1.5px solid #ffffff',
    boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
    flexShrink: 0,
    marginBottom: '4px',
  },
  bubbleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '75%',
  },
  senderHeader: {
    marginBottom: '3px',
    padding: '0 4px',
  },
  senderName: {
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  messageScroll: {
    padding: '12px 18px',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(45, 30, 15, 0.08)',
    border: '1px solid #d4c2a7',
    background: '#ffffff',
  },
  myScrollN: {
    background: 'linear-gradient(135deg, #fffcf5 0%, #f7efe1 100%)',
    borderLeft: '4px solid #b38734',
  },
  myScrollH: {
    background: 'linear-gradient(135deg, #fff8f8 0%, #fceed0 100%)',
    borderLeft: '4px solid #8b1e2d',
  },
  theirScroll: {
    background: 'linear-gradient(135deg, #faf7f2 0%, #f3ebe0 100%)',
    borderLeft: '4px solid #5a3818',
  },
  corruptedScroll: {
    background: 'rgba(139, 30, 45, 0.1)',
    border: '1px solid var(--color-wax-red)',
    color: 'var(--color-wax-red)',
  },
  scrollText: {
    fontFamily: 'var(--font-body)',
    fontSize: '17px',
    lineHeight: '1.55',
    color: 'var(--color-ink)',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
    padding: '0 4px',
  },
  timeLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    fontStyle: 'italic',
    color: 'var(--color-ink-muted)',
  },
  sealIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  footerDesk: {
    padding: '16px 20px',
    background: 'rgba(253, 250, 244, 0.95)',
    borderTop: '2px solid rgba(179, 135, 52, 0.35)',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '920px',
    width: '100%',
    margin: '0 auto',
  },
  composerForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  textareaWrapper: {
    flex: 1,
  },
  composerInput: {
    width: '100%',
    height: '48px',
    padding: '12px 16px',
    fontSize: '17px',
    resize: 'none',
  },
  dispatchBtn: {
    height: '48px',
    flexShrink: 0,
    fontSize: '12px',
    padding: '0 22px',
  },
  deskFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
  },
  e2eNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontStyle: 'italic',
    color: 'var(--color-ink-muted)',
  },
  shortcutTip: {
    fontFamily: 'var(--font-heading)',
    fontSize: '11px',
    letterSpacing: '0.08em',
    color: 'var(--color-ink-muted)',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(20, 10, 5, 0.65)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 2000,
  },
  securityModal: {
    width: '100%',
    maxWidth: '520px',
    padding: '36px 32px',
    border: '1px solid #b38734',
  },
  secHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
  },
  secSealIcon: {
    width: '46px',
    height: '46px',
    borderRadius: '8px',
    background: '#000',
    border: '1.5px solid #b38734',
    padding: '4px',
  },
  secBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginBottom: '24px',
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    lineHeight: '1.5',
    color: 'var(--color-ink-secondary)',
  },
  secBox: {
    background: 'rgba(255, 255, 255, 0.6)',
    padding: '12px 16px',
    border: '1px solid #d4c2a7',
    borderRadius: '2px',
  },
  secTitle: {
    display: 'block',
    fontFamily: 'var(--font-heading)',
    fontSize: '13px',
    letterSpacing: '0.08em',
    color: 'var(--color-ink)',
    marginBottom: '4px',
    textTransform: 'uppercase',
  },
};
