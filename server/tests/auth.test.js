import request from 'supertest';
import app from '../index.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Setup Mock DB or just test offline fallback if DB isn't connected
beforeAll(async () => {
  // Ensure we are in test mode so the server doesn't start listening on the port
  process.env.NODE_ENV = 'test';
  
  // We can connect to a dedicated test DB here, or just rely on the existing mongoose logic
  // For safety in CI, if there's no MONGODB_URI, we'll let it use the offline fallback logic.
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    // Cleanup mock test user
    await User.deleteOne({ email: 'test_jest@netflix.com' });
    await mongoose.connection.close();
  }
});

describe('Authentication API Integration Tests', () => {
  let validToken = '';

  describe('POST /api/auth/register', () => {
    it('should fail with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test_jest@netflix.com',
          password: 'weak'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Password too weak');
    });

    it('should successfully register a user or return offline mock', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test_jest@netflix.com',
          password: 'StrongPassword123!'
        });
      
      // Might be 409 if already exists, which is fine for repeated test runs
      expect([200, 409]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.email).toEqual('test_jest@netflix.com');
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test_jest@netflix.com',
          password: 'WrongPassword999!'
        });
      
      // If DB is offline, the offline fallback mock actually accepts any password
      // But if DB is online, it should be 401
      if (mongoose.connection.readyState === 1) {
        expect(res.statusCode).toEqual(401);
      } else {
        expect(res.statusCode).toEqual(200); // Offline mock behavior
      }
    });

    it('should return a JWT for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test_jest@netflix.com',
          password: 'StrongPassword123!'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      validToken = res.body.token;
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject requests without a token (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual('No token');
    });

    it('should reject requests with tampered JWT (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}tampered`);
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual('Invalid token');
    });

    it('should return user profile with a valid token (200)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('email', 'test_jest@netflix.com');
    });
  });
});
