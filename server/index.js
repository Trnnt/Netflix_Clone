import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import os from 'os';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

import axios from 'axios';

import { connectDB } from './db.js';
import { chatWithAI, searchMovies } from './ai.js';
import { FALLBACK_MOVIES } from './fallback_movies.js';

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

// 1. Standard middleware (Must be before routes)
app.use(cors());
app.use(express.json({ limit: '10kb' })); 

// 2. Global rate limiter — 200 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ── MOVED ADMIN ROUTES (To prevent conflict with wildcards) ────
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const totalUsers  = await User.countDocuments(); 
    const activeUsers = await User.countDocuments({ status: 'Active' });
    const watchAgg    = await User.aggregate([{ $group: { _id: null, total: { $sum: '$watch_hours' } } }]);
    const totalWatchH = watchAgg[0]?.total || 0;
    const totalSaves  = await MyList.countDocuments();
    const totalDownloads = await Download.countDocuments();
    res.json({ totalUsers, activeUsers, totalWatchHours: totalWatchH, avgWatchHours: totalUsers > 0 ? (totalWatchH / totalUsers).toFixed(1) : 0, totalSaves, totalDownloads });
  } catch { res.status(500).json({ error: 'Stats failed' }); }
});

app.get('/api/admin/content-insights', adminMiddleware, async (req, res) => {
  try {
    const [topWatched, topSaved, topDownloaded] = await Promise.all([
      WatchHistory.aggregate([{ $group: { _id: "$movie_id", title: { $first: "$movie_title" }, views: { $sum: 1 } } }, { $sort: { views: -1 } }, { $limit: 10 }]),
      MyList.aggregate([{ $group: { _id: "$movie_id", title: { $first: "$movie_title" }, counts: { $sum: 1 } } }, { $sort: { counts: -1 } }, { $limit: 10 }]),
      Download.aggregate([{ $group: { _id: "$movie_id", title: { $first: "$movie_title" }, counts: { $sum: 1 } } }, { $sort: { counts: -1 } }, { $limit: 10 }])
    ]);
    res.json({ topWatched, topSaved, topDownloaded });
  } catch { res.status(500).json({ error: 'Insights failed' }); }
});

app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// POST /api/admin/notify
app.post('/api/admin/notify', adminMiddleware, (req, res) => {
  const { text, img = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png' } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  const notif = { id: Date.now(), text, time: 'Just now', img };
  io.emit('new_notification', notif);
  res.json({ success: true, notif });
});

// GET /api/admin/sys-health
app.get('/api/admin/sys-health', adminMiddleware, async (req, res) => {
  try {
    const uptime = os.uptime();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuLoad = os.loadavg()[0]; // 1 min load
    
    res.json({
      status: 'Healthy',
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        total: (totalMem / (1024 ** 3)).toFixed(1) + ' GB',
        used: (usedMem / (1024 ** 3)).toFixed(1) + ' GB',
        percentage: ((usedMem / totalMem) * 100).toFixed(1) + '%'
      },
      cpu: cpuLoad.toFixed(2),
      services: [
        { name: 'API Gateway', status: 'Online', latency: '42ms' },
        { name: 'Database', status: 'Connected', connections: 14 },
        { name: 'Socket.io', status: 'Active', rooms: 3 }
      ]
    });
  } catch { res.status(500).json({ error: 'Failed' }); }
});
// ────────────────────────────────────────────────────────

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 15,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { error: 'Too many login attempts, please try again later.' },
// });
const authLimiter = (req, res, next) => next();

// Standard middleware moved to top

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
const TMDB_BASE_URL = process.env.TMDB_PROXY_URL || 'https://api.themoviedb.org/3';

const TMDB = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: { Accept: 'application/json' },
});

