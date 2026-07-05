import mongoose from 'mongoose';
import User from './models/User.js';

// ─── CONNECT TO MONGODB ──────────────────────────────────────────────────────
export async function connectDB() {
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Skipping MongoDB connection in test environment');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is missing in .env — cannot connect.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');

    // ── Seed admin account ───────────────────────────────────────────────────
    const existingAdmin = await User.findOne({ email: 'admin@netflix.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: 'admin@netflix.com',
        password: 'admin123',
        role: 'admin',
        plan: 'Premium',
        status: 'Active',
      });
      console.log('🔑 Admin created — email: admin@netflix.com  password: admin123');
    }

    // ── Seed demo user ───────────────────────────────────────────────────────
    const existingUser = await User.findOne({ email: 'nishant@netflix.com' });
    if (!existingUser) {
      await User.create({
        name: 'Nishant',
        email: 'nishant@netflix.com',
        password: 'nishant123',
        role: 'user',
        plan: 'Premium',
        status: 'Active',
      });
      console.log('👤 User created — email: nishant@netflix.com  password: nishant123');
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('⚠️ Server will continue running without Database connection. Some features may fail.');
  }
}

export default mongoose;
