import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App.jsx';

describe('Realsecrets End-to-End Application Flow', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders Screen 1 (Secret Code Modal) by default', () => {
    render(<App />);

    expect(screen.getByText('Realsecrets')).toBeInTheDocument();
    expect(screen.getByText('Enter the secret code')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('shows friendly error message when incorrect secret code is entered', async () => {
    render(<App />);

    const input = screen.getByPlaceholderText('••••••••••••');
    const continueBtn = screen.getByText('Continue');

    fireEvent.change(input, { target: { value: 'wrongcode' } });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Incorrect secret code. Access denied.')
      ).toBeInTheDocument();
    });
  });

  it('unlocks and displays Screen 2 (Who are you?) when correct code is entered', async () => {
    render(<App />);

    const input = screen.getByPlaceholderText('••••••••••••');
    const continueBtn = screen.getByText('Continue');

    fireEvent.change(input, { target: { value: 'bepositive' } });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText('Who are you?')).toBeInTheDocument();
      expect(screen.getByText('Profile N')).toBeInTheDocument();
      expect(screen.getByText('Profile H')).toBeInTheDocument();
    });
  });

  it('enters Profile N chat interface, sends encrypted message, switches to Profile H, and verifies conversation history', async () => {
    render(<App />);

    // 1. Enter secret code
    const input = screen.getByPlaceholderText('••••••••••••');
    const continueBtn = screen.getByText('Continue');
    fireEvent.change(input, { target: { value: 'bepositive' } });
    fireEvent.click(continueBtn);

    // 2. Select Profile N
    await waitFor(() => {
      expect(screen.getByText('Profile N')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Profile N'));

    // 3. Verify Screen 3 Chat Interface loaded for N
    await waitFor(() => {
      expect(screen.getByText('You:')).toBeInTheDocument();
      expect(screen.getByText('Partner:')).toBeInTheDocument();
    });

    // 4. Send encrypted message as N
    const messageInput = screen.getByPlaceholderText(
      /Send encrypted message as Profile N/i
    );
    fireEvent.change(messageInput, {
      target: { value: 'Hello H, confidential test message.' },
    });

    const sendBtn = screen.getByTitle('Send Encrypted Message');
    fireEvent.click(sendBtn);

    // Verify message appears in conversation
    await waitFor(() => {
      expect(
        screen.getByText('Hello H, confidential test message.')
      ).toBeInTheDocument();
    });

    // 5. Switch to Profile H
    const switchProfileBtn = screen.getByTitle('Switch between N and H');
    fireEvent.click(switchProfileBtn);

    // Back to Profile Selection
    await waitFor(() => {
      expect(screen.getByText('Who are you?')).toBeInTheDocument();
    });

    // Select Profile H
    fireEvent.click(screen.getByText('Profile H'));

    // 6. Verify H sees N's previous message
    await waitFor(() => {
      expect(
        screen.getByText('Hello H, confidential test message.')
      ).toBeInTheDocument();
    });

    // Reply as H
    const replyInput = screen.getByPlaceholderText(
      /Send encrypted message as Profile H/i
    );
    fireEvent.change(replyInput, {
      target: { value: 'Received loud and clear, N!' },
    });
    const replySendBtn = screen.getByTitle('Send Encrypted Message');
    fireEvent.click(replySendBtn);

    // Both messages should now be visible in conversation
    await waitFor(() => {
      expect(
        screen.getByText('Hello H, confidential test message.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Received loud and clear, N!')
      ).toBeInTheDocument();
    });

    // 7. Lock session
    const lockBtn = screen.getByTitle('Lock chat session');
    fireEvent.click(lockBtn);

    // Back to Screen 1
    await waitFor(() => {
      expect(screen.getByText('Enter the secret code')).toBeInTheDocument();
    });
  });
});
