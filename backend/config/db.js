const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in .env file');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    if (process.env.MONGO_URI.includes('localhost')) {
      try {
        const fallbackUri = process.env.MONGO_URI.replace('localhost', '127.0.0.1');
        const conn = await mongoose.connect(fallbackUri);
        console.log(`✅ MongoDB Connected via Fallback (127.0.0.1): ${conn.connection.host}/${conn.connection.name}`);
        return;
      } catch (fallbackError) {
        console.error(`❌ MongoDB Connection Error: ${fallbackError.message}`);
      }
    } else {
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
    }
    process.exit(1);
  }
};

module.exports = connectDB;
