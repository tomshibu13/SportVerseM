import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  User, 
  Clock, 
  MapPin, 
  Scan, 
  Camera, 
  CameraOff, 
  Upload, 
  RefreshCw, 
  AlertCircle,
  Sparkles,
  SwitchCamera,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';
import { checkInBookingApi, fetchMyBookings } from '../services/api';

export default function CheckInPage() {
  const [inputCode, setInputCode] = useState('');
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [liveBookings, setLiveBookings] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const isScanningLockRef = useRef(false);

  // Load bookings for quick simulations
  useEffect(() => {
    fetchMyBookings().then(data => {
      if (Array.isArray(data)) {
        setLiveBookings(data);
      }
    }).catch(() => {});

    // Cleanup camera when navigating away
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping QR camera:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
  };

  const startCamera = async (facingMode = cameraFacing) => {
    setCameraError('');
    setIsStartingCamera(true);
    isScanningLockRef.current = false;

    try {
      // Ensure any previous instance is stopped
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (_) {}
      }

      const qrReaderElement = document.getElementById('station-qr-video-reader');
      if (!qrReaderElement) {
        throw new Error('Camera viewfinder element not found in DOM.');
      }

      const qrCode = new Html5Qrcode('station-qr-video-reader');
      html5QrCodeRef.current = qrCode;

      const qrSuccessCallback = async (decodedText) => {
        if (isScanningLockRef.current) return;
        isScanningLockRef.current = true;
        if (decodedText) {
          await stopCamera(); // Stop camera immediately after single scan
          handleScan(decodedText);
        }
      };

      const qrConfig = {
        fps: 15,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.333333,
      };

      await qrCode.start(
        { facingMode: facingMode },
        qrConfig,
        qrSuccessCallback,
        () => {} // silent frame scanning error callback
      );

      setIsCameraActive(true);
      setIsStartingCamera(false);
    } catch (err) {
      console.warn('Failed to start camera scanner:', err);
      setIsCameraActive(false);
      setIsStartingCamera(false);
      isScanningLockRef.current = false;
      
      let msg = 'Could not access device camera. Please grant camera permission in your browser, or upload a QR image below.';
      if (err.name === 'NotAllowedError' || String(err).includes('Permission denied') || String(err).includes('NotAllowedError')) {
        msg = '🔒 Camera permission was denied. Please click the lock/camera icon in your browser address bar to allow camera access.';
      } else if (err.name === 'NotFoundError' || String(err).includes('NotFoundError')) {
        msg = '📷 No camera hardware detected on this device. You can verify players using manual Booking ID entry or image upload.';
      } else if (String(err).includes('secure context') || (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
        msg = '⚠️ Web camera requires HTTPS or localhost context.';
      }
      setCameraError(msg);
    }
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      await stopCamera();
      await startCamera(nextFacing);
    }
  };

  const handleScan = async (code) => {
    const bk = (code || inputCode).trim();
    if (!bk) return;
    
    // Always stop camera before processing result
    await stopCamera();

    setScanning(true);
    setResult(null);

    try {
      const res = await checkInBookingApi(bk);
      setScanning(false);
      
      const b = res.booking || {};
      const bookingDetail = {
        name: b.user_name || 'Verified Player',
        court: b.ground_name || 'Sports Arena',
        time: b.slot_time || b.booking_time || 'Booked Slot',
        sport: b.sport_type || b.sport || 'Sports',
        status: b.booking_status || 'Completed',
        totalPrice: b.total_price || 0,
      };

      if (!res.success || res.expired || res.alreadyCheckedIn) {
        // EXPIRED OR DUPLICATE SCAN
        const msg = res.message || `⚠️ QR Pass Expired! Pass #${b.booking_id || bk} has ALREADY been scanned and used.`;
        setResult({
          status: 'expired',
          message: msg,
          code: b.booking_id || bk,
          booking: b.booking_id ? bookingDetail : null,
        });

        setLog(prev => [{
          id: b.booking_id || bk,
          name: b.booking_id ? `${bookingDetail.name} (Expired QR)` : 'Invalid Pass',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'expired',
          sport: bookingDetail.sport,
        }, ...prev]);
      } else {
        // FIRST TIME APPROVED ENTRY
        setResult({
          status: 'success',
          message: res.message || '✅ Player verified! Entry approved. QR ticket is now EXPIRED.',
          code: b.booking_id || bk,
          booking: bookingDetail,
        });

        setLog(prev => [{
          id: b.booking_id || bk,
          name: bookingDetail.name,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'success',
          sport: bookingDetail.sport,
        }, ...prev]);
      }

      setInputCode('');
    } catch (err) {
      setScanning(false);
      const errMsg = err.message || `Booking ID "${bk}" not found in system.`;
      setResult({ status: 'failed', message: errMsg, code: bk });
      setLog(prev => [{
        id: bk,
        name: 'Unknown Player',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'failed',
        sport: '—',
      }, ...prev]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setCameraError('');
    setResult(null);
    setScanning(true);

    try {
      const scanner = new Html5Qrcode('station-qr-file-helper');
      const decodedText = await scanner.scanFile(file, true);
      scanner.clear();
      await handleScan(decodedText);
    } catch (err) {
      setScanning(false);
      setResult({
        status: 'failed',
        message: 'Could not detect a valid QR code in the uploaded image. Please try another image or enter the Booking ID manually.',
        code: 'Image Upload',
      });
    }
  };

  const simulateScan = async () => {
    setScanning(true);
    setResult(null);
    try {
      const data = await fetchMyBookings();
      const active = Array.isArray(data) ? data.filter(b => b.booking_status !== 'Cancelled') : [];
      if (active.length > 0) {
        const rand = active[Math.floor(Math.random() * active.length)];
        const code = rand.qr_code || rand.booking_id;
        setInputCode(rand.booking_id || code);
        setTimeout(() => {
          handleScan(code);
        }, 800);
      } else {
        setInputCode('SPV-BK-9821');
        setTimeout(() => {
          handleScan('SPV-BK-9821');
        }, 800);
      }
    } catch (_) {
      setInputCode('SPV-BK-9821');
      setTimeout(() => {
        handleScan('SPV-BK-9821');
      }, 800);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hidden container for file scanning helper */}
      <div id="station-qr-file-helper" style={{ display: 'none' }} />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e8f5f1', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Scan size={24} color="#10b981" />
            <span>Live Gate QR Check-In Scanner</span>
          </h2>
          <p style={{ color: '#7fb3a0', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Use your device camera or barcode scanner to instantly verify player entry tickets
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${isCameraActive ? 'btn-secondary' : 'btn-primary'}`}
            onClick={isCameraActive ? stopCamera : () => startCamera()}
            disabled={isStartingCamera}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            {isStartingCamera ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Initializing Camera...</span>
              </>
            ) : isCameraActive ? (
              <>
                <CameraOff size={16} color="#ef4444" />
                <span>Stop Camera</span>
              </>
            ) : (
              <>
                <Camera size={16} />
                <span>Open Live Camera</span>
              </>
            )}
          </button>

          {isCameraActive && (
            <button
              className="btn btn-secondary"
              onClick={toggleCameraFacing}
              title="Switch between front/back camera"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <SwitchCamera size={16} color="#10b981" />
              <span>{cameraFacing === 'environment' ? 'Rear Cam' : 'Front Cam'}</span>
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Upload size={16} color="#7fb3a0" />
            <span>Upload QR Image</span>
          </button>
        </div>
      </div>

      {/* Main Scanner Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Live Camera Viewfinder & Controls */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Viewfinder Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1.33 / 1',
            background: '#050a0a',
            border: isCameraActive ? '2px solid #10b981' : '2px dashed rgba(16,185,129,0.3)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: isCameraActive ? '0 0 30px rgba(16,185,129,0.2)' : 'none',
          }}>
            {/* Real HTML5 QR Camera Element */}
            <div 
              id="station-qr-video-reader" 
              style={{ 
                width: '100%', 
                height: '100%', 
                display: isCameraActive ? 'block' : 'none',
                borderRadius: '12px',
                overflow: 'hidden'
              }} 
            />

            {/* Inactive Camera State with CTA */}
            {!isCameraActive && !scanning && !result && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '2rem',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '18px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Camera size={34} color="#10b981" />
                </div>
                <h4 style={{ color: '#e8f5f1', fontSize: '1.1rem', fontWeight: 800 }}>Camera Viewfinder Idle</h4>
                <p style={{ color: '#7fb3a0', fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.5 }}>
                  Click below to activate your webcam or phone camera to scan player QR tickets live at the gate.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => startCamera()}
                  disabled={isStartingCamera}
                  style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem' }}
                >
                  <Camera size={16} />
                  <span>Start Camera Now</span>
                </button>
              </div>
            )}

            {/* Scanning Laser Beam Overlay */}
            {isCameraActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '240px',
                  height: '240px',
                  border: '2px solid rgba(16, 185, 129, 0.6)',
                  borderRadius: '16px',
                  position: 'relative',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                    boxShadow: '0 0 12px #10b981',
                    animation: 'scanLine 1.8s ease-in-out infinite',
                  }} />
                  <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid #10b981', borderLeft: '4px solid #10b981', borderRadius: '4px 0 0 0' }} />
                  <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid #10b981', borderRight: '4px solid #10b981', borderRadius: '0 4px 0 0' }} />
                  <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #10b981', borderLeft: '4px solid #10b981', borderRadius: '0 0 0 4px' }} />
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #10b981', borderRight: '4px solid #10b981', borderRadius: '0 0 4px 0' }} />
                </div>
              </div>
            )}

            {/* Simulating scan placeholder */}
            {scanning && !isCameraActive && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '180px', height: '180px',
                  border: '3px solid #10b981', borderRadius: '12px',
                  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, #10b981, transparent)', animation: 'scanLine 1.4s ease-in-out infinite' }} />
                  <QrCode size={64} color="rgba(16,185,129,0.4)" />
                </div>
                <p style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>Verifying Ticket in MongoDB...</p>
              </div>
            )}
          </div>

          {/* Camera Error Alert */}
          {cameraError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              color: '#f87171',
              fontSize: '0.825rem',
              lineHeight: 1.4,
            }}>
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Camera Notice:</strong> {cameraError}
              </div>
            </div>
          )}

          {/* Verification Result Banner */}
          {result && (
            <div style={{
              background: result.status === 'success' 
                ? 'rgba(16, 185, 129, 0.12)' 
                : (result.status === 'expired' || result.status === 'already_scanned')
                ? 'rgba(245, 158, 11, 0.14)'
                : 'rgba(239, 68, 68, 0.12)',
              border: result.status === 'success' 
                ? '1px solid rgba(16, 185, 129, 0.35)' 
                : (result.status === 'expired' || result.status === 'already_scanned')
                ? '1px solid rgba(245, 158, 11, 0.45)'
                : '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}>
              {(result.status === 'expired' || result.status === 'already_scanned') ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                    <AlertTriangle size={26} color="#f59e0b" />
                    <div>
                      <h4 style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1.05rem' }}>QR Pass Expired / Already Used</h4>
                      <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontFamily: 'monospace' }}>Booking #{result.code}</span>
                    </div>
                  </div>

                  <p style={{ color: '#d97706', fontSize: '0.85rem', marginBottom: '0.85rem', fontWeight: 600 }}>
                    {result.message}
                  </p>

                  {result.booking && (
                    <div style={{
                      background: 'rgba(6, 13, 13, 0.85)',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.6rem',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                    }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Player Name</span>
                        <div style={{ fontWeight: 800, color: '#e8f5f1', fontSize: '0.9rem' }}>{result.booking.name}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Pass Status</span>
                        <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.9rem' }}>EXPIRED / USED</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Venue</span>
                        <div style={{ fontWeight: 600, color: '#e8f5f1', fontSize: '0.85rem' }}>{result.booking.court}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Slot Time</span>
                        <div style={{ fontWeight: 600, color: '#e8f5f1', fontSize: '0.85rem' }}>{result.booking.time}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : result.status === 'success' ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                    <CheckCircle2 size={24} color="#10b981" />
                    <div>
                      <h4 style={{ color: '#10b981', fontWeight: 800, fontSize: '1.05rem' }}>{result.message}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#7fb3a0', fontFamily: 'monospace' }}>Booking #{result.code}</span>
                    </div>
                  </div>

                  {result.booking && (
                    <div style={{
                      background: 'rgba(6, 13, 13, 0.8)',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.6rem',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#7fb3a0' }}>Player Name</span>
                        <div style={{ fontWeight: 800, color: '#e8f5f1', fontSize: '0.9rem' }}>{result.booking.name}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#7fb3a0' }}>Arena / Court</span>
                        <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem' }}>{result.booking.court}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#7fb3a0' }}>Time Slot</span>
                        <div style={{ fontWeight: 600, color: '#e8f5f1', fontSize: '0.85rem' }}>{result.booking.time}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#7fb3a0' }}>Sport Category</span>
                        <div style={{ fontWeight: 600, color: '#e8f5f1', fontSize: '0.85rem' }}>{result.booking.sport}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <XCircle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ color: '#ef4444', fontWeight: 800, fontSize: '1rem' }}>Ticket Verification Failed</h4>
                    <p style={{ color: '#7fb3a0', fontSize: '0.825rem', marginTop: '0.25rem' }}>{result.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Entry Form */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              className="form-input"
              placeholder="Enter Booking ID (e.g. SPV-BK-2502)"
              value={inputCode}
              onChange={e => setInputCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={() => handleScan()} disabled={scanning}>
              <Scan size={16} />
              <span>Verify Entry</span>
            </button>
          </div>

          {/* Action Helper Shortcuts */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={simulateScan} disabled={scanning}>
              <Sparkles size={16} color="#10b981" />
              <span>{scanning ? 'Scanning...' : 'Test Active Booking'}</span>
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setResult(null); setInputCode(''); }}>
              <XCircle size={16} />
              <span>Clear Result</span>
            </button>
          </div>
        </div>

        {/* Right Column: Check-In Log & Gate Metrics */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card-header">
            <span className="card-title">
              <Clock size={16} color="#10b981" />
              <span>Today's Gate Check-in Log</span>
            </span>
            <span className="badge badge-green">Live Gate</span>
          </div>

          {/* KPI Mini Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '0.65rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>
                {log.filter(l => l.status === 'success').length}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#7fb3a0', fontWeight: 600 }}>Checked In</div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '0.65rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b' }}>
                {log.filter(l => l.status === 'expired' || l.status === 'already_scanned').length}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>Expired QR</div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '0.65rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ef4444' }}>
                {log.filter(l => l.status === 'failed').length}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#7fb3a0', fontWeight: 600 }}>Denied / Not Found</div>
            </div>
          </div>

          {/* Log Items Stream */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '420px' }}>
            {log.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#7fb3a0' }}>
                <p style={{ fontSize: '0.85rem' }}>No check-in entries recorded today yet.</p>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Scanned player tickets will appear here live.</span>
              </div>
            ) : (
              log.map((entry, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem', borderRadius: '10px',
                  background: entry.status === 'success' 
                    ? 'rgba(16,185,129,0.05)' 
                    : (entry.status === 'expired' || entry.status === 'already_scanned')
                    ? 'rgba(245,158,11,0.06)'
                    : 'rgba(239,68,68,0.05)',
                  border: `1px solid ${
                    entry.status === 'success' 
                      ? 'rgba(16,185,129,0.15)' 
                      : (entry.status === 'expired' || entry.status === 'already_scanned')
                      ? 'rgba(245,158,11,0.25)'
                      : 'rgba(239,68,68,0.15)'
                  }`,
                }}>
                  {entry.status === 'success' ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : (entry.status === 'expired' || entry.status === 'already_scanned') ? (
                    <AlertTriangle size={18} color="#f59e0b" />
                  ) : (
                    <XCircle size={18} color="#ef4444" />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#e8f5f1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.name}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#7fb3a0' }}>
                      {entry.id} • {entry.sport}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#4a7a6a', whiteSpace: 'nowrap' }}>
                    {entry.time}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 0; } 50% { top: calc(100% - 3px); } 100% { top: 0; }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        #station-qr-video-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
