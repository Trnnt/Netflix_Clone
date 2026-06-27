import { io } from 'socket.io-client';

const BASE = 'http://localhost:5000/api';
export const socket = io('http://localhost:5000');

// Tracking Helpers
export const trackLogin = (user) => socket.emit('user_login', { user });
export const trackDownload = (user, movie) => socket.emit('user_download', { user, movie_title: movie.title || movie.name });

export const trackWatch = (user, movie, { season = null, episode = null } = {}) => {
    socket.emit('user_watch', { user, movie_title: movie.title || movie.name });
    // Also persist to DB for profile activity
    const tok = localStorage.getItem('netflix_token');
    if (!tok) return;
    fetch(`${BASE}/watch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({
            movie_id: String(movie.id || movie.movie_id || Math.random()),
            movie_title: movie.title || movie.name || movie.movie_title || 'Unknown',
            movie_thumbnail: movie.thumbnail || movie.movie_thumbnail || '',
            duration_min: 1,
            season: season,
            episode: episode,
        }),
    }).catch(() => { }); // fire-and-forget
};


// Get token from localStorage
const token = () => localStorage.getItem('netflix_token') || '';

// Generic fetch helper for TMDB movie routes (no auth)
export async function apiFetch(path) {
    const res = await fetch(BASE + path);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// Generic fetch helper for authenticated routes
async function authFetch(path, options = {}) {
    const res = await fetch(BASE + path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token()}`,
            ...(options.headers || {}),
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Request failed');
    }
    return res.json();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export async function registerUser(name, email, password) {
    const res = await fetch(`${BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('netflix_token', data.token);
    localStorage.setItem('netflix_user', JSON.stringify(data.user));
    return data;
}

export async function loginUser(email, password) {
    const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('netflix_token', data.token);
    localStorage.setItem('netflix_user', JSON.stringify(data.user));
    return data;
}

export function logoutUser() {
    localStorage.removeItem('netflix_token');
    localStorage.removeItem('netflix_user');
}

export function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('netflix_user') || 'null'); } catch { return null; }
}

export async function getMe() {
    return authFetch('/auth/me');
}

// ─── MY LIST ──────────────────────────────────────────────────────────────────
export async function getMyList() { return authFetch('/mylist'); }
export async function addToMyList(movie) {
    return authFetch('/mylist', {
        method: 'POST',
        body: JSON.stringify({
            movie_id: String(movie.id),
            movie_title: movie.title,
            movie_thumbnail: movie.thumbnail || '',
            movie_year: movie.year || '',
            movie_rating: String(movie.rating || ''),
        }),
    });
}
export async function removeFromMyList(movieId) { return authFetch(`/mylist/${movieId}`, { method: 'DELETE' }); }
export async function checkInMyList(movieId) { return authFetch(`/mylist/${movieId}/check`); }

// ─── DOWNLOADS ────────────────────────────────────────────────────────────────
export async function getDownloads() { return authFetch('/downloads'); }
export async function addToDownloads(movie) {
    return authFetch('/downloads', {
        method: 'POST',
        body: JSON.stringify({
            movie_id: String(movie.id),
            movie_title: movie.title,
            movie_thumbnail: movie.thumbnail || '',
            movie_year: movie.year || '',
            movie_rating: String(movie.rating || ''),
        }),
    });
}
export async function removeFromDownloads(movieId) { return authFetch(`/downloads/${movieId}`, { method: 'DELETE' }); }

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export async function getAdminStats() { return authFetch('/admin/stats'); }
export async function getAdminUsers() { return authFetch('/admin/users'); }
export async function updateAdminUser(id, data) { return authFetch(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export async function deleteAdminUser(id) { return authFetch(`/admin/users/${id}`, { method: 'DELETE' }); }

// ─── EPISODES ─────────────────────────────────────────────────────────────────
export async function getTvSeasons(id) { return apiFetch(`/movies/tv/${id}/seasons`); }
export async function getSeasonEpisodes(id, num) { return apiFetch(`/movies/tv/${id}/season/${num}`); }
