import React, { useState } from 'react';
import Modal from './Modal';
import { QrCode, CheckCircle2, ShieldCheck, Search, AlertCircle } from 'lucide-react';

export default function QRCheckInModal({ isOpen, onClose, bookings = [], onConfirmCheckIn }) {
  const [qrInput, setQrInput] = useState('SPV-BK-9921');
  const [scannedBooking, setScannedBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleVerify = (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const code = qrInput.trim();
    if (!code) {
      setErrorMsg('Please enter a valid Booking ID or QR Code text');
      return;
    }

    const found = bookings.find(
      (b) => b.booking_id === code || b.qr_code === code || b.qr_code === `SPORTVERSE_QR_${code}`
    );

    if (found) {
      setScannedBooking(found);
    } else {
      setErrorMsg(`No booking found matching "${code}". Please verify with customer.`);
      setScannedBooking(null);
    }
  };

  const handleCheckIn = () => {
    if (!scannedBooking) return;
    onConfirmCheckIn(scannedBooking.booking_id);
    setSuccessMsg(`Player ${scannedBooking.user_name} Checked-In Successfully! Access Granted.`);
    setTimeout(() => {
      setScannedBooking(null);
      setSuccessMsg('');
      setQrInput('');
      onClose();
    }, 1800);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Check-In & QR Scanner">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Scanner Simulation Box */}
        <div style={styles.scannerBox}>
          <div style={styles.viewfinder}>
            <QrCode size={48} color="#c8895b" />
            <span style={{ fontSize: '0.775rem', color: '#a39c93', marginTop: '0.5rem' }}>
              Position QR Code in scanner or manually enter Booking ID
            </span>
          </div>
        </div>

        {/* Input & Verify Form */}
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. SPV-BK-9921"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <Search size={16} />
            Lookup
          </button>
        </form>

        {errorMsg && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} color="#ef4444" />
            <span style={{ fontSize: '0.825rem', color: '#f87171' }}>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={styles.successAlert}>
            <CheckCircle2 size={20} color="#c8895b" />
            <span style={{ fontSize: '0.875rem', color: '#e5ba93', fontWeight: 600 }}>{successMsg}</span>
          </div>
        )}

        {/* Scanned Result Details */}
        {scannedBooking && !successMsg && (
          <div style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <ShieldCheck size={20} color="#c8895b" />
              <span style={{ fontWeight: 700, color: '#ffffff' }}>Valid Booking Verified</span>
              <span className="badge badge-approved" style={{ marginLeft: 'auto' }}>
                {scannedBooking.payment_status}
              </span>
            </div>

            <div style={styles.detailGrid}>
              <div>
                <span style={styles.detailLabel}>Customer</span>
                <span style={styles.detailVal}>{scannedBooking.user_name}</span>
              </div>
              <div>
                <span style={styles.detailLabel}>Venue</span>
                <span style={styles.detailVal}>{scannedBooking.ground_name}</span>
              </div>
              <div>
                <span style={styles.detailLabel}>Date & Time</span>
                <span style={styles.detailVal}>{scannedBooking.date} • {scannedBooking.slot_time}</span>
              </div>
              <div>
                <span style={styles.detailLabel}>Amount Paid</span>
                <span style={{ ...styles.detailVal, color: '#e5ba93', fontWeight: 700 }}>
                  ₹{scannedBooking.total_price}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCheckIn}
              style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}
            >
              <CheckCircle2 size={18} />
              Confirm Entry & Check-In Player
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

const styles = {
  scannerBox: {
    padding: '1.5rem',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(15, 13, 11, 0.9)',
    border: '2px dashed var(--primary-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(200, 137, 91, 0.15)',
    border: '1px solid rgba(200, 137, 91, 0.35)',
  },
  resultCard: {
    padding: '1rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(21, 19, 17, 0.95)',
    border: '1px solid var(--primary-glow)',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '0.75rem',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
  },
  detailLabel: {
    display: 'block',
    fontSize: '0.725rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
  },
  detailVal: {
    display: 'block',
    fontSize: '0.875rem',
    color: '#ffffff',
    fontWeight: 500,
  }
};
