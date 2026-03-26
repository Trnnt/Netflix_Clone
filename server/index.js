import 'dotenv/config';
// import dns from 'dns';
// dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import http from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

import { connectDB } from './db.js';
import { chatWithAI, searchMovies } from './ai.js';

// ── Models ───────────────────────────────────────────────────────────────────
import User from './models/User.js';
import MyList from './models/MyList.js';
import Download from './models/Download.js';
import WatchHistory from './models/WatchHistory.js';
import Like from './models/Like.js';

// ── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'netflix_super_secret_key_2026';

// ══════════════════════════════════════════════════════════════════════════════
// ── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// 1. HTTP security headers (XSS, clickjack, MIME sniff protection)
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// 2. Strip any MongoDB operators ($gt, $ne, etc.) from req.body/query/params
app.use(mongoSanitize());

// 3. Prevent XSS attacks by sanitizing user input
app.use(xss());

// 4. Global rate limiter — 200 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// 4. Stricter rate limiter for auth routes — 15 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

// 5. Standard middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent payload abuse

// ══════════════════════════════════════════════════════════════════════════════
// ── AUTH MIDDLEWARE ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SOCKET.IO EVENTS ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
  socket.on('user_login', (data) => io.emit('admin_live_update', { type: 'login', ...data, timestamp: Date.now() }));
  socket.on('user_watch', (data) => io.emit('admin_live_update', { type: 'watch', ...data, timestamp: Date.now() }));
  socket.on('user_download', (data) => io.emit('admin_live_update', { type: 'download', ...data, timestamp: Date.now() }));
  socket.on('disconnect', () => console.log(`[Socket] User disconnected: ${socket.id}`));
});

// ══════════════════════════════════════════════════════════════════════════════
// ── TMDB SETUP ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const TMDB = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: { Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`, Accept: 'application/json' },
});

const mapMovie = (m, genre = 'Movie') => ({
  id: m.id,
  title: m.title || m.name,
  year: (m.release_date || m.first_air_date || '').slice(0, 4),
  maturity: m.adult ? 'R' : 'PG-13',
  match: Math.round(m.vote_average * 10),
  episodes: m.media_type === 'tv' ? 'TV Series' : (m.runtime ? `${m.runtime} min` : 'Movie'),
  desc: m.overview || 'No description available.',
  backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : '',
  thumbnail: m.backdrop_path ? `https://image.tmdb.org/t/p/w500${m.backdrop_path}` : (m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : ''),
  cast: '', genre, tags: [genre],
  rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
  duration: m.runtime ? `${m.runtime} min` : '—',
  type: m.media_type || (genre.toLowerCase().includes('drama') || genre.toLowerCase().includes('anime') || genre.toLowerCase().includes('series') ? 'tv' : 'movie'),
});

// ══════════════════════════════════════════════════════════════════════════════
// ── AUTH ROUTES ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── VALIDATION HELPERS ────────────────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongPassword = (pass) => {
  return pass.length >= 8 && /[0-9]/.test(pass) && /[!@#$%^&*]/.test(pass);
};

// ── AUTH ROUTES ───────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { name, email, password } = req.body;
  
  // 1. Required Fields
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields (name, email, password) are required.' });
  
  // 2. Email Format
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email format. Please provide a valid email address.' });
  
  // 3. Password Strength
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Password too weak. It must be at least 8 characters long and contain at least one number and one special character (!@#$%^&*).' });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'This email is already registered. Please log in or use a different email.' });

    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, userName: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[Register Error]', err.message);
    res.status(500).json({ error: 'Registration failed due to a server error. Please try again later.' });
  }
});


// POST /api/auth/login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error('[Login Error]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── MY LIST ──────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/mylist', authMiddleware, async (req, res) => {
  try {
    const list = await MyList.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch { res.json([]); }
});

