require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./config/db');
const { initFirebaseAdmin } = require('./config/firebase');
const { seedUsersIfEmpty } = require('./controllers/authController');
const { seedGroundsIfEmpty } = require('./controllers/groundController');
const { seedProductsIfEmpty } = require('./controllers/shopController');
const { seedBookingsIfEmpty } = require('./controllers/bookingController');

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Initialize Firebase Admin SDK (non-blocking — warns if credentials missing)
    initFirebaseAdmin();

    // 3. Initialize Seeders for Database Collections
    await seedUsersIfEmpty();
    await seedGroundsIfEmpty();
    await seedProductsIfEmpty();
    await seedBookingsIfEmpty();

    // 3. Start Express Server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 SportVerse AI Backend Server listening on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Stop the existing process first:`);
        console.error(`   PowerShell: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
    process.exit(1);
  }
};

startServer();

