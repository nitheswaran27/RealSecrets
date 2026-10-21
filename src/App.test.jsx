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

  it('always opens fresh and locked even if legacy keys exist in sessionStorage', () => {
    sessionStorage.setItem('realsecrets_session_code', 'bepositive');
    sessionStorage.setItem('realsecrets_session_profile', 'N');

    render(<App />);

    // Must still show the secret code modal, never auto-unlock to the chat
    expect(screen.getByText('ENTER THE SECRET CODE')).toBeInTheDocument();
    expect(document.getElementById('secret-code-input')).toBeInTheDocument();
    expect(document.getElementById('message-input')).toBeNull();
  });

  it('does not accept uppercase letters and spaces in the secret passkey input', () => {
    render(<App />);

    const codeInput = document.getElementById('secret-code-input');

    // Attempt to type uppercase letters and spaces ('B' and 'P' stripped, spaces stripped)
    fireEvent.change(codeInput, { target: { value: 'Be Positive 123' } });
    expect(codeInput.value).toBe('eositive123');

    // Attempt to type pure spaces
    fireEvent.change(codeInput, { target: { value: '   ' } });
    expect(codeInput.value).toBe('');

    // Attempt to type uppercase only
    fireEvent.change(codeInput, { target: { value: 'UPPERCASE' } });
    expect(codeInput.value).toBe('');

    // Allowed lowercase word
    fireEvent.change(codeInput, { target: { value: 'bepositive' } });
    expect(codeInput.value).toBe('bepositive');
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

  it('automatically unlocks chat directly when DOB is 02/05/2007 and removes Profile labels & unwanted controls', async () => {
    render(<App />);

    const codeInput = document.getElementById('secret-code-input');
    const dobInput = document.getElementById('dob-input');
    const continueBtn = document.getElementById('continue-button');

    fireEvent.change(codeInput, { target: { value: 'bepositive' } });
    fireEvent.change(dobInput, { target: { value: '02/05/2007' } });
    fireEvent.click(continueBtn);

    // Directly in chat room!
    await waitFor(() => {
      expect(document.getElementById('message-input')).toBeInTheDocument();
    });

    // Verify Profile H / Profile N labels are removed
    expect(screen.queryByText(/Profile H/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Profile N/i)).not.toBeInTheDocument();
    expect(document.getElementById('nav-profile-label')).toBeNull();

    // Verify removed elements: Local Synced, Lock Seal, Switch Identity, and Security Icon
    expect(screen.queryByText(/Local Synced/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lock Seal/i)).not.toBeInTheDocument();
    expect(document.getElementById('switch-profile-button')).toBeNull();
    expect(document.getElementById('security-info-button')).toBeNull();

    // Verify HeaderBanner appears in ChatInterface
    expect(document.querySelector('.parchment-header-banner')).toBeInTheDocument();
  });

  it('automatically unlocks chat directly when DOB is 27/09/2006, displays "You" above sent message and no Profile labels', async () => {
    render(<App />);

    const codeInput = document.getElementById('secret-code-input');
    const dobInput = document.getElementById('dob-input');
    const continueBtn = document.getElementById('continue-button');

    fireEvent.change(codeInput, { target: { value: 'bepositive' } });
    fireEvent.change(dobInput, { target: { value: '27/09/2006' } });
    fireEvent.click(continueBtn);

    // Directly in chat room!
    await waitFor(() => {
      expect(document.getElementById('message-input')).toBeInTheDocument();
    });

    // Verify Profile H / Profile N labels are removed
    expect(screen.queryByText(/Profile H/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Profile N/i)).not.toBeInTheDocument();
    expect(document.getElementById('nav-profile-label')).toBeNull();

    // Send encrypted message
    const messageInput = document.getElementById('message-input');
    fireEvent.change(messageInput, {
      target: { value: 'Secret parchment message between us.' },
    });
    fireEvent.click(document.getElementById('send-message-button'));

    await waitFor(() => {
      expect(
        screen.getByText('Secret parchment message between us.')
      ).toBeInTheDocument();
      // Only "You" is mentioned above the message, NOT "You (Profile N)"
      expect(screen.getByText('You')).toBeInTheDocument();
      expect(screen.queryByText(/You \(Profile/i)).not.toBeInTheDocument();

      // Verify profile avatars are removed
      expect(screen.queryByTestId('avatar-me-N')).toBeNull();

      // Verify the delivery/read tick is rendered
      expect(document.querySelector('[data-testid^="status-"]')).toBeInTheDocument();
    });
  });
});
