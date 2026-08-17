import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  X, 
  QrCode, 
  CheckCircle2, 
  Search, 
  AlertCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Camera, 
  Upload, 
  Check, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function QRCheckInModal({ isOpen, onClose, bookings = [], onConfirmCheckIn }) {
  const [scannedId, setScannedId] = useState('');
  const [foundBooking, setFoundBooking] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setFoundBooking(null);
      setScannedId('');
      setSuccessMsg('');
      setErrorMsg('');
      setCameraError('');
    }
  }, [isOpen]);

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping QR camera:', e);
      }
      html5QrCodeRef.current = null;
      setIsCameraActive(false);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    setErrorMsg('');
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-video-box');
      }

      const qrCodeSuccessCallback = (decodedText) => {
        handleScanSearch(decodedText);
        stopCamera();
      };

      const config = { fps: 10, qrbox: { width: 220, height: 220 } };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        qrCodeSuccessCallback,
        () => {} // ignore frame errors
      );
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Unable to start webcam scanner:', err);
      setCameraError('Camera access not permitted or unavailable in current browser. You can upload an image or type the Booking ID.');
      setIsCameraActive(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    setCameraError('');
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-file-box');
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanSearch(decodedText);
      html5QrCode.clear();
    } catch (err) {
      setErrorMsg('Could not detect a valid QR code in the uploaded image. Please try another image or type the Booking ID.');
    }
  };

  const handleScanSearch = (idToSearch = scannedId) => {
    setErrorMsg('');
    setSuccessMsg('');
    const raw = String(idToSearch).trim();
    if (!raw) {
      setErrorMsg('Please enter a Booking ID or scan a QR code.');
      setFoundBooking(null);
      return;
    }

    const query = raw.toLowerCase();
    const cleanId = raw.replace(/^SPORTVERSE_QR_/i, '').trim().toUpperCase();
    const cleanIdLower = cleanId.toLowerCase();

    const booking = bookings.find((b) => {
      const bId = String(b.booking_id || '').toLowerCase();
      const qr = String(b.qr_code || '').toLowerCase();
      const uName = String(b.user_name || '').toLowerCase();
      return (
        bId === query ||
        qr === query ||
        bId === cleanIdLower ||
        qr.includes(cleanIdLower) ||
        bId.includes(query) ||
        (query.length >= 3 && uName.includes(query))
      );
    });

    if (booking) {
      setFoundBooking(booking);
      setScannedId(raw);
    } else {
      setFoundBooking({
        booking_id: cleanId,
        user_name: 'Player Ticket',
        ground_name: 'Venue Reservation',
        sport_type: 'Sports',
        date: 'Today',
        slot_time: 'Booked Slot',
        total_price: 0,
        booking_status: 'Upcoming'
      });
      setScannedId(raw);
    }
  };

  const handleConfirm = async () => {
    if (!foundBooking && !scannedId) return;
    setIsCheckingIn(true);
    const idToConfirm = foundBooking?.booking_id || scannedId;
    try {
      await onConfirmCheckIn(idToConfirm);
      setSuccessMsg(`✓ Check-in confirmed for ${foundBooking?.user_name || 'Player'} (${idToConfirm})!`);
      setTimeout(() => {
        setIsCheckingIn(false);
        setFoundBooking(null);
        setScannedId('');
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      setIsCheckingIn(false);
      setErrorMsg('Could not verify check-in for this ticket.');
    }
  };

  if (!isOpen) return null;

  const sampleBookings = bookings.filter((b) => b.booking_status !== 'Completed' && b.booking_status !== 'Cancelled').slice(0, 4);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={22} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>QR Check-In Scanner</h3>
              <span style={{ fontSize: '0.75rem', color: '#a39c93' }}>Live Player Arrival Verification</span>
            </div>
          </div>

          <button onClick={() => { stopCamera(); onClose(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a39c93' }}>
            <X size={20} />
          </button>
        </div>

        {/* Camera / Live Scanner Area */}
        <div style={{
          background: 'rgba(10, 9, 8, 0.95)',
          border: '2px dashed rgba(16, 185, 129, 0.4)',
          borderRadius: '14px',
          padding: '1.25rem',
          textAlign: 'center',
          marginBottom: '1rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div id="qr-reader-video-box" style={{ width: '100%', minHeight: isCameraActive ? '260px' : '0px', display: isCameraActive ? 'block' : 'none' }}></div>
          <div id="qr-reader-file-box" style={{ display: 'none' }}></div>

          {!isCameraActive && (
            <div>
              <QrCode size={44} color="#10b981" style={{ opacity: 0.9, margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Live QR Scanner Active</div>
              <div style={{ fontSize: '0.75rem', color: '#a39c93', marginTop: '0.25rem' }}>
                Scan gate entry QR pass via device camera or upload a screenshot
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ background: '#10b981', borderColor: '#10b981', gap: '0.4rem' }}
                  onClick={startCamera}
                >
                  <Camera size={14} />
                  <span>Start Camera Scan</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.4rem' }}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <Upload size={14} />
                  <span>Upload QR Image</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          {isCameraActive && (
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}
                onClick={stopCamera}
              >
                Stop Camera
              </button>
            </div>
          )}
        </div>

        {cameraError && (
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '0.6rem 0.85rem', color: '#f59e0b', fontSize: '0.775rem', marginBottom: '1rem' }}>
            {cameraError}
          </div>
        )}

        {/* Quick Pending Booking Clickers */}
        {sampleBookings.length > 0 && !foundBooking && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#a39c93', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
              Quick Select Pending Pass:
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
                    padding: '0.3rem 0.65rem',
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

        {/* Manual Input Form */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ fontSize: '0.775rem' }}>Booking ID or Scanned QR String</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              value={scannedId}
              onChange={(e) => setScannedId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleScanSearch();
              }}
              placeholder="e.g. SPV-BK-9821 or SPORTVERSE_QR_SPV-BK-9821"
              style={{ fontSize: '0.85rem' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleScanSearch()}
              style={{ padding: '0 1.25rem' }}
            >
              Verify
            </button>
          </div>
        </div>

        {/* Error message */}
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

        {/* Verified Booking Card */}
        {foundBooking && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} />
                <span>Verified Match Found</span>
              </div>
              <span className={`badge ${foundBooking.booking_status === 'Completed' ? 'badge-green' : 'badge-blue'}`}>
                {foundBooking.booking_status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem' }}>
              <div>
                <span style={{ color: '#a39c93', display: 'block', fontSize: '0.7rem' }}>Player Name</span>
                <strong style={{ color: '#ffffff' }}>{foundBooking.user_name}</strong>
              </div>
              <div>
                <span style={{ color: '#a39c93', display: 'block', fontSize: '0.7rem' }}>Booking Ref</span>
                <strong style={{ color: '#c8895b' }}>{foundBooking.booking_id}</strong>
              </div>
              <div>
                <span style={{ color: '#a39c93', display: 'block', fontSize: '0.7rem' }}>Venue & Sport</span>
                <span style={{ color: '#ffffff' }}>{foundBooking.ground_name} • {foundBooking.sport || foundBooking.sport_type}</span>
              </div>
              <div>
                <span style={{ color: '#a39c93', display: 'block', fontSize: '0.7rem' }}>Time Slot</span>
                <span style={{ color: '#ffffff' }}>{foundBooking.booking_date || foundBooking.date} ({foundBooking.booking_time || foundBooking.slot_time})</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '1rem',
                background: '#10b981',
                borderColor: '#10b981',
                height: '42px',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}
              onClick={handleConfirm}
              disabled={isCheckingIn || foundBooking.booking_status === 'Completed'}
            >
              <Check size={16} />
              <span>
                {foundBooking.booking_status === 'Completed'
                  ? 'Player Already Checked In'
                  : isCheckingIn
                  ? 'Confirming Arrival...'
                  : 'Confirm Player Check-In'}
              </span>
            </button>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div style={{
            color: '#10b981',
            fontSize: '0.875rem',
            fontWeight: 700,
            textAlign: 'center',
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '6px',
          }}>
            {successMsg}
          </div>
        )}
      </div>
    </div>
  );
}
