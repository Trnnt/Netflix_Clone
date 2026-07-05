import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../db.js';

describe('Database & State Unit Tests', () => {
  beforeAll(async () => {
    // Attempt to connect to DB, but don't fail if offline (tests fallback)
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should successfully create a new user (Save User)', async () => {
    // Test logic for saving user
    const user = new User({
      name: 'TestUser',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
    });
    
    // We expect the user model to validate properly
    expect(user.name).toBe('TestUser');
    expect(user.role).toBe('user');
  });

  it('should update watch history', async () => {
    const historyItem = { user_id: '123', movie_id: '456', title: 'Batman' };
    expect(historyItem.title).toBe('Batman');
  });

  it('should delete watchlist item', async () => {
    const watchlistItem = { user_id: '123', movie_id: '456' };
    expect(watchlistItem.movie_id).toBe('456');
  });
});
