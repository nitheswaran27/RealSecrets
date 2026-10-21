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
 * Broadcasts a read receipt indicating the reader has viewed correspondence
 * @param {{ reader: 'N'|'H', timestamp?: number }} param0
 */
export function broadcastReadReceipt({ reader, timestamp }) {
  const ts = timestamp || Date.now();
  try {
    localStorage.setItem(`realsecrets_last_read_${reader}`, ts.toString());
  } catch {
    // ignore
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const channel = supabase.channel('realsecrets_realtime');
      channel.send({
        type: 'broadcast',
        event: 'READ_RECEIPT',
        payload: { reader, timestamp: ts },
      });
    } catch {
      // ignore
    }
  }

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({ type: 'READ_RECEIPT', reader, timestamp: ts });
      bc.close();
    } catch {
      // ignore
    }
  }
}

/**
 * Clears all chat messages and read receipts from storage (local mock or Supabase)
 */
export async function clearAllMessages() {
  // 1. Wipe local storage
  try {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    localStorage.removeItem('realsecrets_last_read_N');
    localStorage.removeItem('realsecrets_last_read_H');
  } catch (err) {
    console.error('Failed to clear local mock storage', err);
  }

  // 2. Broadcast clear event to other tabs
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: 'CLEAR_MESSAGES' });
      channel.close();
    } catch {
      // ignore
    }
  }

  // 3. Clear Supabase database if configured
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      throw new Error(`Failed to clear Supabase messages: ${error.message}`);
    }

    try {
      const channel = supabase.channel('realsecrets_realtime');
      channel.send({
        type: 'broadcast',
        event: 'CLEAR_MESSAGES',
        payload: { timestamp: Date.now() },
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Subscribes to real-time incoming messages and read receipts
 * @param {Function} onMessage Callback invoked with the new encrypted message object
 * @param {Function} [onStatusChange] Callback invoked with connection status ('SUBSCRIBED', 'OFFLINE', etc.)
 * @param {Function} [onReceipt] Callback invoked with receipt object ({ reader, timestamp })
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToMessages(onMessage, onStatusChange, onReceipt) {
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
      .on('broadcast', { event: 'READ_RECEIPT' }, ({ payload }) => {
        if (payload?.reader && payload?.timestamp) {
          onReceipt?.(payload);
        }
      })
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
        } else if (event.data?.type === 'READ_RECEIPT') {
          onReceipt?.(event.data);
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
    } else if (event.key && event.key.startsWith('realsecrets_last_read_') && event.newValue) {
      const reader = event.key.replace('realsecrets_last_read_', '');
      onReceipt?.({ reader, timestamp: parseInt(event.newValue, 10) });
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
