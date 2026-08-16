import React, { useState } from 'react';
import { X, Key, Copy, CheckCircle2, Globe, Mail, ShieldCheck, ExternalLink } from 'lucide-react';

export default function CredentialsModal({ isOpen, onClose, credentials }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !credentials) return null;

  const dispatchText = `
🎉 Congratulations ${credentials.fullName}! Your SportVerse Station Owner registration has been APPROVED by the System Admin.

🔑 Station Owner Portal Credentials:
------------------------------------------
🌐 Portal Site URL : ${credentials.portalUrl}
📧 Login Email    : ${credentials.email}
🔒 Unique Password : ${credentials.generatedPassword}
------------------------------------------
Please sign in to manage your venues, court slots, and player booking check-ins!
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(dispatchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Account Approved!</h3>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Credentials Generated</span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a39c93' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#a39c93', marginBottom: '0.85rem', lineHeight: 1.5 }}>
          The Ground Owner registration for <strong>{credentials.fullName}</strong> has been approved. The owner's original mobile app password remains completely unchanged.
        </p>

        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '8px',
          padding: '0.6rem 0.85rem',
          fontSize: '0.78rem',
          color: '#10b981',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>📧 Approval email dispatched via SMTP & in-app notification recorded.</span>
        </div>

        {/* Credentials Display Box */}
        <div style={{
          background: 'rgba(10, 9, 8, 0.9)',
          border: '1px solid rgba(200, 137, 91, 0.4)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}>
          <div>
            <span style={{ fontSize: '0.725rem', color: '#a39c93', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Globe size={13} color="#c8895b" />
              <span>Portal Site URL</span>
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{credentials.portalUrl}</span>
              <a href={credentials.portalUrl} target="_blank" rel="noreferrer" style={{ color: '#c8895b', display: 'flex', alignItems: 'center' }}>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '0.725rem', color: '#a39c93', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={13} color="#3b82f6" />
                <span>Station Owner Email</span>
              </span>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
                {credentials.email}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.725rem', color: '#a39c93', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Key size={13} color="#10b981" />
                <span>Generated Password</span>
              </span>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {credentials.generatedPassword}
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1.5, background: copied ? '#10b981' : 'var(--gold-gradient)', gap: '0.5rem' }}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <CheckCircle2 size={16} />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Credentials & Dispatch</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