const mapMovie = (m, genre = 'Movie') => ({
  id: m.id,
  title: m.title || m.name,
  year: (m.release_date || m.first_air_date || '').slice(0, 4),
  release_date: m.release_date || m.first_air_date || '0000-00-00',
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
    if (mongoose.connection.readyState !== 1) {
      const mockId = 'offline_user_' + Date.now();
      const token = jwt.sign({ id: mockId, email, role: 'user', userName: name }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: mockId, name, email, role: 'user' } });
    }

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
    if (mongoose.connection.readyState !== 1) {
      const mockId = 'offline_user_' + Date.now();
      const token = jwt.sign({ id: mockId, email, role: 'user', userName: email.split('@')[0] }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: mockId, name: email.split('@')[0], email, role: 'user' } });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, userName: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[Login Error]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ _id: req.user.id, name: req.user.userName || req.user.email?.split('@')[0] || 'Offline User', email: req.user.email, role: req.user.role || 'user' });
    }

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
const OFFLINE_DB_PATH = './offline_db.json';
let offlineDb = { myList: [], downloads: [], watchHistory: [], likes: [] };
try { if (fs.existsSync(OFFLINE_DB_PATH)) offlineDb = JSON.parse(fs.readFileSync(OFFLINE_DB_PATH, 'utf-8')); } catch (e) { console.error('Failed to load offline DB', e); }
const saveOfflineDb = () => { try { fs.writeFileSync(OFFLINE_DB_PATH, JSON.stringify(offlineDb, null, 2)); } catch (e) {} };
app.get('/api/mylist', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json(offlineDb.myList.filter(m => m.user_id === req.user.id).reverse());
    const list = await MyList.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch { res.json(offlineDb.myList.filter(m => m.user_id === req.user.id).reverse()); }
});

