import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App.jsx';

describe('Realsecrets The Secret & Harry Potter Theme Flow', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders Screen 1 (Secret Code Modal) with The Secret theme by default', () => {
    render(<App />);

    expect(screen.getByText('ENTER THE SECRET CODE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /EXPLORE THE SECRET/i })).toBeInTheDocument();
    expect(document.getElementById('website-logo')).toBeInTheDocument();
  });

  it('shows friendly error message when incorrect secret code is entered', async () => {
    render(<App />);

    const input = document.getElementById('secret-code-input');
    const continueBtn = document.getElementById('continue-button');

    fireEvent.change(input, { target: { value: 'wrongcode' } });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/The secret code is incorrect. The seal remains unbroken./i)
      ).toBeInTheDocument();
    });
  });

  it('unlocks and displays Screen 2 (Who are you?) when correct code is entered', async () => {
    render(<App />);

    const input = document.getElementById('secret-code-input');
    const continueBtn = document.getElementById('continue-button');

    fireEvent.change(input, { target: { value: 'bepositive' } });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText('WHO ARE YOU?')).toBeInTheDocument();
      expect(document.getElementById('profile-btn-n')).toBeInTheDocument();
      expect(document.getElementById('profile-btn-h')).toBeInTheDocument();
    });
  });

  it('enters Profile N chat interface, sends encrypted message, switches to Profile H, and verifies conversation history', async () => {
    render(<App />);

    // 1. Enter secret code
    const input = document.getElementById('secret-code-input');
    const continueBtn = document.getElementById('continue-button');
    fireEvent.change(input, { target: { value: 'bepositive' } });
    fireEvent.click(continueBtn);

    // 2. Select Profile N
    await waitFor(() => {
      expect(document.getElementById('profile-btn-n')).toBeInTheDocument();
    });
    fireEvent.click(document.getElementById('profile-btn-n'));

    // 3. Verify Screen 3 Chat Interface loaded for N
    await waitFor(() => {
      expect(document.getElementById('message-input')).toBeInTheDocument();
      expect(document.getElementById('nav-switch-profile')).toBeInTheDocument();
    });

    // 4. Send encrypted message as N
    const messageInput = document.getElementById('message-input');
    fireEvent.change(messageInput, {
      target: { value: 'Inscribed secret scroll from N to H.' },
    });

    const sendBtn = document.getElementById('send-message-button');
    fireEvent.click(sendBtn);

    // Verify message appears in conversation
    await waitFor(() => {
      expect(
        screen.getByText('Inscribed secret scroll from N to H.')
      ).toBeInTheDocument();
    });

    // 5. Switch to Profile H
    const switchProfileBtn = document.getElementById('switch-profile-button');
    fireEvent.click(switchProfileBtn);

    // Back to Profile Selection
    await waitFor(() => {
      expect(screen.getByText('WHO ARE YOU?')).toBeInTheDocument();
    });

    // Select Profile H
    fireEvent.click(document.getElementById('profile-btn-h'));

    // 6. Verify H sees N's previous message
    await waitFor(() => {
      expect(
        screen.getByText('Inscribed secret scroll from N to H.')
      ).toBeInTheDocument();
    });

    // Reply as H
    const replyInput = document.getElementById('message-input');
    fireEvent.change(replyInput, {
      target: { value: 'Received the secret scroll with gratitude, N!' },
    });
    const replySendBtn = document.getElementById('send-message-button');
    fireEvent.click(replySendBtn);

    // Both messages should now be visible in conversation
    await waitFor(() => {
      expect(
        screen.getByText('Inscribed secret scroll from N to H.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Received the secret scroll with gratitude, N!')
      ).toBeInTheDocument();
    });

    // 7. Lock session
    const lockBtn = document.getElementById('header-lock-button');
    fireEvent.click(lockBtn);

    // Back to Screen 1
    await waitFor(() => {
      expect(screen.getByText('ENTER THE SECRET CODE')).toBeInTheDocument();
    });
  });
});
