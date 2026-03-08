import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'netflix.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── CREATE TABLES ────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'user',
    plan        TEXT    NOT NULL DEFAULT 'Standard',
    status      TEXT    NOT NULL DEFAULT 'Active',
    watch_hours INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS my_list (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id        TEXT    NOT NULL,
    movie_title     TEXT    NOT NULL,
    movie_thumbnail TEXT    NOT NULL DEFAULT '',
    movie_year      TEXT    NOT NULL DEFAULT '',
    movie_rating    TEXT    NOT NULL DEFAULT '',
    added_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, movie_id)
  );

  CREATE TABLE IF NOT EXISTS downloads (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id        TEXT    NOT NULL,
    movie_title     TEXT    NOT NULL,
    movie_thumbnail TEXT    NOT NULL DEFAULT '',
    movie_year      TEXT    NOT NULL DEFAULT '',
    movie_rating    TEXT    NOT NULL DEFAULT '',
    downloaded_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, movie_id)
  );

  CREATE TABLE IF NOT EXISTS watch_history (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id     TEXT    NOT NULL,
    movie_title  TEXT    NOT NULL,
    watched_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    duration_min INTEGER NOT NULL DEFAULT 0
  );
`);

// ─── SEED ADMIN ────────────────────────────────────────────────────────────────
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@netflix.com');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (name, email, password, role, plan, status, watch_hours)
              VALUES (?, ?, ?, 'admin', 'Premium', 'Active', 0)`)
    .run('Admin', 'admin@netflix.com', hash);
  console.log('🔑 Admin created — email: admin@netflix.com  password: admin123');
}

// ─── PREPARED STATEMENTS ───────────────────────────────────────────────────────
export const stmts = {
  // Auth
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  getUserById: db.prepare('SELECT id, name, email, role, plan, status, watch_hours, created_at FROM users WHERE id = ?'),
  createUser: db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)'),

  // My List
  getMyList: db.prepare('SELECT * FROM my_list WHERE user_id = ? ORDER BY added_at DESC'),
  addToMyList: db.prepare(`INSERT OR IGNORE INTO my_list (user_id, movie_id, movie_title, movie_thumbnail, movie_year, movie_rating)
                                VALUES (?, ?, ?, ?, ?, ?)`),
  removeFromMyList: db.prepare('DELETE FROM my_list WHERE user_id = ? AND movie_id = ?'),
  inMyList: db.prepare('SELECT id FROM my_list WHERE user_id = ? AND movie_id = ?'),

  // Downloads
  getDownloads: db.prepare('SELECT * FROM downloads WHERE user_id = ? ORDER BY downloaded_at DESC'),
  addDownload: db.prepare(`INSERT OR IGNORE INTO downloads (user_id, movie_id, movie_title, movie_thumbnail, movie_year, movie_rating)
                                VALUES (?, ?, ?, ?, ?, ?)`),
  removeDownload: db.prepare('DELETE FROM downloads WHERE user_id = ? AND movie_id = ?'),

  // Watch history
  addWatch: db.prepare('INSERT INTO watch_history (user_id, movie_id, movie_title, duration_min) VALUES (?, ?, ?, ?)'),
  addWatchHours: db.prepare('UPDATE users SET watch_hours = watch_hours + ? WHERE id = ?'),

  // Admin
  getAllUsers: db.prepare('SELECT id, name, email, role, plan, status, watch_hours, created_at FROM users ORDER BY created_at DESC'),
  getTotalUsers: db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'admin'"),
  getActiveUsers: db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'Active' AND role != 'admin'"),
  getTotalWatchH: db.prepare("SELECT SUM(watch_hours) as total FROM users WHERE role != 'admin'"),
  updateUserPlan: db.prepare('UPDATE users SET plan = ?, status = ? WHERE id = ?'),
  deleteUser: db.prepare("DELETE FROM users WHERE id = ? AND role != 'admin'"),

  // New Admin Detail Statements
  getGlobalSaves: db.prepare("SELECT COUNT(*) as count FROM my_list"),
  getGlobalDownloads: db.prepare("SELECT COUNT(*) as count FROM downloads"),
  getWatchHistory: db.prepare("SELECT * FROM watch_history WHERE user_id = ? ORDER BY watched_at DESC"),
  getUserList: db.prepare("SELECT * FROM my_list WHERE user_id = ? ORDER BY added_at DESC"),
  getUserDownloads: db.prepare("SELECT * FROM downloads WHERE user_id = ? ORDER BY downloaded_at DESC"),
};


export default db;
