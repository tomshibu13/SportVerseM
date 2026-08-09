require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./config/db');
const User = require('./models/User');

const initializeAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'tomshibu66@gmail.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  try {
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        fullName: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'Admin',
        phone: '9999999999',
      });
      console.log(`👑 Predefined Admin created automatically: ${adminEmail}`);
    } else {
      console.log(`👑 Predefined Admin account verified: ${adminEmail}`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize Admin user:', error.message);
  }
};

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Initialize Predefined Admin Account
    await initializeAdmin();

    // 3. Start Express Server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 SportVerse AI Backend Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
    process.exit(1);
  }
};

startServer();