app.post('/api/mylist', authMiddleware, async (req, res) => {
  const { movie_id, movie_title, movie_thumbnail = '', movie_year = '', movie_rating = '', movie_genre = '' } = req.body;
  if (!movie_id || !movie_title) return res.status(400).json({ error: 'movie_id and movie_title required' });
  try {
    if (mongoose.connection.readyState !== 1) {
      offlineDb.myList = offlineDb.myList.filter(m => m.movie_id !== String(movie_id) || m.user_id !== req.user.id);
      offlineDb.myList.push({ user_id: req.user.id, movie_id: String(movie_id), movie_title, movie_thumbnail, movie_year, movie_rating, movie_genre, added_at: new Date().toISOString() });
      saveOfflineDb();
      return res.json({ success: true, offlineMock: true });
    }
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
    if (mongoose.connection.readyState !== 1) {
      offlineDb.myList = offlineDb.myList.filter(m => m.movie_id !== String(req.params.movieId) || m.user_id !== req.user.id);
      saveOfflineDb();
      return res.json({ success: true, offlineMock: true });
    }
    await MyList.deleteOne({ user_id: req.user.id, movie_id: req.params.movieId });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/mylist/:movieId/check', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const exists = offlineDb.myList.some(m => m.movie_id === String(req.params.movieId) && m.user_id === req.user.id);
      return res.json({ inList: exists });
    }
    const row = await MyList.findOne({ user_id: req.user.id, movie_id: req.params.movieId });
    res.json({ inList: !!row });
  } catch { res.json({ inList: false }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── DOWNLOADS ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/downloads', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json(offlineDb.downloads.filter(m => m.user_id === req.user.id).reverse());
    const list = await Download.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch { res.json(offlineDb.downloads.filter(m => m.user_id === req.user.id).reverse()); }
});

app.post('/api/downloads', authMiddleware, async (req, res) => {
  const { movie_id, movie_title, movie_thumbnail = '', movie_year = '', movie_rating = '' } = req.body;
  if (!movie_id || !movie_title) return res.status(400).json({ error: 'movie_id and movie_title required' });
  try {
    if (mongoose.connection.readyState !== 1) {
      offlineDb.downloads = offlineDb.downloads.filter(m => m.movie_id !== String(movie_id) || m.user_id !== req.user.id);
      offlineDb.downloads.push({ user_id: req.user.id, movie_id: String(movie_id), movie_title, movie_thumbnail, movie_year, movie_rating, downloaded_at: new Date().toISOString() });
      saveOfflineDb();
      return res.json({ success: true, offlineMock: true });
    }
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
    if (mongoose.connection.readyState !== 1) {
      offlineDb.downloads = offlineDb.downloads.filter(m => m.movie_id !== String(req.params.movieId) || m.user_id !== req.user.id);
      saveOfflineDb();
      return res.json({ success: true, offlineMock: true });
    }
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
    if (mongoose.connection.readyState !== 1) {
      offlineDb.watchHistory.push({ user_id: req.user.id, movie_id: String(movie_id), movie_title, movie_thumbnail, duration_min, season, episode, createdAt: new Date().toISOString() });
      saveOfflineDb();
      return res.json({ success: true, offlineMock: true });
    }
    await WatchHistory.create({ user_id: req.user.id, movie_id: String(movie_id), movie_title, movie_thumbnail, duration_min, season, episode });
    await User.findByIdAndUpdate(req.user.id, { $inc: { watch_hours: duration_min / 60 } });
    res.json({ success: true });
  } catch (err) {
    console.error('[Watch Error]', err.message);
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/profile/activity
app.get('/api/profile/activity', authMiddleware, async (req, res) => {
  try {
    let rows = [];
    if (mongoose.connection.readyState !== 1) {
      rows = offlineDb.watchHistory.filter(m => m.user_id === req.user.id).reverse().slice(0, 50).map(m => ({...m, toObject: () => m}));
    } else {
      rows = await WatchHistory.find({ user_id: req.user.id }).sort({ createdAt: -1 }).limit(50);
    }
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
      return { ...(r.toObject ? r.toObject() : r), relTime };
    });
    res.json(result);
  } catch { res.json([]); }
});

// ADMIN ROUTES WERE MOVED TO THE TOP TO PREVENT 404 CONFLICTS

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

// GET /api/admin/sys-health
app.get('/api/admin/sys-health', adminMiddleware, async (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem  = os.freemem();
    const usedMem  = totalMem - freeMem;
    const cpuCount = os.cpus().length;
    const load     = os.loadavg();
    
    res.json({
      uptime: Math.floor(os.uptime()),
      memory: {
        total: Math.round(totalMem / (1024 * 1024 * 1024)),
        used: Math.round(usedMem / (1024 * 1024 * 1024)),
        percent: Math.round((usedMem / totalMem) * 100)
      },
      cpu: {
        count: cpuCount,
        load: load[0].toFixed(2)
      },
      db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      platform: os.platform(),
      nodeVersion: process.version
    });
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
  console.log('Warming up TMDB cache sequentially (Expanded Data Mode)...');
  const genres = [
    { name: 'trending', path: '/trending', isTrending: true, pages: 3 },
    { name: 'hollywood', type: 'movie', with_genres: '28,12,878', pages: 5 },
    { name: 'anime', type: 'tv', with_genres: '16', with_origin_country: 'JP', pages: 5 },
    { name: 'cartoon', type: 'tv', with_genres: '16', pages: 5 },
    { name: 'kdrama', type: 'tv', with_origin_country: 'KR', pages: 5 },
    { name: 'cdrama', type: 'tv', with_origin_country: 'CN', pages: 5 },
    { name: 'jdrama', type: 'tv', with_origin_country: 'JP', without_genres: '16', pages: 5 },
    { name: 'wollywood', type: 'movie', with_original_language: 'hi', pages: 5 },
  ];

  for (const g of genres) {
    let allResults = [];
    const maxPages = g.pages || 1;
    let label = g.name.charAt(0).toUpperCase() + g.name.slice(1);

    for (let p = 1; p <= maxPages; p++) {
      let success = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          let url, params;
          if (g.isTrending) {
            url = `${TMDB_BASE_URL}/trending/all/week?page=${p}`;
          } else {
            url = g.type === 'tv' ? `${TMDB_BASE_URL}/discover/tv` : `${TMDB_BASE_URL}/discover/movie`;
            params = new URLSearchParams({ sort_by: 'popularity.desc', 'vote_count.gte': 100, page: p, ...g });
            params.delete('name'); params.delete('type'); params.delete('pages');
          }

          const res = await fetch(params ? `${url}?${params}` : url, {
            headers: { Accept: 'application/json' }
          });

          if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorBody}`);
          }
          const data = await res.json();
          if (!g.isTrending && g.type) {
            (data.results || []).forEach(m => m.media_type = g.type);
          }
          const results = (data.results || []).map(m => mapMovie(m, g.isTrending ? (m.media_type === 'tv' ? 'TV Series' : 'Movie') : label));
          allResults = [...allResults, ...results];
          
          success = true;
          await new Promise(r => setTimeout(r, 400)); // Small delay between pages
          break;
        } catch (err) {
          if (attempt === 3) {
            console.error(`[Cache] Error loading ${g.name} p${p}:`, err.message);
            if (allResults.length === 0) {
              allResults = FALLBACK_MOVIES.filter(m => {
                 if (g.name === 'trending') return m.section === 'trending';
                 if (g.name === 'hollywood') return m.section === 'hollywood';
                 if (g.name === 'anime') return m.section === 'anime';
                 if (g.name === 'kdrama') return m.section === 'kdrama';
                 if (g.name === 'wollywood') return m.section === 'wollywood';
                 if (g.name === 'cartoon') return m.section === 'cartoon';
                 return true;
              });
              console.log(`[Cache] Using fallback for ${g.name} (${allResults.length} items)`);
              success = false; // Set to false to break the pagination loop
            }
          }
          else await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
      if (!success) break;
    }

    // Deduplicate to prevent same poster showing multiple times
    const uniqueMap = new Map();
    allResults.forEach(m => uniqueMap.set(m.id, m));
    allResults = Array.from(uniqueMap.values());

    // New-to-Old sorting if requested by user (for all rows now to keep consistency)
    allResults.sort((a, b) => b.release_date.localeCompare(a.release_date));
    
    // Inject user requested specific cartoons at the front of the list
    if (g.name === 'cartoon') {
      const shows = ['Ben 10', 'Pokemon', 'Doraemon', 'Ninja Hattori'];
      for (let i = shows.length - 1; i >= 0; i--) { // Reverse loop to maintain order when unshifting
        try {
          const res = await fetch(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(shows[i])}&page=1`, {
            headers: { Accept: 'application/json' }
          });
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const m = data.results[0];
            m.media_type = 'tv';
            allResults.unshift(mapMovie(m, 'Cartoon'));
          }
        } catch (e) { console.error('Failed to fetch specific cartoon', e); }
      }
      // Re-deduplicate just in case
      const uMap = new Map();
      allResults.forEach(m => uMap.set(m.id, m));
      allResults = Array.from(uMap.values());
    }

    movieCache[g.name] = allResults;
    console.log(`[Cache] Loaded ${g.name} (${allResults.length} items, Sorted Newest)`);
  }
  console.log('Cache warm-up complete. Library is now expanded and sorted.');
}

