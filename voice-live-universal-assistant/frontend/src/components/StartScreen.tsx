import React from 'react';
import { VoiceOrb } from './VoiceOrb';
import type { VoiceSettings } from '../types';

interface StartScreenProps {
  onStart: () => void;
  onOpenSettings: () => void;
  settings: VoiceSettings;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onOpenSettings, settings }) => {
  const agentMissingConfig = settings.mode === 'agent'
    && (!settings.agentName?.trim() || !settings.project?.trim());

  return (
    <div style={containerStyle}>
      <button
        style={gearButtonStyle}
        onClick={onOpenSettings}
        aria-label="Settings"
        title="Settings"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--fg-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <VoiceOrb state="idle" size={180} />

      <h1 style={headingStyle}>Let's talk</h1>
      <p style={descStyle}>Click to start a voice session with the AI assistant</p>

      <button
        style={{ ...startButtonStyle, ...(agentMissingConfig ? disabledStartStyle : {}) }}
        onClick={agentMissingConfig ? undefined : onStart}
        disabled={agentMissingConfig}
        title={agentMissingConfig ? 'Agent Name and Project are required — configure in Settings' : undefined}
      >
        Start session
      </button>
      {agentMissingConfig && (
        <p style={warningStyle}>Agent Name and Project are required — open Settings to configure</p>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  gap: '24px',
  position: 'relative',
};

const gearButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '24px',
  right: '24px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
};

const headingStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 700,
  color: 'var(--fg-1)',
  margin: 0,
};

const descStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  color: 'var(--fg-3)',
  margin: 0,
  textAlign: 'center',
  maxWidth: '360px',
};

const startButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--voice-secondary), var(--voice-primary))',
  color: '#fff',
  border: 'none',
  padding: '14px 40px',
  borderRadius: '12px',
  fontSize: '1.1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'transform 0.15s, box-shadow 0.15s',
  boxShadow: '0 4px 20px var(--voice-glow)',
};

const disabledStartStyle: React.CSSProperties = {
  opacity: 0.45,
  cursor: 'not-allowed',
  boxShadow: 'none',
};

const warningStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--fg-3)',
  margin: 0,
  textAlign: 'center',
  maxWidth: '360px',
};
