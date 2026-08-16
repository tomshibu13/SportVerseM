import React, { useState } from 'react';
import { QrCode, CheckCircle2, XCircle, User, Clock, MapPin, Scan } from 'lucide-react';

const mockDB = {
  'BK-9821': { name: 'Rahul Dravid', court: 'Metro Sports Complex – Turf A', time: '18:00 - 19:00', status: 'Confirmed', sport: 'Football' },
  'BK-9822': { name: 'Anjali Menon', court: 'Victory Badminton Arena – Hall 1', time: '19:00 - 20:00', status: 'Confirmed', sport: 'Badminton' },
  'BK-9824': { name: 'Kiran Kumar', court: 'Victory Badminton Arena – Hall 1', time: '07:00 - 08:00', status: 'Confirmed', sport: 'Badminton' },
  'BK-9825': { name: 'Priya Nair', court: 'Metro Sports Complex – Turf A', time: '17:00 - 18:00', status: 'Cancelled', sport: 'Football' },
};

const checkinLog = [
  { id: 'BK-9820', name: 'Dev S.', time: '08:45 AM', status: 'success', sport: 'Football' },
  { id: 'BK-9819', name: 'Rita K.', time: '08:00 AM', status: 'success', sport: 'Badminton' },
  { id: 'BK-9818', name: 'Unknown', time: '07:30 AM', status: 'failed', sport: '—' },
];

export default function CheckInPage() {
  const [inputCode, setInputCode] = useState('');
  const [result, setResult] = useState(null);
  const [log, setLog] = useState(checkinLog);
  const [scanning, setScanning] = useState(false);

  const handleScan = (code) => {
    const bk = (code || inputCode).trim().toUpperCase();
    if (!bk) return;
    const booking = mockDB[bk];
    if (!booking) {
      setResult({ status: 'failed', message: `Booking ID "${bk}" not found in system.`, code: bk });
      setLog(prev => [{ id: bk, name: 'Unknown', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'failed', sport: '—' }, ...prev]);
      return;
    }
    if (booking.status === 'Cancelled') {
      setResult({ status: 'failed', message: `Booking ${bk} was CANCELLED. Entry denied.`, code: bk, booking });
      setLog(prev => [{ id: bk, name: booking.name, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'failed', sport: booking.sport }, ...prev]);
      return;
    }
    setResult({ status: 'success', message: 'Player verified! Entry approved.', code: bk, booking });
    setLog(prev => [{ id: bk, name: booking.name, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'success', sport: booking.sport }, ...prev]);
    setInputCode('');
  };

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      const ids = Object.keys(mockDB);
      const randId = ids[Math.floor(Math.random() * ids.length)];
      setInputCode(randId);
      setScanning(false);
      handleScan(randId);
    }, 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e8f5f1' }}>QR Check-In Scanner</h2>
        <p style={{ color: '#7fb3a0', fontSize: '0.875rem' }}>Scan player QR codes or enter booking IDs to verify entry</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Scanner panel */}
        <div className="card">
          {/* QR display area */}
          <div style={{
            width: '100%', aspectRatio: '1 / 0.75',
            background: 'rgba(6,13,13,0.9)', border: '2px dashed rgba(16,185,129,0.3)',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.25rem', position: 'relative', overflow: 'hidden',
          }}>
            {scanning ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '200px', height: '200px',
                  border: '3px solid #10b981', borderRadius: '12px',
                  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, #10b981, transparent)', animation: 'scanLine 1.4s ease-in-out infinite' }} />
                  <QrCode size={80} color="rgba(16,185,129,0.3)" />
                </div>
                <p style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>Scanning QR Code...</p>
              </div>
            ) : result ? (
              <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                {result.status === 'success' ? (
                  <>
                    <CheckCircle2 size={64} color="#10b981" style={{ filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.6))' }} />
                    <p style={{ color: '#10b981', fontWeight: 800, fontSize: '1.2rem', marginTop: '0.75rem' }}>{result.message}</p>
                    <div style={{ marginTop: '1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '0.85rem' }}>
                      <div style={{ fontSize: '0.82rem', color: '#7fb3a0', marginBottom: '0.3rem' }}>Player Details</div>
                      <div style={{ fontWeight: 800, color: '#e8f5f1', fontSize: '1rem' }}>{result.booking?.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', justifyContent: 'center' }}>
                        <MapPin size={12} color="#7fb3a0" />
                        <span style={{ fontSize: '0.8rem', color: '#7fb3a0' }}>{result.booking?.court}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', justifyContent: 'center' }}>
                        <Clock size={12} color="#7fb3a0" />
                        <span style={{ fontSize: '0.8rem', color: '#7fb3a0' }}>{result.booking?.time}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={64} color="#ef4444" style={{ filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.6))' }} />
                    <p style={{ color: '#ef4444', fontWeight: 800, fontSize: '1rem', marginTop: '0.75rem' }}>{result.message}</p>
                    <p style={{ color: '#7fb3a0', fontSize: '0.8rem', marginTop: '0.4rem' }}>Please contact support or try another booking ID</p>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', opacity: 0.5 }}>
                <QrCode size={80} color="#10b981" />
                <p style={{ color: '#7fb3a0', fontSize: '0.9rem', textAlign: 'center' }}>Scan a player's QR code<br />or enter a Booking ID below</p>
              </div>
            )}
          </div>

          {/* Manual entry */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              className="form-input"
              placeholder="Enter Booking ID (e.g., BK-9821)"
              value={inputCode}
              onChange={e => setInputCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={() => handleScan()}>
              <Scan size={16} /> Verify
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={simulateScan} disabled={scanning}>
              <QrCode size={16} /> {scanning ? 'Scanning...' : 'Simulate QR Scan'}
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setResult(null); setInputCode(''); }}>
              <XCircle size={16} /> Clear
            </button>
          </div>
        </div>

        {/* Check-in log */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Clock size={16} color="#10b981" /> Check-in Log</span>
            <span style={{ fontSize: '0.75rem', color: '#7fb3a0' }}>Today</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '0.5rem 0.75rem', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{log.filter(l => l.status === 'success').length}</div>
              <div style={{ fontSize: '0.72rem', color: '#7fb3a0' }}>Checked In</div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.5rem 0.75rem', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>{log.filter(l => l.status === 'failed').length}</div>
              <div style={{ fontSize: '0.72rem', color: '#7fb3a0' }}>Denied</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '380px' }}>
            {log.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.75rem', borderRadius: '8px',
                background: entry.status === 'success' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                border: `1px solid ${entry.status === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
              }}>
                {entry.status === 'success'
                  ? <CheckCircle2 size={18} color="#10b981" />
                  : <XCircle size={18} color="#ef4444" />
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e8f5f1' }}>{entry.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#7fb3a0' }}>{entry.id} • {entry.sport}</div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#4a7a6a' }}>{entry.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 0; } 50% { top: calc(100% - 4px); } 100% { top: 0; }
        }
      `}</style>
    </div>
  );
}