app.post('/api/mylist', authMiddleware, async (req, res) => {
  const { movie_id, movie_title, movie_thumbnail = '', movie_year = '', movie_rating = '', movie_genre = '' } = req.body;
  if (!movie_id || !movie_title) return res.status(400).json({ error: 'movie_id and movie_title required' });
  try {
    await MyList.findOneAndUpdate(
      { user_id: req.user.id, movie_id: String(movie_id) },
      { user_id: req.user.id, movie_id: String(movie_id), movie_title, movie_thumbnail, movie_year, movie_rating, movie_genre },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[MyList Add Error]', err.message);
    res.status(500).json({ error: 'Failed to add' });
  }
});

app.delete('/api/mylist/:movieId', authMiddleware, async (req, res) => {
  try {
    await MyList.deleteOne({ user_id: req.user.id, movie_id: req.params.movieId });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/mylist/:movieId/check', authMiddleware, async (req, res) => {
  try {
    const row = await MyList.findOne({ user_id: req.user.id, movie_id: req.params.movieId });
    res.json({ inList: !!row });
  } catch { res.json({ inList: false }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── DOWNLOADS ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/downloads', authMiddleware, async (req, res) => {
  try {
    const list = await Download.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch { res.json([]); }
});

app.post('/api/downloads', authMiddleware, async (req, res) => {
  const { movie_id, movie_title, movie_thumbnail = '', movie_year = '', movie_rating = '' } = req.body;
  if (!movie_id || !movie_title) return res.status(400).json({ error: 'movie_id and movie_title required' });
  try {
    await Download.findOneAndUpdate(
      { user_id: req.user.id, movie_id: String(movie_id) },
      { user_id: req.user.id, movie_id: String(movie_id), movie_title, movie_thumbnail, movie_year, movie_rating },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/downloads/:movieId', authMiddleware, async (req, res) => {
  try {
    await Download.deleteOne({ user_id: req.user.id, movie_id: req.params.movieId });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── WATCH HISTORY ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/watch', authMiddleware, async (req, res) => {
  const { movie_id, movie_title, movie_thumbnail = '', duration_min = 1, season = null, episode = null } = req.body;
  try {
    await WatchHistory.create({ user_id: req.user.id, movie_id: String(movie_id), movie_title, movie_thumbnail, duration_min, season, episode });
    await User.findByIdAndUpdate(req.user.id, { $inc: { watch_hours: Math.ceil(duration_min / 60) } });
    res.json({ success: true });
  } catch (err) {
    console.error('[Watch Error]', err.message);
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/profile/activity
app.get('/api/profile/activity', authMiddleware, async (req, res) => {
  try {
    const rows = await WatchHistory.find({ user_id: req.user.id }).sort({ createdAt: -1 }).limit(50);
    const now = Date.now();
    const result = rows.map(r => {
      const diff = now - new Date(r.createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      const hrs  = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);
      const years  = Math.floor(days / 365);
      let relTime;
      if (mins < 1)       relTime = 'just now';
      else if (mins < 60) relTime = `${mins} minute${mins !== 1 ? 's' : ''} ago`;
      else if (hrs < 24)  relTime = `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
      else if (days < 7)  relTime = `${days} day${days !== 1 ? 's' : ''} ago`;
      else if (weeks < 5) relTime = `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
      else if (months < 12) relTime = `${months} month${months !== 1 ? 's' : ''} ago`;
      else                relTime = `${years} year${years !== 1 ? 's' : ''} ago`;
      return { ...r.toObject(), relTime };
    });
    res.json(result);
  } catch { res.json([]); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── ADMIN ROUTES ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/stats
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const totalUsers  = await User.countDocuments({ role: { $ne: 'admin' } });
    const activeUsers = await User.countDocuments({ status: 'Active', role: { $ne: 'admin' } });
    const watchAgg    = await User.aggregate([{ $match: { role: { $ne: 'admin' } } }, { $group: { _id: null, total: { $sum: '$watch_hours' } } }]);
    const totalWatchH = watchAgg[0]?.total || 0;
    const totalSaves  = await MyList.countDocuments();
    const totalDownloads = await Download.countDocuments();
    res.json({
      totalUsers, activeUsers,
      totalWatchHours: totalWatchH,
      avgWatchHours: totalUsers > 0 ? (totalWatchH / totalUsers).toFixed(1) : 0,
      totalSaves, totalDownloads,
    });
  } catch { res.status(500).json({ error: 'Stats failed' }); }
});

// GET /api/admin/users
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch { res.json([]); }
});

// PUT /api/admin/users/:id
app.put('/api/admin/users/:id', adminMiddleware, async (req, res) => {
  const { plan, status } = req.body;
  try {
    await User.findByIdAndUpdate(req.params.id, { plan: plan || 'Standard', status: status || 'Active' });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', adminMiddleware, async (req, res) => {
  try {
    await User.deleteOne({ _id: req.params.id, role: { $ne: 'admin' } });
    // Cascade delete user data
    await MyList.deleteMany({ user_id: req.params.id });
    await Download.deleteMany({ user_id: req.params.id });
    await WatchHistory.deleteMany({ user_id: req.params.id });
    await Like.deleteMany({ user_id: req.params.id });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// GET /api/admin/users/:id/details
app.get('/api/admin/users/:id/details', adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const [myList, downloads, history] = await Promise.all([
      MyList.find({ user_id: userId }).sort({ createdAt: -1 }),
      Download.find({ user_id: userId }).sort({ createdAt: -1 }),
      WatchHistory.find({ user_id: userId }).sort({ createdAt: -1 }),
    ]);
    res.json({ myList, downloads, history });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── TMDB MOVIE ROUTES ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export const movieCache = {};
let warmupPromise = null;

app.get('/api/movies/trending', async (req, res) => {
  if (warmupPromise) await warmupPromise;
  res.json(movieCache['trending'] || []);
});

app.get('/api/movies/genre/:name', async (req, res) => {
  if (warmupPromise) await warmupPromise;
  res.json(movieCache[req.params.name.toLowerCase()] || []);
});

// Cache Warm-up
async function warmUpCache() {
  console.log('Warming up TMDB cache sequentially to avoid rate limits...');
  const genres = [
    { name: 'trending', path: '/trending', isTrending: true },
    { name: 'hollywood', type: 'movie', with_genres: '28,12,878' },
    { name: 'anime', type: 'tv', with_genres: '16', with_origin_country: 'JP' },
    { name: 'cartoon', type: 'tv', with_genres: '16' },
    { name: 'kdrama', type: 'tv', with_origin_country: 'KR' },
    { name: 'cdrama', type: 'tv', with_origin_country: 'CN' },
    { name: 'jdrama', type: 'tv', with_origin_country: 'JP', without_genres: '16' },
    { name: 'wollywood', type: 'movie', with_original_language: 'hi' },
  ];

  for (const g of genres) {
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        let url, params;
        if (g.isTrending) {
          url = 'https://api.themoviedb.org/3/trending/all/week';
        } else {
          url = g.type === 'tv' ? 'https://api.themoviedb.org/3/discover/tv' : 'https://api.themoviedb.org/3/discover/movie';
          params = new URLSearchParams({ sort_by: 'popularity.desc', 'vote_count.gte': 100, page: 1, ...g });
          params.delete('name'); params.delete('type');
        }

        const res = await fetch(params ? `${url}?${params}` : url, {
          headers: { Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`, Accept: 'application/json' }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (g.isTrending) {
          movieCache['trending'] = data.results.slice(0, 20).map(m => mapMovie(m, m.media_type === 'tv' ? 'TV Series' : 'Movie'));
        } else {
          const label = g.name.charAt(0).toUpperCase() + g.name.slice(1);
          movieCache[g.name] = data.results.slice(0, 20).map(m => mapMovie(m, label));
        }

        console.log(`[Cache] Loaded ${g.name}`);
        success = true;
        await new Promise(r => setTimeout(r, 600));
        break;
      } catch (err) {
        if (attempt === 3) console.error(`[Cache] Error loading ${g.name}:`, err.message);
        else {
          console.log(`[Cache] Retrying ${g.name} (${attempt}/3)...`);
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }
  console.log('Cache warm-up complete.');
}

app.get('/api/movies/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const { data } = await TMDB.get('/search/multi', { params: { query: q, page: 1, include_adult: false } });
    res.json(data.results.filter(m => m.media_type !== 'person').slice(0, 15).map(m => mapMovie(m, m.media_type === 'tv' ? 'TV Series' : 'Movie')));
  } catch { res.json([]); }
});

app.get('/api/movies/:id/details', async (req, res) => {
  const { type } = req.query; // 'movie' or 'tv'
  try {
    let data;
    if (type === 'tv') {
      const r = await TMDB.get(`/tv/${req.params.id}`, { params: { append_to_response: 'credits' } });
      data = { ...r.data, media_type: 'tv' };
    } else if (type === 'movie') {
      const r = await TMDB.get(`/movie/${req.params.id}`, { params: { append_to_response: 'credits' } });
      data = { ...r.data, media_type: 'movie' };
    } else {
      // Fallback fallback if no type provided
      try {
        const r = await TMDB.get(`/movie/${req.params.id}`, { params: { append_to_response: 'credits' } });
        data = { ...r.data, media_type: 'movie' };
      } catch {
        const r = await TMDB.get(`/tv/${req.params.id}`, { params: { append_to_response: 'credits' } });
        data = { ...r.data, media_type: 'tv' };
      }
    }
    const cast = (data.credits?.cast || []).slice(0, 4).map(c => c.name).join(', ');
    const movie = mapMovie(data, 'Movie');
    movie.cast = cast;
    movie.episodes = data.media_type === 'tv'
      ? `${data.number_of_seasons} Season${data.number_of_seasons > 1 ? 's' : ''}`
      : `${Math.floor((data.runtime || 0) / 60)}h ${(data.runtime || 0) % 60}m`;
    res.json(movie);
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/movies/:id/trailer', async (req, res) => {
  const { type = 'movie' } = req.query;
  try {
    const endpoint = type === 'tv' ? `/tv/${req.params.id}/videos` : `/movie/${req.params.id}/videos`;
    let { data } = await TMDB.get(endpoint);
    let videos = data.results || [];
    if (!videos.length && type !== 'tv') {
      const r2 = await TMDB.get(`/tv/${req.params.id}/videos`);
      videos = r2.data.results || [];
    }
    const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
      videos.find(v => v.site === 'YouTube' && v.type === 'Teaser') ||
      videos.find(v => v.site === 'YouTube');
    if (trailer) res.json({ youtubeKey: trailer.key, name: trailer.name });
    else res.status(404).json({ error: 'No trailer' });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── LIKES ────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/likes', authMiddleware, async (req, res) => {
  try {
    const list = await Like.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch { res.json([]); }
});

app.post('/api/likes', authMiddleware, async (req, res) => {
  const { movie_id, movie_title, movie_thumbnail = '', movie_year = '', movie_genre = '' } = req.body;
  if (!movie_id || !movie_title) return res.status(400).json({ error: 'movie_id and movie_title required' });
  try {
    await Like.findOneAndUpdate(
      { user_id: req.user.id, movie_id: String(movie_id) },
      { user_id: req.user.id, movie_id: String(movie_id), movie_title, movie_thumbnail, movie_year, movie_genre },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/likes/:movieId', authMiddleware, async (req, res) => {
  try {
    await Like.deleteOne({ user_id: req.user.id, movie_id: req.params.movieId });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/likes/:movieId/check', authMiddleware, async (req, res) => {
  try {
    const row = await Like.findOne({ user_id: req.user.id, movie_id: req.params.movieId });
    res.json({ liked: !!row });
  } catch { res.json({ liked: false }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── AI ROUTES ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages = [], message, userName = 'Guest' } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    const result = await chatWithAI(movieCache, messages, message, userName);
    res.json(result);
  } catch (err) {
    console.error('[AI Chat Error]', err.message);
    res.status(500).json({ error: err.message || 'AI error' });
  }
});

app.get('/api/ai/recommend', async (req, res) => {
  try {
    if (warmupPromise) await warmupPromise;
    const { q = '' } = req.query;
    if (!q) return res.json([]);
    const movies = searchMovies(movieCache, q, 8);
    res.json(movies);
  } catch { res.json([]); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── FINAL ERROR HANDLING ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// 1. Catch 404
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// 2. Global Exception Handler (Prevents crashes and leaks)
import fs from 'fs';
app.use((err, req, res, next) => {
  const stack = err.stack || err.message || JSON.stringify(err);
  console.error('[UNHANDLED EXCEPTION]', stack);
  
  // Log to file (skip in serverless environments if needed, but safe here)
  try { 
    if (process.env.NODE_ENV !== 'production') {
      fs.appendFileSync('server_errors.log', `\n--- ${new Date().toISOString()} ---\n${stack}\n`); 
    }
  } catch(e) {}

  res.status(500).json({ 
    error: 'Something went wrong on our end. Rimuru AI has logged this event. Please try again later.' 
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ── SERVER START ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const start = async () => {
  try {
    await connectDB();
    if (process.env.NODE_ENV !== 'test') { // Prevent EADDRINUSE during tests
       server.listen(PORT, () => {
         console.log(`🚀 Rimuru Server running on http://localhost:${PORT}`);
       });
    }
    warmupPromise = warmUpCache();
  } catch (err) {
    console.error('CRITICAL: Failed to start server:', err.message);
  }
};

// ONLY START IF RUN DIRECTLY (Not via Vercel/Tests)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  start();
} else {
  // If in production/vercel, just connect DB
  connectDB().catch(console.error);
}

// Export for Vercel / Serverless
export default app;


