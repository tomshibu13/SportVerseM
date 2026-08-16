/**
 * Firebase Admin SDK Initialization
 *
 * Reads service account credentials from environment variables.
 * Set FIREBASE_SERVICE_ACCOUNT_JSON in .env (full JSON string) OR
 * set individual fields: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 *
 * To obtain credentials:
 *   Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

let firebaseApp = null;

const initFirebaseAdmin = () => {
  if (firebaseApp) return firebaseApp;

  try {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      // Option A: Full JSON string in env
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = cert(serviceAccount);
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      // Option B: Individual fields (private key newlines escaped as \n in .env)
      credential = cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    } else {
      console.warn(
        '⚠️  [Firebase Admin] No service account credentials found in .env. ' +
        'Firebase Admin features (Auth user creation, password reset links) will be unavailable. ' +
        'Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.'
      );
      return null;
    }

    firebaseApp = initializeApp({
      credential,
    });

    console.log('🔥 [Firebase Admin] Initialized successfully');
    return firebaseApp;
  } catch (err) {
    console.error('❌ [Firebase Admin] Initialization failed:', err.message);
    return null;
  }
};

/**
 * Returns firebase-admin auth instance, or null if not configured.
 */
const getFirebaseAuth = () => {
  const app = initFirebaseAdmin();
  if (!app) return null;
  return getAuth(app);
};

module.exports = { initFirebaseAdmin, getFirebaseAuth };