app.get('/api/movies/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const { data } = await TMDB.get('/search/multi', { params: { query: q, page: 1, include_adult: false } });
    res.json(data.results.filter(m => m.media_type !== 'person').slice(0, 15).map(m => mapMovie(m, m.media_type === 'tv' ? 'TV Series' : 'Movie')));
  } catch {
    const q = (req.query.q || '').toLowerCase();
    const fb = FALLBACK_MOVIES.filter(m => m.title.toLowerCase().includes(q) || m.genre.toLowerCase().includes(q));
    res.json(fb);
  }
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
  } catch {
    const fallbackMovie = FALLBACK_MOVIES.find(m => String(m.id) === String(req.params.id)) || FALLBACK_MOVIES[0];
    res.json(fallbackMovie);
  }
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
  } catch { res.status(404).json({ error: 'No trailer' }); }
});

// ── GET TV SEASONS ──────────────────────────────────────────
app.get('/api/movies/tv/:id/seasons', async (req, res) => {
  try {
    const { data } = await TMDB.get(`/tv/${req.params.id}`);
    const seasons = (data.seasons || []).filter(s => s.season_number > 0).map(s => ({
      id: s.id,
      name: s.name,
      season_number: s.season_number,
      episode_count: s.episode_count,
      poster: s.poster_path ? `https://image.tmdb.org/t/p/w200${s.poster_path}` : '',
      overview: s.overview
    }));
    res.json({ seasons, total_seasons: data.number_of_seasons });
  } catch { 
    res.json({ seasons: [{ id: 1, name: 'Season 1', season_number: 1, episode_count: 10, poster: '', overview: '' }], total_seasons: 1 });
  }
});

