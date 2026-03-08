import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { stmts } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'netflix_super_secret_key_2026';

app.use(cors());
app.use(express.json());

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
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

// ─── TMDB SETUP ───────────────────────────────────────────────────────────────
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
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    try {
        const hash = await bcrypt.hash(password, 10);
        const info = stmts.createUser.run(name, email, hash);
        const user = stmts.getUserById.get(info.lastInsertRowid);
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user });
    } catch (err) {
        if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = stmts.getUserByEmail.get(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user = stmts.getUserById.get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

// ─── MY LIST ──────────────────────────────────────────────────────────────────

app.get('/api/mylist', authMiddleware, (req, res) => {
    res.json(stmts.getMyList.all(req.user.id));
});

app.post('/api/mylist', authMiddleware, (req, res) => {
    const { movie_id, movie_title, movie_thumbnail = '', movie_year = '', movie_rating = '' } = req.body;
    if (!movie_id || !movie_title) return res.status(400).json({ error: 'movie_id and movie_title required' });
    stmts.addToMyList.run(req.user.id, String(movie_id), movie_title, movie_thumbnail, movie_year, movie_rating);
    res.json({ success: true });
});

app.delete('/api/mylist/:movieId', authMiddleware, (req, res) => {
    stmts.removeFromMyList.run(req.user.id, req.params.movieId);
    res.json({ success: true });
});

app.get('/api/mylist/:movieId/check', authMiddleware, (req, res) => {
    const row = stmts.inMyList.get(req.user.id, req.params.movieId);
    res.json({ inList: !!row });
});

// ─── DOWNLOADS ────────────────────────────────────────────────────────────────

app.get('/api/downloads', authMiddleware, (req, res) => {
    res.json(stmts.getDownloads.all(req.user.id));
});

app.post('/api/downloads', authMiddleware, (req, res) => {
    const { movie_id, movie_title, movie_thumbnail = '', movie_year = '', movie_rating = '' } = req.body;
    if (!movie_id || !movie_title) return res.status(400).json({ error: 'movie_id and movie_title required' });
    stmts.addDownload.run(req.user.id, String(movie_id), movie_title, movie_thumbnail, movie_year, movie_rating);
    res.json({ success: true });
});

app.delete('/api/downloads/:movieId', authMiddleware, (req, res) => {
    stmts.removeDownload.run(req.user.id, req.params.movieId);
    res.json({ success: true });
});

// ─── WATCH HISTORY ────────────────────────────────────────────────────────────

app.post('/api/watch', authMiddleware, (req, res) => {
    const { movie_id, movie_title, duration_min = 1 } = req.body;
    stmts.addWatch.run(req.user.id, String(movie_id), movie_title, duration_min);
    stmts.addWatchHours.run(Math.ceil(duration_min / 60), req.user.id);
    res.json({ success: true });
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// GET /api/admin/stats
app.get('/api/admin/stats', adminMiddleware, (req, res) => {
    const totalUsers = stmts.getTotalUsers.get().count;
    const activeUsers = stmts.getActiveUsers.get().count;
    const totalWatchH = stmts.getTotalWatchH.get().total || 0;
    const totalSaves = stmts.getGlobalSaves.get().count || 0;
    const totalDownloads = stmts.getGlobalDownloads.get().count || 0;
    res.json({
        totalUsers, activeUsers,
        totalWatchHours: totalWatchH,
        avgWatchHours: totalUsers > 0 ? (totalWatchH / totalUsers).toFixed(1) : 0,
        totalSaves,
        totalDownloads
    });
});

// GET /api/admin/users
app.get('/api/admin/users', adminMiddleware, (req, res) => {
    res.json(stmts.getAllUsers.all());
});

// PUT /api/admin/users/:id
app.put('/api/admin/users/:id', adminMiddleware, (req, res) => {
    const { plan, status } = req.body;
    stmts.updateUserPlan.run(plan || 'Standard', status || 'Active', req.params.id);
    res.json({ success: true });
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', adminMiddleware, (req, res) => {
    stmts.deleteUser.run(req.params.id);
    res.json({ success: true });
});

// GET /api/admin/users/:id/details
app.get('/api/admin/users/:id/details', adminMiddleware, (req, res) => {
    const userId = req.params.id;
    const myList = stmts.getUserList.all(userId);
    const downloads = stmts.getUserDownloads.all(userId);
    const history = stmts.getWatchHistory.all(userId);
    res.json({ myList, downloads, history });
});

// ─── TMDB MOVIE ROUTES ────────────────────────────────────────────────────────
const movieCache = {};
let warmupPromise = null;

app.get('/api/movies/trending', async (req, res) => {
    if (warmupPromise) await warmupPromise;
    res.json(movieCache['trending'] || []);
});

app.get('/api/movies/genre/:name', async (req, res) => {
    if (warmupPromise) await warmupPromise;
    res.json(movieCache[req.params.name.toLowerCase()] || []);
});

// Cache Warm-up Function
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
        { name: 'wollywood', type: 'movie', with_original_language: 'hi' }
    ];

    for (const g of genres) {
        let success = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                if (g.isTrending) {
                    const { data } = await TMDB.get('/trending/all/week');
                    movieCache['trending'] = data.results.slice(0, 20).map(m => mapMovie(m, m.media_type === 'tv' ? 'TV Series' : 'Movie'));
                } else {
                    const params = { sort_by: 'popularity.desc', 'vote_count.gte': 100, page: 1, ...g };
                    delete params.name; delete params.type;
                    const { data } = await TMDB.get(g.type === 'tv' ? '/discover/tv' : '/discover/movie', { params });
                    const label = g.name.charAt(0).toUpperCase() + g.name.slice(1);
                    movieCache[g.name] = data.results.slice(0, 20).map(m => mapMovie(m, label));
                }
                console.log(`[Cache] Loaded ${g.name}`);
                success = true;
                await new Promise(r => setTimeout(r, 600)); // Delay between successful fetches
                break; // Break the retry loop
            } catch (err) {
                if (attempt === 3) {
                    console.error(`[Cache] Failed to load ${g.name} after 3 attempts:`, err.message);
                } else {
                    console.log(`[Cache] Retrying ${g.name} (Attempt ${attempt}/3)...`);
                    await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff on fail
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
    try {
        let data;
        try {
            const r = await TMDB.get(`/movie/${req.params.id}`, { params: { append_to_response: 'credits' } });
            data = { ...r.data, media_type: 'movie' };
        } catch {
            const r = await TMDB.get(`/tv/${req.params.id}`, { params: { append_to_response: 'credits' } });
            data = { ...r.data, media_type: 'tv' };
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

app.listen(PORT, () => {
    console.log(`🎬 Netflix Backend running on http://localhost:${PORT}`);
    warmupPromise = warmUpCache();
});
