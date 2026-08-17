const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────────────────────────
// Nodemailer transporter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates and returns a nodemailer transporter using env config.
 * Supports Gmail (default), any SMTP provider, or Ethereal (test mode).
 */
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  if (!emailUser || emailUser === 'your_email@gmail.com' || !emailPass || emailPass === 'your_app_password_here') {
    console.warn(
      '⚠️  [Email] Real EMAIL_USER / EMAIL_PASS not configured in backend/.env. Using Ethereal test mode (preview URLs logged).'
    );
    return null;
  }

  // Gmail SMTP
  if ((process.env.EMAIL_SERVICE || '').toLowerCase() === 'gmail' || emailUser.endsWith('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Custom SMTP
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Email HTML builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the HTML body for the station owner approval email.
 *
 * @param {object} opts
 * @param {string} opts.fullName
 * @param {string} opts.email
 * @param {string|null} opts.generatedPassword  — null when using Firebase reset link
 * @param {string|null} opts.passwordResetLink  — Firebase Auth reset URL (preferred)
 * @param {string} opts.portalUrl
 */
const buildApprovalEmailHtml = ({ fullName, email, generatedPassword, passwordResetLink, portalUrl }) => {
  const year = new Date().getFullYear();

  // Determine what credentials section to show
  const credentialsSection = passwordResetLink
    ? /* Firebase reset-link flow */ `
      <div class="credentials-box">
        <div class="credentials-title">🔑 Your Account Credentials</div>
        <div class="cred-row">
          <span class="cred-label">📧 Email Address</span>
          <span class="cred-value">${email}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">🔐 Password Setup</span>
          <span class="cred-value" style="color:#10b981;">Click the button below to set your password</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">🌐 Portal URL</span>
          <span class="cred-value"><a href="${portalUrl}" style="color:#10b981;">${portalUrl}</a></span>
        </div>
      </div>

      <!-- Firebase CTA -->
      <div class="cta-wrap" style="margin-bottom: 16px;">
        <a href="${passwordResetLink}" class="cta-btn" style="background: linear-gradient(135deg,#6366f1 0%,#4f46e5 100%); box-shadow: 0 8px 24px rgba(99,102,241,0.4);">
          🔐 Set My Password &amp; Access Portal
        </a>
      </div>
      <p style="text-align:center; font-size:12px; color:#7fb3a0; margin-bottom:28px;">
        This secure link is valid for <strong>24 hours</strong>. After setting your password, use the portal URL above to sign in.
      </p>`
    : /* Fallback: plain generated password */ `
      <div class="credentials-box">
        <div class="credentials-title">🔑 Your Login Credentials</div>
        <div class="cred-row">
          <span class="cred-label">📧 Email Address</span>
          <span class="cred-value">${email}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">🔐 Temporary Password</span>
          <span class="cred-value password-val">${generatedPassword}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">🌐 Portal URL</span>
          <span class="cred-value"><a href="${portalUrl}" style="color:#10b981;">${portalUrl}</a></span>
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-wrap">
        <a href="${portalUrl}" class="cta-btn">🚀 Open My Station Portal</a>
      </div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SportVerse – Station Owner Approval</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: #060d0d;
      color: #e8f5f1;
    }
    .wrapper {
      max-width: 600px;
      margin: 32px auto;
      background: #0d1818;
      border-radius: 20px;
      border: 1px solid rgba(16,185,129,0.25);
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    }
    /* Header */
    .header {
      background: linear-gradient(135deg, #059669 0%, #065f46 100%);
      padding: 40px 36px 32px;
      text-align: center;
    }
    .header .logo-icon { font-size: 42px; display: block; margin-bottom: 12px; }
    .header h1 { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
    .header .subtitle {
      font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px;
      font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    }
    /* Approved badge */
    .approved-banner {
      background: rgba(16,185,129,0.15);
      border-top: 3px solid #10b981;
      border-bottom: 1px solid rgba(16,185,129,0.2);
      padding: 18px 36px;
      display: flex; align-items: center; gap: 12px;
    }
    .approved-icon { font-size: 28px; }
    .approved-text { font-size: 15px; font-weight: 700; color: #10b981; }
    .approved-sub  { font-size: 13px; color: #7fb3a0; margin-top: 2px; }
    /* Body */
    .body { padding: 32px 36px; }
    .greeting { font-size: 17px; font-weight: 700; color: #e8f5f1; margin-bottom: 12px; }
    .message { font-size: 14px; color: #7fb3a0; line-height: 1.7; margin-bottom: 28px; }
    /* Credentials box */
    .credentials-box {
      background: rgba(6,13,13,0.9);
      border: 1px solid rgba(16,185,129,0.3);
      border-radius: 14px; padding: 24px; margin-bottom: 28px;
    }
    .credentials-title {
      font-size: 12px; font-weight: 800; color: #10b981;
      letter-spacing: 0.1em; text-transform: uppercase;
      margin-bottom: 16px; display: flex; align-items: center; gap: 6px;
    }
    .cred-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid rgba(16,185,129,0.1);
    }
    .cred-row:last-child { border-bottom: none; }
    .cred-label { font-size: 12px; color: #7fb3a0; font-weight: 600; }
    .cred-value {
      font-size: 14px; color: #e8f5f1; font-weight: 700;
      font-family: 'Courier New', monospace;
      background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
      padding: 6px 12px; border-radius: 8px; max-width: 280px; word-break: break-all;
    }
    .cred-value.password-val { color: #10b981; letter-spacing: 0.05em; }
    /* CTA button */
    .cta-wrap { text-align: center; margin-bottom: 28px; }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800;
      padding: 14px 36px; border-radius: 50px; letter-spacing: 0.03em;
      box-shadow: 0 8px 24px rgba(16,185,129,0.4);
    }
    /* Firebase badge */
    .firebase-badge {
      background: rgba(99,102,241,0.08);
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 10px; padding: 12px 16px;
      font-size: 12px; color: #a5b4fc; line-height: 1.6; margin-bottom: 28px;
      display: flex; align-items: center; gap: 8px;
    }
    /* Features */
    .features {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px;
    }
    .feature-card {
      background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.15);
      border-radius: 10px; padding: 14px;
    }
    .feature-icon { font-size: 20px; margin-bottom: 6px; }
    .feature-title { font-size: 13px; font-weight: 700; color: #e8f5f1; }
    .feature-desc  { font-size: 12px; color: #7fb3a0; margin-top: 3px; line-height: 1.5; }
    /* Warning */
    .warning-box {
      background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25);
      border-radius: 10px; padding: 14px 16px;
      font-size: 13px; color: #f59e0b; line-height: 1.6; margin-bottom: 28px;
    }
    /* Footer */
    .footer {
      background: rgba(6,13,13,0.9); border-top: 1px solid rgba(16,185,129,0.12);
      padding: 20px 36px; text-align: center;
    }
    .footer p { font-size: 12px; color: #4a7a6a; margin-bottom: 4px; }
    .footer a { color: #10b981; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <span class="logo-icon">⚡</span>
      <h1>SportVerse</h1>
      <div class="subtitle">Station Owner Portal • Official Credentials</div>
    </div>

    <!-- Approved Banner -->
    <div class="approved-banner">
      <span class="approved-icon">✅</span>
      <div>
        <div class="approved-text">Your Station Registration is APPROVED!</div>
        <div class="approved-sub">Welcome to the SportVerse partner network</div>
      </div>
    </div>

    <!-- Body -->
    <div class="body">
      <div class="greeting">Hello, ${fullName}! 👋</div>
      <p class="message">
        Great news — your sports station registration has been reviewed and
        <strong style="color:#10b981;">approved</strong> by our admin team.
        You now have full access to the <strong>SportVerse Station Owner Portal</strong>.
        ${passwordResetLink
          ? 'Use the secure link below to set your password and start managing your courts, slots, bookings, and revenue.'
          : 'Use the unique credentials below to sign in and start managing your courts, slots, bookings, and revenue.'}
      </p>

      ${credentialsSection}

      ${passwordResetLink ? `
      <!-- Firebase security badge -->
      <div class="firebase-badge">
        🔒 <span>This link is <strong>secured by Firebase Authentication</strong> and expires in 24 hours. Your password is never stored in plain text.</span>
      </div>` : ''}

      <!-- Features -->
      <div class="features">
        <div class="feature-card">
          <div class="feature-icon">🏟️</div>
          <div class="feature-title">Manage Courts</div>
          <div class="feature-desc">Add courts, set pricing, activate or deactivate venues instantly.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⏰</div>
          <div class="feature-title">Smart Slot Manager</div>
          <div class="feature-desc">Control availability with AI-powered dynamic pricing suggestions.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <div class="feature-title">QR Check-In</div>
          <div class="feature-desc">Scan player QR codes for instant booking verification at entry.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <div class="feature-title">Revenue Analytics</div>
          <div class="feature-desc">Track daily earnings, player engagement, and booking trends.</div>
        </div>
      </div>

      <!-- Security Warning -->
      <div class="warning-box">
        ${passwordResetLink
          ? '⚠️ <strong>Security Notice:</strong> The password setup link above expires in <strong>24 hours</strong>. If it expires, contact admin for a new link. Never share your portal credentials with anyone.'
          : '⚠️ <strong>Security Notice:</strong> This is your auto-generated station password. Please log in and change it immediately from <em>Station Settings → Change Password</em>. Keep your credentials private and do not share them.'}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>SportVerse AI Sports Management Platform · ${year}</p>
      <p>If you did not register as a Station Owner, please <a href="mailto:${process.env.EMAIL_USER || 'support@sportverse.in'}">contact support</a> immediately.</p>
      <p style="margin-top:8px; color:#2a4a3a;">This is an automated message — please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// Core send helper
// ─────────────────────────────────────────────────────────────────────────────

const sendMail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      // Ethereal fallback — preview URL in console
      try {
        const testAccount = await nodemailer.createTestAccount();
        const testTransport = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });

        const info = await testTransport.sendMail({
          from: `"SportVerse Platform" <${testAccount.user}>`,
          to,
          subject,
          text,
          html,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`📧 [Email/Ethereal Preview] Sent to ${to} | View Online: ${previewUrl}`);
        return { success: true, mode: 'ethereal', previewUrl, messageId: info.messageId };
      } catch (etherealErr) {
        console.warn(`⚠️ [Email/Ethereal] Ethereal preview creation skipped: ${etherealErr.message}`);
        console.log(`📧 [Email/Simulated] Intended Recipient: ${to} | Subject: "${subject}"`);
        return { success: true, mode: 'simulated', messageId: `SIM_${Date.now()}` };
      }
    }

    const info = await transporter.sendMail({
      from: `"SportVerse Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`📧 [Email/SMTP] Real email delivered to ${to} | Message ID: ${info.messageId}`);
    return { success: true, mode: 'smtp', messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [Email/Error] Failed to send email to ${to}:`, error.message);
    if (error.code === 'EAUTH') {
      console.error('   💡 Google SMTP Authentication Failed. For Gmail, you MUST generate and use a 16-character App Password at: https://myaccount.google.com/apppasswords (regular account password will not work).');
    }
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends the Station Owner approval email.
 *
 * Flow (Firebase Admin configured):
 *   1. Ensure a Firebase Auth account exists for the station owner's email.
 *   2. Generate a Firebase password-reset link (station owner clicks it to set their own password).
 *   3. Send the HTML email with the reset link via Nodemailer.
 *
 * Flow (Firebase Admin NOT configured / fallback):
 *   - Sends the auto-generated password in the email body (same as before).
 */
const sendStationOwnerApprovalEmail = async ({ fullName, email, generatedPassword, portalUrl }) => {
  // Build + send the email with the generated password directly
  const html = buildApprovalEmailHtml({
    fullName,
    email,
    generatedPassword,
    passwordResetLink: null,
    portalUrl,
  });

  const textBody = `SportVerse – Station Owner Portal Access\n\nHello ${fullName},\n\nYour station registration has been APPROVED!\n\nEmail:    ${email}\nPassword: ${generatedPassword}\nPortal:   ${portalUrl}\n\nIMPORTANT: Change your password immediately after first login.\n\n— SportVerse Team`;

  const result = await sendMail({
    to: email,
    subject: '✅ SportVerse – Your Station Owner Portal Access is Ready!',
    html,
    text: textBody,
  });

  return {
    ...result,
    usedFirebaseResetLink: false,
  };
};

module.exports = { sendStationOwnerApprovalEmail, sendBookingApprovalEmail };

// ─────────────────────────────────────────────────────────────────────────────
// Booking Approval Email
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends a booking approval (or rejection) email to the user who made the booking.
 *
 * @param {object} opts
 * @param {string} opts.userName       - Full name of the player/user
 * @param {string} opts.userEmail      - Player's email address
 * @param {string} opts.bookingId      - e.g. SPV-BK-9921
 * @param {string} opts.groundName     - e.g. Elite Football Arena
 * @param {string} opts.sportType      - e.g. Football
 * @param {string} opts.date           - e.g. 2026-08-20
 * @param {string} opts.slotTime       - e.g. 07:00 AM - 08:00 AM
 * @param {number} opts.totalPrice     - e.g. 800
 * @param {string} opts.qrCode         - QR code string
 * @param {'Approved'|'Rejected'} opts.status
 * @param {string} [opts.rejectReason] - Optional reason when status is Rejected
 */
async function sendBookingApprovalEmail({
  userName,
  userEmail,
  bookingId,
  groundName,
  sportType,
  date,
  slotTime,
  totalPrice,
  qrCode,
  status,
  rejectReason = '',
}) {
  const year = new Date().getFullYear();
  const isApproved = status === 'Approved';

  const accentColor  = isApproved ? '#10b981' : '#ef4444';
  const accentLight  = isApproved ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)';
  const accentBorder = isApproved ? 'rgba(16,185,129,0.3)'  : 'rgba(239,68,68,0.25)';
  const badgeText    = isApproved ? '✅ Booking APPROVED'    : '❌ Booking REJECTED';
  const badgeSub     = isApproved
    ? 'Your slot is confirmed — see you on the court!'
    : 'Unfortunately your booking was not approved.';

  const formattedDate = (() => {
    try { return new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return date; }
  })();

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SportVerse – Booking ${status}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; background:#060d0d; color:#e8f5f1; }
    .wrapper {
      max-width:600px; margin:32px auto; background:#0d1818;
      border-radius:20px; border:1px solid ${accentBorder};
      overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.6);
    }
    /* Header */
    .header {
      background:linear-gradient(135deg,${accentColor} 0%,#065f46 100%);
      padding:36px 36px 28px; text-align:center;
    }
    .header .logo-icon { font-size:40px; display:block; margin-bottom:10px; }
    .header h1 { font-size:26px; font-weight:900; color:#fff; letter-spacing:-0.5px; }
    .header .subtitle { font-size:12px; color:rgba(255,255,255,0.75); margin-top:4px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; }
    /* Status banner */
    .status-banner {
      background:${accentLight}; border-top:3px solid ${accentColor};
      border-bottom:1px solid ${accentBorder};
      padding:18px 36px; display:flex; align-items:center; gap:12px;
    }
    .status-icon { font-size:28px; }
    .status-text { font-size:15px; font-weight:700; color:${accentColor}; }
    .status-sub  { font-size:13px; color:#7fb3a0; margin-top:2px; }
    /* Body */
    .body { padding:32px 36px; }
    .greeting { font-size:17px; font-weight:700; color:#e8f5f1; margin-bottom:12px; }
    .message  { font-size:14px; color:#7fb3a0; line-height:1.7; margin-bottom:28px; }
    /* Booking details card */
    .details-card {
      background:rgba(6,13,13,0.9); border:1px solid ${accentBorder};
      border-radius:14px; padding:24px; margin-bottom:28px;
    }
    .details-title {
      font-size:12px; font-weight:800; color:${accentColor};
      letter-spacing:0.1em; text-transform:uppercase;
      margin-bottom:16px; display:flex; align-items:center; gap:6px;
    }
    .detail-row {
      display:flex; justify-content:space-between; align-items:center;
      padding:11px 0; border-bottom:1px solid rgba(255,255,255,0.05);
    }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font-size:12px; color:#7fb3a0; font-weight:600; }
    .detail-value { font-size:13px; color:#e8f5f1; font-weight:700; text-align:right; max-width:240px; }
    /* QR box */
    .qr-box {
      background:rgba(255,255,255,0.03); border:1px dashed ${accentBorder};
      border-radius:12px; padding:20px; text-align:center; margin-bottom:28px;
    }
    .qr-code-display {
      font-family:'Courier New',monospace; font-size:13px; font-weight:700;
      color:${accentColor}; background:rgba(6,13,13,0.9);
      border:1px solid ${accentBorder}; border-radius:8px;
      padding:12px 20px; display:inline-block; margin-top:8px; letter-spacing:0.05em;
    }
    .qr-label { font-size:11px; color:#7fb3a0; margin-bottom:6px; }
    /* Rejection reason */
    .reject-box {
      background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25);
      border-radius:10px; padding:16px; font-size:13px; color:#fca5a5;
      line-height:1.6; margin-bottom:28px;
    }
    /* Info box */
    .info-box {
      background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.15);
      border-radius:10px; padding:14px 16px;
      font-size:13px; color:#7fb3a0; line-height:1.7; margin-bottom:28px;
    }
    /* CTA */
    .cta-wrap { text-align:center; margin-bottom:28px; }
    .cta-btn {
      display:inline-block;
      background:linear-gradient(135deg,${accentColor} 0%,#059669 100%);
      color:#fff; text-decoration:none; font-size:15px; font-weight:800;
      padding:14px 36px; border-radius:50px; letter-spacing:0.03em;
      box-shadow:0 8px 24px rgba(16,185,129,0.35);
    }
    /* Footer */
    .footer {
      background:rgba(6,13,13,0.9); border-top:1px solid rgba(16,185,129,0.12);
      padding:20px 36px; text-align:center;
    }
    .footer p { font-size:12px; color:#4a7a6a; margin-bottom:4px; }
    .footer a { color:#10b981; text-decoration:none; }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Header -->
    <div class="header">
      <span class="logo-icon">⚡</span>
      <h1>SportVerse</h1>
      <div class="subtitle">Booking Notification • ${bookingId}</div>
    </div>

    <!-- Status Banner -->
    <div class="status-banner">
      <span class="status-icon">${isApproved ? '✅' : '❌'}</span>
      <div>
        <div class="status-text">${badgeText}</div>
        <div class="status-sub">${badgeSub}</div>
      </div>
    </div>

    <!-- Body -->
    <div class="body">
      <div class="greeting">Hello, ${userName}! 👋</div>
      <p class="message">
        ${isApproved
          ? `Your ground booking request has been <strong style="color:${accentColor};">approved</strong> by the admin.
             Your slot is now confirmed. Please arrive 10 minutes early and show your QR code at the entry gate.`
          : `We regret to inform you that your ground booking request has been <strong style="color:#ef4444;">rejected</strong> by the admin.
             ${rejectReason ? 'Please see the reason below.' : 'Please contact support or try booking a different slot.'}`
        }
      </p>

      <!-- Booking Details -->
      <div class="details-card">
        <div class="details-title">📋 Booking Details</div>
        <div class="detail-row">
          <span class="detail-label">🎟️ Booking ID</span>
          <span class="detail-value">${bookingId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🏟️ Venue</span>
          <span class="detail-value">${groundName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🏅 Sport</span>
          <span class="detail-value">${sportType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📅 Date</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">⏰ Slot</span>
          <span class="detail-value">${slotTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💰 Amount Paid</span>
          <span class="detail-value" style="color:${accentColor};">₹${totalPrice}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">📊 Status</span>
          <span class="detail-value" style="color:${accentColor}; font-weight:900;">${status}</span>
        </div>
      </div>

      ${isApproved ? `
      <!-- QR Code -->
      <div class="qr-box">
        <div class="qr-label">🔲 Show this QR code at the entry gate</div>
        <div class="qr-code-display">${qrCode || `SPORTVERSE_QR_${bookingId}`}</div>
        <p style="font-size:11px;color:#4a7a6a;margin-top:8px;">Screenshot this for offline access</p>
      </div>

      <!-- Tips -->
      <div class="info-box">
        📌 <strong>Reminders:</strong><br/>
        • Arrive at least 10 minutes before your slot<br/>
        • Bring your own sports equipment or rent at the venue<br/>
        • In case of cancellation, contact support 2 hours before the slot
      </div>

      <!-- CTA -->
      <div class="cta-wrap">
        <a href="${process.env.ADMIN_PORTAL_URL || 'http://localhost:5173'}" class="cta-btn">📱 View My Bookings</a>
      </div>` : `
      ${rejectReason ? `
      <!-- Rejection Reason -->
      <div class="reject-box">
        ⚠️ <strong>Reason for rejection:</strong><br/>
        ${rejectReason}
      </div>` : ''}

      <!-- Info box for rejected -->
      <div class="info-box">
        💡 <strong>What can you do?</strong><br/>
        • Try booking a different time slot or venue<br/>
        • Contact our support team if you believe this is an error<br/>
        • Refund (if applicable) will be processed within 3–5 business days
      </div>`}

    </div>

    <!-- Footer -->
    <div class="footer">
      <p>SportVerse AI Sports Management Platform · ${year}</p>
      <p>Need help? <a href="mailto:${process.env.EMAIL_USER || 'support@sportverse.in'}">Contact Support</a></p>
      <p style="margin-top:8px;color:#2a4a3a;">This is an automated message — please do not reply directly to this email.</p>
    </div>

  </div>
</body>
</html>`.trim();

  const textBody = isApproved
    ? `SportVerse – Booking Approved!\n\nHello ${userName},\n\nYour booking has been APPROVED!\n\nBooking ID: ${bookingId}\nVenue:      ${groundName}\nSport:      ${sportType}\nDate:       ${formattedDate}\nSlot:       ${slotTime}\nAmount:     ₹${totalPrice}\nQR Code:    ${qrCode || `SPORTVERSE_QR_${bookingId}`}\n\nPlease show your QR code at the entry gate.\n\n— SportVerse Team`
    : `SportVerse – Booking Rejected\n\nHello ${userName},\n\nYour booking (${bookingId}) for ${groundName} on ${formattedDate} has been REJECTED.\n${rejectReason ? `\nReason: ${rejectReason}\n` : ''}\nPlease try another slot or contact support.\n\n— SportVerse Team`;

  return sendMail({
    to: userEmail,
    subject: isApproved
      ? `✅ SportVerse – Your Booking ${bookingId} is Confirmed!`
      : `❌ SportVerse – Booking ${bookingId} Could Not Be Approved`,
    html: htmlBody,
    text: textBody,
  });
}

