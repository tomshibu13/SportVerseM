import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Calendar, Clock, MapPin, CheckCircle2, Ticket, Download, ShieldCheck } from 'lucide-react';

export default function BookingQRModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  const qrString = booking.qr_code || `SPORTVERSE_QR_${booking.booking_id}`;
  const isCompleted = booking.booking_status === 'Completed';
  const isCancelled = booking.booking_status === 'Cancelled';

  const handleDownload = () => {
    const svg = document.getElementById('booking-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `SportVerse_Pass_${booking.booking_id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px', padding: '1.75rem', background: '#141210', border: '1px solid rgba(200, 137, 91, 0.4)', borderRadius: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(200, 137, 91, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ticket size={20} color="#c8895b" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Digital Entry Pass</h3>
              <span style={{ fontSize: '0.75rem', color: '#a39c93' }}>SportVerse Gate Verification</span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a39c93' }}>
            <X size={20} />
          </button>
        </div>

        {/* Ticket Container */}
        <div style={{
          background: 'linear-gradient(180deg, #1f1c19 0%, #12100e 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1.5rem',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          position: 'relative',
        }}>
          {/* Status Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <span className={`badge ${isCompleted ? 'badge-green' : isCancelled ? 'badge-red' : 'badge-gold'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
              {isCompleted ? '✓ Checked In (Completed)' : isCancelled ? '✕ Cancelled' : '● Valid Gate Pass'}
            </span>
          </div>

          {/* Real QR Code Box */}
          <div style={{
            background: '#ffffff',
            padding: '16px',
            borderRadius: '14px',
            display: 'inline-block',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            marginBottom: '1rem',
          }}>
            <QRCodeSVG
              id="booking-qr-svg"
              value={qrString}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* QR Text Code */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#c8895b',
            display: 'inline-block',
            marginBottom: '1.25rem',
            letterSpacing: '0.04em',
          }}>
            {qrString}
          </div>

          {/* Ticket Details */}
          <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.15)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a39c93' }}>Player Name:</span>
              <strong style={{ color: '#ffffff' }}>{booking.user_name || 'Player'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a39c93' }}>Arena / Court:</span>
              <strong style={{ color: '#ffffff' }}>{booking.ground_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a39c93' }}>Sport:</span>
              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{booking.sport || booking.sport_type || 'Football'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a39c93' }}>Schedule:</span>
              <strong style={{ color: '#c8895b' }}>{booking.date || booking.booking_date} ({booking.booking_time || booking.slot_time})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a39c93' }}>Total Paid:</span>
              <strong style={{ color: '#10b981' }}>₹{booking.total_price}</strong>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" style={{ flex: 1.2, gap: '0.4rem' }} onClick={handleDownload}>
            <Download size={15} />
            <span>Save QR Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
}
