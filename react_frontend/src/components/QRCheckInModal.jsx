import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, Search, AlertCircle, Calendar, Clock, MapPin, IndianRupee } from 'lucide-react';

export default function QRCheckInModal({ isOpen, onClose, bookings = [], onConfirmCheckIn }) {
  const [scannedId, setScannedId] = useState('');
  const [foundBooking, setFoundBooking] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleScanSearch = (idToSearch = scannedId) => {
    setErrorMsg('');
    setSuccessMsg('');
    const query = String(idToSearch).trim().toLowerCase();
    if (!query) {
      setErrorMsg('Please enter a Booking ID or QR code text');
      setFoundBooking(null);
      return;
    }

    const booking = bookings.find((b) => {
      const bId = String(b.booking_id || '').toLowerCase();
      const qr = String(b.qr_code || '').toLowerCase();
      const uName = String(b.user_name || '').toLowerCase();
      return bId === query || qr === query || bId.includes(query) || qr.includes(query) || (query.length >= 3 && uName.includes(query));
    });

    if (booking) {
      setFoundBooking(booking);
    } else {
      setFoundBooking(null);
      setErrorMsg(`No active booking matching "${idToSearch}" was found in MongoDB database.`);
    }
  };

  const handleConfirm = async () => {
    if (foundBooking) {
      await onConfirmCheckIn(foundBooking.booking_id);
      setSuccessMsg(`✓ Player check-in confirmed for ${foundBooking.user_name} (${foundBooking.booking_id})!`);
      setTimeout(() => {
        setFoundBooking(null);
        setScannedId('');
        setSuccessMsg('');
        onClose();
      }, 1500);
    }
  };

  const sampleBookings = bookings.slice(0, 3);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(200, 137, 91, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={22} color="#c8895b" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>QR Check-In Scanner</h3>
              <span style={{ fontSize: '0.75rem', color: '#a39c93' }}>Station Player Verification</span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a39c93' }}>
            <X size={20} />
          </button>
        </div>

        {/* QR Scanner Simulation Visual */}
        <div style={{
          background: 'rgba(10, 9, 8, 0.9)',
          border: '2px dashed rgba(200, 137, 91, 0.4)',
          borderRadius: '12px',
          padding: '1.5rem 1rem',
          textAlign: 'center',
          marginBottom: '1.25rem',
          position: 'relative',
        }}>
          <QrCode size={44} color="#c8895b" style={{ opacity: 0.85 }} />
          <div style={{ fontSize: '0.825rem', color: '#a39c93', marginTop: '0.5rem' }}>
            Scan player booking QR code or enter Booking ID below
          </div>
        </div>

        {/* Quick Sample Clickers */}
        {sampleBookings.length > 0 && !foundBooking && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#a39c93', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
              Quick Select Recent Booking:
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {sampleBookings.map((sb) => (
                <button
                  key={sb.booking_id}
                  type="button"
                  onClick={() => {
                    setScannedId(sb.booking_id);
                    handleScanSearch(sb.booking_id);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: '#c8895b',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {sb.booking_id} ({sb.user_name})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Booking ID or QR Code Text</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              value={scannedId}
              onChange={(e) => setScannedId(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleScanSearch(); }}
              placeholder="e.g. SPV-BK-9821 or SPORTVERSE_QR_..."
            />
            <button className="btn btn-primary" onClick={() => handleScanSearch()}>
              <Search size={16} />
              <span>Verify</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.75rem',
            color: '#ef4444',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {foundBooking && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '10px',
            padding: '1.25rem',
            marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} />
                <span>Valid Reservation Found</span>
              </div>
              <span className={`badge ${foundBooking.booking_status === 'Completed' ? 'badge-green' : 'badge-blue'}`}>
                {foundBooking.booking_status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem' }}>
              <div>
                <span style={{ color: '#a39c93', display: 'block', fontSize: '0.725rem' }}>Player Name</span>
                <strong style={{ color: '#ffffff' }}>{foundBooking.user_name}</strong>
              </div>
              <div>
                <span style={{ color: '#a39c93', display: 'block', fontSize: '0.725rem' }}>Booking Ref</span>
                <strong style={{ color: '#c8895b' }}>{foundBooking.booking_id}</strong>
              </div>
              <div>
                <span style={{ color: '#a39c93', display: 'block', fontSize: '0.725rem' }}>Venue & Sport</span>
                <span style={{ color: '#ffffff' }}>{foundBooking.ground_name} • {foundBooking.sport || foundBooking.sport_type}</span>
              </div>
              <div>
                <span style={{ color: '#a39c93', display: 'block', fontSize: '0.725rem' }}>Time Slot</span>
                <span style={{ color: '#ffffff' }}>{foundBooking.booking_date || foundBooking.date} ({foundBooking.booking_time || foundBooking.slot_time})</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', background: '#10b981', borderColor: '#10b981' }}
              onClick={handleConfirm}
            >
              <CheckCircle2 size={16} />
              <span>Confirm Player Check-In</span>
            </button>
          </div>
        )}

        {successMsg && (
          <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', marginTop: '0.5rem' }}>
            {successMsg}
          </div>
        )}
      </div>
    </div>
  );
}
