import request from 'supertest';
import app from '../index.js'; // Adjust the import if your app export is different
import mongoose from 'mongoose';

// Important: ensure you export `app` from index.js for testing.
// e.g., export default app; at the bottom of index.js

describe('Movies API Integration Tests', () => {
  afterAll(async () => {
    // Close mongoose connection after tests
    await mongoose.connection.close();
  });

  describe('GET /api/movies/trending', () => {
    it('should return a list of trending movies', async () => {
      const res = await request(app).get('/api/movies/trending');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      // Even if fallback, it should return array
    });
  });

  describe('GET /api/movies/genre/anime', () => {
    it('should return a list of anime', async () => {
      const res = await request(app).get('/api/movies/genre/anime');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });

  describe('GET /api/movies/:id/details', () => {
    it('should return movie details or fallback mock', async () => {
      const res = await request(app).get('/api/movies/12345/details?type=movie');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('GET /api/movies/search', () => {
    it('should return search results for a query', async () => {
      const res = await request(app).get('/api/movies/search?q=batman');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should return 200 with empty array if no query provided', async () => {
      const res = await request(app).get('/api/movies/search');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });
  });
});
