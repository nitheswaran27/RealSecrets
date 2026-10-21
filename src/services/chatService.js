import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const MOCK_STORAGE_KEY = 'realsecrets_mock_messages_v1';
const BROADCAST_CHANNEL_NAME = 'realsecrets_realtime_channel';

/**
 * Reads local messages stored in mock mode
 */
function getLocalMockMessages() {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse local mock messages', err);
    return [];
  }
}

/**
 * Saves local messages in mock mode
 */
function saveLocalMockMessages(messages) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save local mock messages', err);
  }
}

/**
 * Fetches all persistent encrypted messages
 * @returns {Promise<Array<{ id: string, sender: 'N'|'H', ciphertext: string, nonce: string, created_at: string }>>}
 */
export async function fetchMessages() {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender, ciphertext, nonce, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to load messages from Supabase: ${error.message}`);
    }

    return data || [];
  }

  // Development/Local Fallback Mode
  return getLocalMockMessages();
}

/**
 * Sends an encrypted message to the database
 * @param {{ sender: 'N'|'H', ciphertext: string, nonce: string }} param0
 * @returns {Promise<{ id: string, sender: 'N'|'H', ciphertext: string, nonce: string, created_at: string }>}
 */
export async function sendEncryptedMessage({ sender, ciphertext, nonce }) {
  if (sender !== 'N' && sender !== 'H') {
    throw new Error('Sender identity must be either N or H');
  }

  if (!ciphertext || !nonce) {
    throw new Error('Ciphertext and nonce are required');
  }

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender,
          ciphertext,
          nonce,
        },
      ])
      .select('id, sender, ciphertext, nonce, created_at')
      .single();

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    return data;
  }

  // Development/Local Fallback Mode
  const newMessage = {
    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    sender,
    ciphertext,
    nonce,
    created_at: new Date().toISOString(),
  };

  const existing = getLocalMockMessages();
  const updated = [...existing, newMessage];
  saveLocalMockMessages(updated);

  // Broadcast to other tabs/windows in real-time
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: 'NEW_MESSAGE', message: newMessage });
      channel.close();
    } catch {
      // Ignore broadcast errors
    }
  }

  return newMessage;
}

/**
 * Subscribes to real-time incoming messages
 * @param {Function} onMessage Callback invoked with the new encrypted message object
 * @param {Function} onStatusChange Callback invoked with connection status ('SUBSCRIBED', 'OFFLINE', etc.)
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToMessages(onMessage, onStatusChange) {
  if (isSupabaseConfigured() && supabase) {
    onStatusChange?.('CONNECTING');

    const channel = supabase
      .channel('realsecrets_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.new) {
            onMessage(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          onStatusChange?.('CONNECTED');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          onStatusChange?.('ERROR');
        } else if (status === 'CLOSED') {
          onStatusChange?.('DISCONNECTED');
        } else {
          onStatusChange?.(status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Fallback: Realtime via BroadcastChannel & Storage Event for multi-tab testing
  onStatusChange?.('MOCK_REALTIME');

  let broadcastChannel = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'NEW_MESSAGE' && event.data.message) {
          onMessage(event.data.message);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not available', e);
    }
  }

  const handleStorage = (event) => {
    if (event.key === MOCK_STORAGE_KEY && event.newValue) {
      try {
        const msgs = JSON.parse(event.newValue);
        if (Array.isArray(msgs) && msgs.length > 0) {
          const latest = msgs[msgs.length - 1];
          onMessage(latest);
        }
      } catch {
        // ignore
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.close();
    }
    window.removeEventListener('storage', handleStorage);
  };
}
