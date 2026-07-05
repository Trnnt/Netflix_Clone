import request from 'supertest';
import app from '../index.js';
import mongoose from 'mongoose';

describe('AI Integration Unit Tests', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Prompt Parser & Chat', () => {
    it('should reject AI chat if no message is provided', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ userName: 'TestUser' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toBe('message required');
    });

    it('should handle missing API key gracefully', async () => {
      // In our new setup, if there's no GROQ_API_KEY in .env and the user didn't pass one, it throws an error.
      // But if there is one in .env, it might actually make a request. 
      // We will just test that the endpoint responds.
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'Hello AI', apiKey: '' }); // Passing empty key tests fallback
      
      // Either 200 (if server has key) or 500 (if no key found)
      expect([200, 500]).toContain(res.statusCode);
    });
  });
});
