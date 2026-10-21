import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Lock,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Users,
  AlertTriangle,
  Info,
  CheckCheck,
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
          decryptedText: '[Encrypted message - Decryption failed]',
          decryptionError: true,
        };
      }
    },
    [secretCode]
  );

  // Initial load of messages
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
      setErrorMessage(err.message || 'Failed to load conversation history.');
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
          setErrorMessage(err.message || 'Failed to load conversation history.');
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

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
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
      // Step 1: Encrypt plaintext in the browser before sending
      const { ciphertext, nonce } = await encryptMessage(textToSend, secretCode);

      // Step 2: Persist encrypted payload via chatService (Supabase or Local fallback)
      const inserted = await sendEncryptedMessage({
        sender: currentProfile,
        ciphertext,
        nonce,
      });

      // Cache the plaintext immediately
      decryptedCacheRef.current.set(inserted.id, textToSend);

      const localDecrypted = {
        ...inserted,
        decryptedText: textToSend,
        decryptionError: false,
      };

      // Optimistically update if not already received from subscription
      setMessages((prev) => {
        if (prev.some((m) => m.id === inserted.id)) return prev;
        return [...prev, localDecrypted];
      });

      setInputText('');
    } catch (err) {
      console.error('Send message failed:', err);
      setErrorMessage(`Failed to send message: ${err.message}`);
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
      {/* Top Navigation Bar */}
      <header style={styles.header}>
        {/* Brand & Identities */}
        <div style={styles.headerLeft}>
          <div style={styles.logoBadge}>
            <Lock size={16} color="var(--accent-h)" />
            <span style={styles.logoText}>Realsecrets</span>
          </div>

          <div style={styles.conversationInfo}>
            <div style={styles.identityPill}>
              <span style={styles.identityLabel}>You:</span>
              <span
                style={{
                  ...styles.identityTag,
                  background:
                    currentProfile === 'N'
                      ? 'var(--accent-n-bg)'
                      : 'var(--accent-h-bg)',
                  color:
                    currentProfile === 'N'
                      ? 'var(--accent-n)'
                      : 'var(--accent-h)',
                }}
                id="current-profile-tag"
              >
                Profile {currentProfile}
              </span>
            </div>

            <span style={styles.speakingArrow}>⇄</span>

            <div style={styles.identityPill}>
              <span style={styles.identityLabel}>Partner:</span>
              <span
                style={{
                  ...styles.identityTag,
                  background:
                    partnerProfile === 'N'
                      ? 'var(--accent-n-bg)'
                      : 'var(--accent-h-bg)',
                  color:
                    partnerProfile === 'N'
                      ? 'var(--accent-n)'
                      : 'var(--accent-h)',
                }}
              >
                Profile {partnerProfile}
              </span>
            </div>
          </div>
        </div>

        {/* Status & Action Controls */}
        <div style={styles.headerRight}>
          {/* Realtime / Network Status */}
          <div
            style={styles.statusIndicator}
            title={
              isSupabaseConfigured()
                ? `Supabase Realtime: ${connectionStatus}`
                : 'Local Cross-Tab Sync (Dev Mode)'
            }
            id="connection-status-indicator"
          >
            <span
              style={{
                ...styles.statusDot,
                backgroundColor:
                  connectionStatus === 'CONNECTED' ||
                  connectionStatus === 'MOCK_REALTIME'
                    ? '#10b981'
                    : connectionStatus === 'CONNECTING'
                    ? '#f59e0b'
                    : '#ef4444',
              }}
            />
            <span style={styles.statusText}>
              {connectionStatus === 'CONNECTED'
                ? 'Supabase Live'
                : connectionStatus === 'MOCK_REALTIME'
                ? 'Multi-Tab Live'
                : connectionStatus === 'CONNECTING'
                ? 'Connecting...'
                : 'Reconnecting'}
            </span>
          </div>

          {/* Security Info Trigger */}
          <button
            onClick={() => setShowSecurityModal(true)}
            style={styles.iconButton}
            title="Encryption & Security Details"
            id="security-info-button"
          >
            <ShieldCheck size={18} color="var(--accent-n)" />
          </button>

          {/* Switch Profile Button */}
          <button
            onClick={onSwitchProfile}
            style={styles.iconButton}
            title="Switch between N and H"
            id="switch-profile-button"
          >
            <Users size={18} color="var(--text-secondary)" />
          </button>

          {/* Lock Screen Button */}
          <button
            onClick={onLock}
            style={styles.lockButton}
            title="Lock chat session"
            id="chat-lock-button"
          >
            <LogOut size={16} />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <main style={styles.chatArea} id="chat-messages-container">
        {/* Banner if Supabase is not configured yet */}
        {!isSupabaseConfigured() && (
          <div style={styles.devBanner}>
            <Info size={16} color="var(--accent-gold)" />
            <span>
              Running in zero-config local sync mode. Connect Supabase via{' '}
              <code>.env</code> for persistent cloud sync.
            </span>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div style={styles.errorBanner} className="animate-fade-in">
            <AlertTriangle size={16} color="var(--accent-danger)" />
            <span>{errorMessage}</span>
            <button onClick={loadMessages} style={styles.retryButton}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div style={styles.loadingWrapper}>
            <div style={styles.spinner} />
            <span>Decrypting secret messages...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconCircle}>
              <Lock size={32} color="var(--accent-h)" />
            </div>
            <h3 style={styles.emptyTitle}>End-to-End Encrypted Chat</h3>
            <p style={styles.emptySubtitle}>
              Messages between <strong>Profile N</strong> and{' '}
              <strong>Profile H</strong> are encrypted with AES-256-GCM before
              being stored.
            </p>
            <div style={styles.emptyHint}>
              Type a message below to start the private conversation.
            </div>
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
                    <span>{formatMessageDate(msg.created_at)}</span>
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
                  {/* Partner Avatar for incoming messages */}
                  {!isMe && (
                    <div
                      style={{
                        ...styles.messageAvatar,
                        background: isSenderN
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                      }}
                    >
                      {msg.sender}
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    style={{
                      ...styles.bubbleWrapper,
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {/* Sender Label */}
                    <div style={styles.senderLabel}>
                      <span
                        style={{
                          fontWeight: '600',
                          color: isSenderN
                            ? 'var(--accent-n)'
                            : 'var(--accent-h)',
                        }}
                      >
                        {isMe ? `You (${msg.sender})` : `Profile ${msg.sender}`}
                      </span>
                    </div>

                    {/* Bubble */}
                    <div
                      style={{
                        ...styles.bubble,
                        ...(isMe
                          ? isSenderN
                            ? styles.myBubbleN
                            : styles.myBubbleH
                          : styles.theirBubble),
                        ...(msg.decryptionError ? styles.corruptedBubble : {}),
                      }}
                    >
                      <p style={styles.messageText}>{msg.decryptedText}</p>
                    </div>

                    {/* Meta info: Timestamp and Encryption Lock */}
                    <div style={styles.messageMeta}>
                      <span style={styles.timestamp}>
                        {formatMessageTime(msg.created_at)}
                      </span>
                      <span
                        style={styles.encryptedTag}
                        title="End-to-end encrypted with AES-256-GCM"
                      >
                        <Lock size={11} color="var(--text-muted)" />
                      </span>
                      {isMe && (
                        <CheckCheck size={13} color="var(--accent-n)" />
                      )}
                    </div>
                  </div>

                  {/* My Avatar for outgoing messages */}
                  {isMe && (
                    <div
                      style={{
                        ...styles.messageAvatar,
                        background: isSenderN
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                      }}
                    >
                      {msg.sender}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Composer */}
      <footer style={styles.footer}>
        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <div style={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Send encrypted message as Profile ${currentProfile}... (Enter to send)`}
              rows={1}
              style={styles.textarea}
              id="message-input"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            style={{
              ...styles.sendButton,
              background:
                currentProfile === 'N'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            }}
            id="send-message-button"
            title="Send Encrypted Message"
          >
            {isSending ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>

        <div style={styles.inputFooter}>
          <div style={styles.e2eStatus}>
            <ShieldCheck size={13} color="var(--accent-n)" />
            <span>Messages are encrypted client-side before leaving your device</span>
          </div>
          <span style={styles.keyHint}>Press Enter ↵ to send</span>
        </div>
      </footer>

      {/* Security Info Modal */}
      {showSecurityModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSecurityModal(false)}>
          <div
            className="glass-panel animate-fade-in"
            style={styles.securityModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.secModalHeader}>
              <div style={styles.secModalIcon}>
                <ShieldCheck size={24} color="var(--accent-n)" />
              </div>
              <h3 style={styles.secModalTitle}>Security & Privacy Architecture</h3>
            </div>

            <div style={styles.secModalBody}>
              <div style={styles.secSection}>
                <strong>End-to-End Encryption (AES-256-GCM)</strong>
                <p>
                  Every message is encrypted in your browser using AES-256-GCM with a
                  unique 96-bit cryptographic nonce and PBKDF2 (100,000 iterations).
                  Neither Supabase nor network eavesdroppers ever receive plaintext.
                </p>
              </div>

              <div style={styles.secSection}>
                <strong>Strict PostgreSQL Row-Level Security</strong>
                <p>
                  The Supabase database enforces check constraints ensuring sender
                  identities are strictly restricted to <code>N</code> or <code>H</code>.
                  Database rows store only the ciphertext and nonce.
                </p>
              </div>

              <div style={styles.secSection}>
                <strong>Access Verification Notice</strong>
                <p>
                  Access is guarded by the shared passkey. For maximum confidentiality,
                  N and H should exchange their passkey through a secure channel.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSecurityModal(false)}
              style={styles.secCloseButton}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-main)',
    overflow: 'hidden',
  },
  header: {
    height: '64px',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(12, 14, 22, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border-subtle)',
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  logoBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoText: {
    fontSize: '17px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    color: '#ffffff',
  },
  conversationInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  identityPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
  },
  identityLabel: {
    color: 'var(--text-muted)',
    fontSize: '12px',
  },
  identityTag: {
    padding: '3px 9px',
    borderRadius: 'var(--radius-full)',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.02em',
  },
  speakingArrow: {
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--border-subtle)',
    padding: '5px 10px',
    borderRadius: 'var(--radius-full)',
  },
  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  iconButton: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockButton: {
    height: '36px',
    padding: '0 12px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#fca5a5',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '500',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
  },
  devBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    color: '#fcd34d',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '10px 16px',
    background: 'var(--accent-danger-bg)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    color: '#fca5a5',
  },
  retryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#ffffff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '60px 0',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid rgba(139, 92, 246, 0.2)',
    borderTopColor: 'var(--accent-h)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '60px 20px',
    maxWidth: '440px',
    margin: 'auto',
  },
  emptyIconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '18px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '8px',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  emptyHint: {
    fontSize: '12px',
    color: 'var(--accent-n)',
    background: 'var(--accent-n-bg)',
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
  },
  dateDivider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '12px 0',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    width: '100%',
  },
  messageAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    flexShrink: 0,
    marginBottom: '4px',
  },
  bubbleWrapper: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '75%',
  },
  senderLabel: {
    fontSize: '11px',
    marginBottom: '3px',
    padding: '0 4px',
  },
  bubble: {
    padding: '12px 16px',
    borderRadius: '18px',
    wordBreak: 'break-word',
    lineHeight: '1.5',
    fontSize: '14.5px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
  myBubbleN: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
  },
  myBubbleH: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
  },
  theirBubble: {
    background: 'rgba(25, 28, 42, 0.95)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
    borderBottomLeftRadius: '4px',
  },
  corruptedBubble: {
    background: 'var(--accent-danger-bg)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
  },
  messageText: {
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  messageMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '4px',
    padding: '0 4px',
  },
  timestamp: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  encryptedTag: {
    display: 'flex',
    alignItems: 'center',
  },
  footer: {
    padding: '16px 20px',
    background: 'rgba(12, 14, 22, 0.85)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '900px',
    width: '100%',
    margin: '0 auto',
  },
  inputForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  textarea: {
    width: '100%',
    height: '46px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '14.5px',
    resize: 'none',
  },
  sendButton: {
    width: '46px',
    height: '46px',
    borderRadius: 'var(--radius-md)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
    flexShrink: 0,
  },
  inputFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
  },
  e2eStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
    color: 'var(--text-muted)',
  },
  keyHint: {
    fontSize: '11.5px',
    color: 'var(--text-muted)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 2000,
  },
  securityModal: {
    width: '100%',
    maxWidth: '480px',
    padding: '28px',
  },
  secModalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  secModalIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'var(--accent-n-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secModalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
  },
  secModalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
    fontSize: '13.5px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  secSection: {
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '12px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
  },
  secCloseButton: {
    width: '100%',
    height: '44px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-card-hover)',
    border: '1px solid var(--border-subtle)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
  },
};
