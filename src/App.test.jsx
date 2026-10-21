import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App.jsx';
import { parseProfileFromDob } from './services/identity.js';

describe('Realsecrets Date-of-Birth Identity Flow', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('parseProfileFromDob helper', () => {
    it('accurately identifies Profile H from 02/05/2007 in multiple formats', () => {
      expect(parseProfileFromDob('02/05/2007')).toBe('H');
      expect(parseProfileFromDob('02-05-2007')).toBe('H');
      expect(parseProfileFromDob('2/5/2007')).toBe('H');
      expect(parseProfileFromDob('2007-05-02')).toBe('H');
      expect(parseProfileFromDob('02052007')).toBe('H');
    });

    it('accurately identifies Profile N from 27/09/2006 in multiple formats', () => {
      expect(parseProfileFromDob('27/09/2006')).toBe('N');
      expect(parseProfileFromDob('27-09-2006')).toBe('N');
      expect(parseProfileFromDob('27/9/2006')).toBe('N');
      expect(parseProfileFromDob('2006-09-27')).toBe('N');
      expect(parseProfileFromDob('27092006')).toBe('N');
    });

    it('returns null for unrecognized birth dates', () => {
      expect(parseProfileFromDob('15/08/1995')).toBeNull();
      expect(parseProfileFromDob('01/01/2000')).toBeNull();
      expect(parseProfileFromDob('')).toBeNull();
    });
  });

  it('renders Secret Code and Date of Birth inputs by default', () => {
    render(<App />);

    expect(screen.getByText('ENTER THE SECRET CODE')).toBeInTheDocument();
    expect(document.getElementById('secret-code-input')).toBeInTheDocument();
    expect(document.getElementById('dob-input')).toBeInTheDocument();
    expect(document.getElementById('continue-button')).toBeInTheDocument();
  });

  it('shows error if secret code is incorrect', async () => {
    render(<App />);

    const codeInput = document.getElementById('secret-code-input');
    const dobInput = document.getElementById('dob-input');
    const continueBtn = document.getElementById('continue-button');

    fireEvent.change(codeInput, { target: { value: 'wrongpass' } });
    fireEvent.change(dobInput, { target: { value: '02/05/2007' } });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/The secret code is incorrect. The seal remains unbroken./i)
      ).toBeInTheDocument();
    });
  });

  it('shows error if date of birth does not match either keeper', async () => {
    render(<App />);

    const codeInput = document.getElementById('secret-code-input');
    const dobInput = document.getElementById('dob-input');
    const continueBtn = document.getElementById('continue-button');

    fireEvent.change(codeInput, { target: { value: 'bepositive' } });
    fireEvent.change(dobInput, { target: { value: '10/10/2000' } });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/This date of birth is not recognized by the sacred seal./i)
      ).toBeInTheDocument();
    });
  });

  it('automatically unlocks Profile H directly when DOB is 02/05/2007', async () => {
    render(<App />);

    const codeInput = document.getElementById('secret-code-input');
    const dobInput = document.getElementById('dob-input');
    const continueBtn = document.getElementById('continue-button');

    fireEvent.change(codeInput, { target: { value: 'bepositive' } });
    fireEvent.change(dobInput, { target: { value: '02/05/2007' } });
    fireEvent.click(continueBtn);

    // Directly in Profile H's chat room!
    await waitFor(() => {
      expect(document.getElementById('message-input')).toBeInTheDocument();
      expect(document.getElementById('nav-switch-profile')).toHaveTextContent(/H ⇄ N/);
    });
  });

  it('automatically unlocks Profile N directly when DOB is 27/09/2006, sends message, and allows switching', async () => {
    render(<App />);

    const codeInput = document.getElementById('secret-code-input');
    const dobInput = document.getElementById('dob-input');
    const continueBtn = document.getElementById('continue-button');

    fireEvent.change(codeInput, { target: { value: 'bepositive' } });
    fireEvent.change(dobInput, { target: { value: '27/09/2006' } });
    fireEvent.click(continueBtn);

    // Directly in Profile N's chat room!
    await waitFor(() => {
      expect(document.getElementById('message-input')).toBeInTheDocument();
      expect(document.getElementById('nav-switch-profile')).toHaveTextContent(/N ⇄ H/);
    });

    // Send encrypted message as N
    const messageInput = document.getElementById('message-input');
    fireEvent.change(messageInput, {
      target: { value: 'Secret parchment message from N to H.' },
    });
    fireEvent.click(document.getElementById('send-message-button'));

    await waitFor(() => {
      expect(
        screen.getByText('Secret parchment message from N to H.')
      ).toBeInTheDocument();
    });

    // Switch profile directly in-session
    fireEvent.click(document.getElementById('switch-profile-button'));

    // Now chatting as H
    await waitFor(() => {
      expect(document.getElementById('nav-switch-profile')).toHaveTextContent(/H ⇄ N/);
    });

    // Lock session
    fireEvent.click(document.getElementById('header-lock-button'));

    // Returns to Screen 1
    await waitFor(() => {
      expect(screen.getByText('ENTER THE SECRET CODE')).toBeInTheDocument();
      expect(document.getElementById('dob-input')).toBeInTheDocument();
    });
  });
});