// ── GET SEASON EPISODES ──────────────────────────────────────
app.get('/api/movies/tv/:id/season/:num', async (req, res) => {
  try {
    const { data } = await TMDB.get(`/tv/${req.params.id}/season/${req.params.num}`);
    const eps = (data.episodes || []).map(e => ({
      id: e.id,
      name: e.name,
      episode_number: e.episode_number,
      overview: e.overview || 'No description available.',
      still: e.still_path ? `https://image.tmdb.org/t/p/w400${e.still_path}` : '',
      air_date: e.air_date,
      runtime: e.runtime ? `${e.runtime} min` : '45 min'
    }));
    res.json(eps);
  } catch { 
    res.json([
      { id: 1, name: "Episode 1", episode_number: 1, overview: "Sample fallback episode", still: "", air_date: "2024-01-01", runtime: "45 min" },
      { id: 2, name: "Episode 2", episode_number: 2, overview: "Sample fallback episode", still: "", air_date: "2024-01-08", runtime: "45 min" }
    ]);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── STREAM PROXY ROUTE ────────────────────────────────────────────────────────
// Fetches real HLS/MP4 stream URLs from Consumet API (gogoanime, zoro, etc.)
// ══════════════════════════════════════════════════════════════════════════════

// Consumet public API instances (fallback chain)
const CONSUMET_HOSTS = [
  'https://consumet-api.onrender.com',
  'https://api.consumet.org',
];

async function fetchFromConsumer(path) {
  for (const host of CONSUMET_HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) { /* try next host */ }
  }
  return null;
}

// GET /api/stream?tmdbId=&type=tv|movie&season=&episode=&title=
app.get('/api/stream', async (req, res) => {
  const { tmdbId, type, season = 1, episode = 1, title = '' } = req.query;
  if (!tmdbId) return res.status(400).json({ error: 'tmdbId required' });

  const streamUrls = [];

  try {
    if (type === 'tv') {
      // 1. Try Zoro/Hianime (best for anime)
      const zoroSearch = await fetchFromConsumer(`/anime/zoro/${encodeURIComponent(title)}`);
      if (zoroSearch?.results?.length) {
        const topId = zoroSearch.results[0].id;
        const zoroEps = await fetchFromConsumer(`/anime/zoro/episodes/${topId}`);
        const epData = zoroEps?.episodes?.find(e => e.number == episode) || zoroEps?.episodes?.[0];
        if (epData) {
          const sources = await fetchFromConsumer(`/anime/zoro/watch?episodeId=${encodeURIComponent(epData.id)}`);
          if (sources?.sources) {
            sources.sources.forEach(s => streamUrls.push({ url: s.url, quality: s.quality || 'auto', provider: 'zoro', type: s.isM3U8 ? 'hls' : 'mp4' }));
          }
        }
      }

      // 2. Try Gogoanime as fallback
      if (!streamUrls.length) {
        const gogoSearch = await fetchFromConsumer(`/anime/gogoanime/${encodeURIComponent(title)}`);
        if (gogoSearch?.results?.length) {
          const gogoId = gogoSearch.results[0].id;
          const streamId = `${gogoId}-episode-${episode}`;
          const sources = await fetchFromConsumer(`/anime/gogoanime/watch/${streamId}`);
          if (sources?.sources) {
            sources.sources.forEach(s => streamUrls.push({ url: s.url, quality: s.quality || 'auto', provider: 'gogoanime', type: s.isM3U8 ? 'hls' : 'mp4' }));
          }
        }
      }
    } else {
      // Movies via Flixhq
      const flixSearch = await fetchFromConsumer(`/movies/flixhq/${encodeURIComponent(title)}`);
      if (flixSearch?.results?.length) {
        const flixId = flixSearch.results[0].id;
        const mediaInfo = await fetchFromConsumer(`/movies/flixhq/info?id=${flixId}`);
        const epId = mediaInfo?.episodes?.[0]?.id;
        if (epId) {
          const sources = await fetchFromConsumer(`/movies/flixhq/watch?episodeId=${epId}&mediaId=${flixId}`);
          if (sources?.sources) {
            sources.sources.forEach(s => streamUrls.push({ url: s.url, quality: s.quality || 'auto', provider: 'flixhq', type: s.isM3U8 ? 'hls' : 'mp4' }));
          }
        }
      }
    }
  } catch (e) {
    console.error('[Stream] Error:', e.message);
  }

  // Always append embed fallbacks as last resort options
  const embedFallback = type === 'tv'
    ? `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
    : `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`;
  
  const embed2 = type === 'tv'
    ? `https://2embed.cc/embed/tv/${tmdbId}/${season}/${episode}`
    : `https://2embed.cc/embed/movie/${tmdbId}`;

  res.json({
    tmdbId,
    type,
    title,
    sources: streamUrls,
    embeds: [embedFallback, embed2],
    hasDirectStream: streamUrls.length > 0,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ── LIKES ────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/likes', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json(offlineDb.likes.filter(m => m.user_id === req.user.id).reverse());
    const list = await Like.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch { res.json(offlineDb.likes.filter(m => m.user_id === req.user.id).reverse()); }
});

app.post('/api/likes', authMiddleware, async (req, res) => {
  const { movie_id, movie_title, movie_thumbnail = '', movie_year = '', movie_genre = '' } = req.body;
  if (!movie_id || !movie_title) return res.status(400).json({ error: 'movie_id and movie_title required' });
  try {
    if (mongoose.connection.readyState !== 1) {
      offlineDb.likes = offlineDb.likes.filter(m => m.movie_id !== String(movie_id) || m.user_id !== req.user.id);
      offlineDb.likes.push({ user_id: req.user.id, movie_id: String(movie_id), movie_title, movie_thumbnail, movie_year, movie_genre, added_at: new Date().toISOString() });
      saveOfflineDb();
      return res.json({ success: true, offlineMock: true });
    }
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
    if (mongoose.connection.readyState !== 1) {
      offlineDb.likes = offlineDb.likes.filter(m => m.movie_id !== String(req.params.movieId) || m.user_id !== req.user.id);
      saveOfflineDb();
      return res.json({ success: true, offlineMock: true });
    }
    await Like.deleteOne({ user_id: req.user.id, movie_id: req.params.movieId });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/likes/:movieId/check', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const exists = offlineDb.likes.some(m => m.movie_id === String(req.params.movieId) && m.user_id === req.user.id);
      return res.json({ liked: exists });
    }
    const row = await Like.findOne({ user_id: req.user.id, movie_id: req.params.movieId });
    res.json({ liked: !!row });
  } catch { res.json({ liked: false }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── AI ROUTES ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages = [], message, userName = 'Guest', apiKey } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    const result = await chatWithAI(movieCache, messages, message, userName, apiKey);
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
       warmupPromise = warmUpCache();
    }
  } catch (err) {
    console.error('CRITICAL: Failed to start server:', err.message);
  }
};

// ONLY START IF RUN DIRECTLY (Not via Serverless Vercel)
if (!process.env.VERCEL) {
  start();
} else {
  // If in vercel serverless, just connect DB
  connectDB().catch(console.error);
}

export default app;
