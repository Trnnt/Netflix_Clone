import React, { useState, useEffect } from 'react';
import { Users, Play, Download, ThumbsUp, Heart, BarChart2, Activity, Clock, LogOut, ChevronRight, ShieldCheck, Database, Zap } from 'lucide-react';

const ADMIN_MOCK_DATA = {
    stats: [
        { label: 'Total Users', value: '45,289', change: '+12%', icon: <Users size={20} /> },
        { label: 'Active Members', value: '12,842', change: '+5%', icon: <Activity size={20} /> },
        { label: 'Avg. Watch Time', value: '2.4 hrs', change: '+18%', icon: <Clock size={20} /> },
        { label: 'Monthly Revenue', value: '$128.4k', change: '+9%', icon: <Zap size={20} /> },
    ],
    watchingNow: [
        { category: 'Movies', count: 4200, color: '#e50914' },
        { category: 'TV Series', count: 3100, color: '#3b82f6' },
        { category: 'Anime', count: 2800, color: '#46d369' },
        { category: 'Cartoons', count: 1200, color: '#f6c90e' },
        { category: 'K-Drama', count: 1542, color: '#9333ea' },
    ],
    engagement: [
        { type: 'Anime', watched: '1.2M', downloads: '450k', likes: '890k', favorites: '230k' },
        { type: 'Movies', watched: '2.4M', downloads: '1.1M', likes: '1.5M', favorites: '680k' },
        { type: 'Series', watched: '1.8M', downloads: '920k', likes: '1.2M', favorites: '540k' },
        { type: 'Cartoon', watched: '680k', downloads: '210k', likes: '420k', favorites: '120k' },
    ],
    monthlyWatch: [
        { month: 'Oct', hours: 12000 },
        { month: 'Nov', hours: 15000 },
        { month: 'Dec', hours: 18500 },
        { month: 'Jan', hours: 22000 },
        { month: 'Feb', hours: 20000 },
        { month: 'Mar', hours: 25400 },
    ],
    systemHealth: [
        { name: 'API Gateway', status: 'Online', load: '14%' },
        { name: 'Content CDN', status: 'Online', load: '32%' },
        { name: 'User Database', status: 'Optimized', load: '8%' },
    ]
};

const MOCK_USERS = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'Active', plan: 'Premium', joined: '2024-01-12', watchHours: '156h' },
    { id: 2, name: 'Bob Smith', email: 'bob@tech.com', status: 'Inactive', plan: 'Standard', joined: '2024-02-05', watchHours: '42h' },
    { id: 3, name: 'Charlie Davis', email: 'charlie@web.io', status: 'Active', plan: 'Basic', joined: '2023-11-20', watchHours: '89h' },
    { id: 4, name: 'Diana Prince', email: 'diana@hero.com', status: 'Active', plan: 'Premium', joined: '2024-03-01', watchHours: '210h' },
];

const MOCK_CONTENT = [
    { id: 1, title: 'Stranger Things', category: 'TV Series', views: '1.2M', rating: '9.8' },
    { id: 2, title: 'Inception', category: 'Movies', views: '850k', rating: '9.5' },
    { id: 3, title: 'Solo Leveling', category: 'Anime', views: '2.1M', rating: '9.9' },
    { id: 4, title: 'Naruto', category: 'Anime', views: '5.4M', rating: '9.7' },
];

function AdminDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [liveLogs, setLiveLogs] = useState([]);

    const token = () => localStorage.getItem('netflix_token') || '';

    const api = async (path, opts = {}) => {
        const r = await fetch('http://localhost:5000' + path, {
            ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) }
        });
        if (!r.ok) throw new Error((await r.json()).error || 'Failed');
        return r.json();
    };

    const load = async () => {
        setLoading(true);
        try {
            const [s, u] = await Promise.all([api('/api/admin/stats'), api('/api/admin/users')]);
            setStats(s); setUsers(u);
        } catch (e) { setMsg('⚠️ ' + e.message); }
        setLoading(false);
    };

    const loadUserDetails = async (user) => {
        setLoading(true);
        setSelectedUser(user);
        try {
            const details = await api(`/api/admin/users/${user.id}/details`);
            setUserDetails(details);
            setActiveTab('user-detail');
        } catch (e) { setMsg('⚠️ ' + e.message); }
        setLoading(false);
    };

    useEffect(() => {
        load();
        import('../services/movieApi.js').then(({ socket }) => {
            socket.on('admin_live_update', (data) => {
                let action = '';
                if (data.type === 'login') action = `${data.user?.name || 'A user'} logged in.`;
                else if (data.type === 'watch') action = `${data.user?.name || 'A user'} started watching ${data.movie_title}.`;
                else if (data.type === 'download') action = `${data.user?.name || 'A user'} downloaded ${data.movie_title}.`;

                if (action) {
                    setLiveLogs(prev => [`[${new Date(data.timestamp).toLocaleTimeString()}] 🟢 LIVE: ${action}`, ...prev].slice(0, 50));
                }
            });
        });
    }, []);

    const handlePlan = async (id, plan, status) => {
        try { await api(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ plan, status }) }); setMsg('✅ User updated!'); load(); } catch (e) { setMsg('⚠️ ' + e.message); }
        setTimeout(() => setMsg(''), 3000);
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        try { await api(`/api/admin/users/${id}`, { method: 'DELETE' }); setMsg('✅ User deleted!'); load(); } catch (e) { setMsg('⚠️ ' + e.message); }
        setTimeout(() => setMsg(''), 3000);
    };

    const renderUserDetails = () => {
        if (!selectedUser || !userDetails) return null;
        const { myList, downloads, history } = userDetails;
        return (
            <div className="admin-section animate-fade">
                <div className="section-header">
                    <button className="text-btn" onClick={() => setActiveTab('users')}>← Back to Users</button>
                    <h2>Deep Dive: {selectedUser.name}</h2>
                </div>

                <div className="admin-grid">
                    <div className="metrics-row">
                        <div className="metric-card">
                            <div className="metric-header"><div className="metric-icon"><Heart size={20} /></div></div>
                            <div className="metric-body"><h3>{myList.length}</h3><p>Items in My List</p></div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-header"><div className="metric-icon"><Download size={20} /></div></div>
                            <div className="metric-body"><h3>{downloads.length}</h3><p>Total Downloads</p></div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-header"><div className="metric-icon"><Clock size={20} /></div></div>
                            <div className="metric-body"><h3>{selectedUser.watch_hours}h</h3><p>Lifetime Watch Time</p></div>
                        </div>
                    </div>

                    <div className="middle-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="viz-card">
                            <h3>Live "My List" Content</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {myList.map(m => (
                                    <div key={m.movie_id} style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: 8 }}>
                                        <img src={m.movie_thumbnail} style={{ width: 60, height: 35, objectFit: 'cover', borderRadius: 4 }} alt="" />
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{m.movie_title}</p>
                                            <p style={{ fontSize: 11, opacity: .5, margin: 0 }}>Added {m.added_at.slice(0, 10)}</p>
                                        </div>
                                    </div>
                                ))}
                                {myList.length === 0 && <p style={{ opacity: .3, fontSize: 13 }}>List is empty</p>}
                            </div>
                        </div>
                        <div className="viz-card">
                            <h3>Recent Watch History</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {history.map(h => (
                                    <div key={h.id} style={{ borderBottom: '1px solid #222', paddingBottom: 8 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px 0' }}>{h.movie_title}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: .5 }}>
                                            <span>{h.watched_at.slice(0, 16).replace('T', ' ')}</span>
                                            <span>{h.duration_min} mins watched</span>
                                        </div>
                                    </div>
                                ))}
                                {history.length === 0 && <p style={{ opacity: .3, fontSize: 13 }}>No history yet</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,.4)', fontSize: 14 }}>⏳ Syncing live data...</div>;
        if (activeTab === 'user-detail') return renderUserDetails();

        switch (activeTab) {
            case 'users':
                return (
                    <div className="admin-section animate-fade">
                        <div className="section-header"><h2>User Management <span style={{ fontSize: 13, fontWeight: 400, opacity: .5 }}>({users.filter(u => u.role !== 'admin').length} users)</span></h2>
                            <button className="btn-primary" onClick={load}>🔄 Refresh</button>
                        </div>
                        <div className="viz-card full-width">
                            <table className="admin-table">
                                <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Plan</th><th>Joined</th><th>Watch Hrs</th><th>Activity</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {users.filter(u => u.role !== 'admin').map(u => (
                                        <tr key={u.id}>
                                            <td className="bold">{u.name}</td>
                                            <td>{u.email}</td>
                                            <td><span className={`status-pill ${u.status.toLowerCase()}`}>{u.status}</span></td>
                                            <td>
                                                <select value={u.plan} style={{ background: '#222', color: '#fff', border: '1px solid #333', padding: '3px 6px', borderRadius: 3, fontSize: 12 }}
                                                    onChange={e => handlePlan(u.id, e.target.value, u.status)}>
                                                    {['Basic', 'Standard', 'Premium'].map(p => <option key={p}>{p}</option>)}
                                                </select>
                                            </td>
                                            <td>{u.created_at?.slice(0, 10) || '—'}</td>
                                            <td className="bold text-red">{u.watch_hours}h</td>
                                            <td><button className="text-btn" onClick={() => loadUserDetails(u)}>View Details →</button></td>
                                            <td style={{ display: 'flex', gap: 6 }}>
                                                <button className="text-btn" onClick={() => handlePlan(u.id, u.plan, u.status === 'Active' ? 'Inactive' : 'Active')}>
                                                    {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button className="text-btn" style={{ color: '#f87171' }} onClick={() => handleDelete(u.id, u.name)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.filter(u => u.role !== 'admin').length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', opacity: .4, padding: '24px' }}>No users registered yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'content':
                return (
                    <div className="admin-section animate-fade">
                        <div className="section-header"><h2>Live Content Insights</h2><div style={{ fontSize: 12, opacity: .5 }}>Real-time TMDB & Local Engagement</div></div>
                        <div className="metrics-row" style={{ marginBottom: 30 }}>
                            <div className="metric-card">
                                <div className="metric-header"><div className="metric-icon"><Play size={20} /></div></div>
                                <div className="metric-body"><h3>{stats.totalWatchHours || 0}h</h3><p>Total Hours Streamed</p></div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-header"><div className="metric-icon"><Heart size={20} /></div></div>
                                <div className="metric-body"><h3>{stats.totalSaves || 0}</h3><p>Total User Saves</p></div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-header"><div className="metric-icon"><Download size={20} /></div></div>
                                <div className="metric-body"><h3>{stats.totalDownloads || 0}</h3><p>Total Downloads</p></div>
                            </div>
                        </div>
                        <div className="admin-grid-3">
                            {MOCK_CONTENT.map(c => (
                                <div key={c.id} className="viz-card content-card">
                                    <div className="content-badge">{c.category}</div>
                                    <h3>{c.title}</h3>
                                    <div className="content-stats">
                                        <span><Play size={14} /> {c.views}</span>
                                        <span><Heart size={14} color="#e50914" /> {c.rating}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'logs':
                return (
                    <div className="admin-section animate-fade">
                        <h2>Real-Time Live Tracking</h2>
                        <div className="viz-card full-width log-console">
                            {liveLogs.length === 0 && <div className="log-entry" style={{ opacity: .5 }}>Listening for live user events... 👀</div>}
                            {liveLogs.map((log, i) => <div key={i} className="log-entry" style={{ color: '#46d369' }}>{log}</div>)}
                            <br />
                            <div className="log-entry" style={{ opacity: .5 }}><span>[{new Date().toISOString().slice(0, 19)}]</span> INFO: Admin panel accessed</div>
                            <div className="log-entry" style={{ opacity: .5 }}><span>[{new Date().toISOString().slice(0, 19)}]</span> INFO: {stats.totalUsers || 0} users in database</div>
                            <div className="log-entry" style={{ opacity: .5 }}><span>[{new Date().toISOString().slice(0, 19)}]</span> INFO: {stats.activeUsers || 0} active users</div>
                            <div className="log-entry" style={{ opacity: .5 }}><span>[{new Date().toISOString().slice(0, 19)}]</span> INFO: {stats.totalWatchHours || 0}h total watch hours logged</div>
                            <div className="log-entry" style={{ opacity: .5 }}><span>[{new Date().toISOString().slice(0, 19)}]</span> SUCCESS: Real-time DB sync active</div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="admin-grid">
                        <div className="metrics-row">
                            {[
                                { label: 'Total Users', value: stats.totalUsers || 0, icon: <Users size={20} /> },
                                { label: 'Active Members', value: stats.activeUsers || 0, icon: <Activity size={20} /> },
                                { label: 'Total Saves', value: stats.totalSaves || 0, icon: <Heart size={20} /> },
                                { label: 'Total Downloads', value: stats.totalDownloads || 0, icon: <Download size={20} /> },
                            ].map(s => (
                                <div key={s.label} className="metric-card">
                                    <div className="metric-header"><div className="metric-icon">{s.icon}</div><span className="metric-change">Live</span></div>
                                    <div className="metric-body"><h3>{s.value}</h3><p>{s.label}</p></div>
                                </div>
                            ))}
                        </div>
                        <div className="middle-row">
                            <div className="viz-card watching-now">
                                <h3>Global User Distribution</h3>
                                <div className="chart-bars">
                                    {['Basic', 'Standard', 'Premium'].map(plan => {
                                        const count = users.filter(u => u.plan === plan && u.role !== 'admin').length;
                                        const colors = { Basic: '#46d369', Standard: '#3b82f6', Premium: '#e50914' };
                                        return (
                                            <div key={plan} className="chart-bar-item" style={{ marginBottom: 12 }}>
                                                <div className="bar-labels"><span>{plan} Plan</span><span>{count} users</span></div>
                                                <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(5, (count / (stats.totalUsers || 1)) * 100)}%`, backgroundColor: colors[plan] }} /></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="viz-card watch-trend">
                                <h3>Most Active Users</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
                                    {[...users].filter(u => u.role !== 'admin').sort((a, b) => b.watch_hours - a.watch_hours).slice(0, 5).map(u => (
                                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #222', paddingBottom: 6 }}>
                                            <div>
                                                <p style={{ fontWeight: 600, margin: 0 }}>{u.name}</p>
                                                <p style={{ fontSize: 11, opacity: .45, margin: 0 }}>{u.watch_hours} hrs watched</p>
                                            </div>
                                            <button className="text-btn" onClick={() => loadUserDetails(u)}>Details</button>
                                        </div>
                                    ))}
                                    {!users.filter(u => u.role !== 'admin').length && <p style={{ textAlign: 'center', opacity: .3, fontSize: 12 }}>No users yet</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="admin-dashboard dark">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-top">
                    <div className="admin-brand"><ShieldCheck color="#e50914" size={24} /><span>Admin Panel</span></div>
                    <nav className="admin-nav">
                        <button onClick={() => setActiveTab('overview')} className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}><BarChart2 size={18} /> Overview</button>
                        <button onClick={() => { setActiveTab('users'); setSelectedUser(null); }} className={`admin-nav-item ${activeTab === 'users' || activeTab === 'user-detail' ? 'active' : ''}`}><Users size={18} /> User Detail</button>
                        <button onClick={() => setActiveTab('content')} className={`admin-nav-item ${activeTab === 'content' ? 'active' : ''}`}><Database size={18} /> Engagement</button>
                        <button onClick={() => setActiveTab('logs')} className={`admin-nav-item ${activeTab === 'logs' ? 'active' : ''}`}><Activity size={18} /> Sys Health</button>
                    </nav>
                </div>
                <div className="admin-sidebar-bottom">
                    {msg && <div style={{ fontSize: 12, padding: '6px 12px', color: msg.startsWith('✅') ? '#46d369' : '#f87171', wordBreak: 'break-word', animation: 'fade .3s' }}>{msg}</div>}
                    <button className="theme-toggle" onClick={load}><Zap size={18} /> Push Sync</button>
                    <button className="admin-logout" onClick={onLogout}><LogOut size={18} /> Exit Admin</button>
                </div>
            </aside>
            <main className="admin-main">
                <header className="admin-header">
                    <div className="admin-greeting">
                        <h1>{activeTab === 'user-detail' ? 'User Deep Dive' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                        <p>Live Monitoring Engine · v2.0</p>
                    </div>
                    <div className="admin-refresh-status"><div className="status-dot" /><span>Live Sync Active</span></div>
                </header>
                {renderContent()}
            </main>
        </div>
    );
}





export default function LoginPage({ onLogin, isAdminView: forceAdminView }) {
    const [mode, setMode] = useState('login');   // 'login' | 'register'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            let data;
            if (mode === 'register') {
                if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
                const res = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });
                data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Registration failed');
            } else {
                const res = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Login failed');
            }
            localStorage.setItem('netflix_token', data.token);
            localStorage.setItem('netflix_user', JSON.stringify(data.user));

            // 📡 Socket.io Live Telemetry
            import('../services/movieApi.js').then(({ trackLogin }) => trackLogin(data.user)).catch(() => { });

            onLogin(); // Trigger App recheck
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (forceAdminView) {
        return <AdminDashboard onLogout={() => { localStorage.removeItem('netflix_token'); localStorage.removeItem('netflix_user'); onLogin(); }} />;
    }

    return (
        <div className="login-page">
            <style>{`
                .rimuru-logo {
                    font-size: 45px;
                    font-weight: 950;
                    letter-spacing: -2px;
                    background: linear-gradient(135deg, #e50914 0%, #7c3aed 50%, #3b82f6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    filter: drop-shadow(0 0 15px rgba(124,58,237,0.4));
                    animation: rimuruIntro 1.2s cubic-bezier(0.2, 0, 0.2, 1) forwards;
                    user-select: none;
                    cursor: default;
                }
                @keyframes rimuruIntro {
                    0% { transform: scale(1.5); filter: blur(20px) brightness(2); opacity: 0; letter-spacing: 20px; }
                    60% { transform: scale(1.1); filter: blur(0px) brightness(1.2); opacity: 1; letter-spacing: -2px; }
                    100% { transform: scale(1); filter: blur(0px) brightness(1); opacity: 1; letter-spacing: -2px; }
                }
                .login-signup-now a { color: #7c3aed !important; }
                .login-btn { background: linear-gradient(90deg, #e50914, #7c3aed) !important; border: none !important; }
                .login-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
            `}</style>
            <div className="login-bg">
                <img src="https://assets.nflxext.com/FFE/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg" alt="Background" />
            </div>
            <header className="login-header">
                <div className="rimuru-logo">RIMURU</div>
            </header>
            <div className="login-body">
                <div className="login-form-wrapper">
                    <h2>{mode === 'register' ? 'Create Account' : 'Sign In'}</h2>
                    {error && (
                        <div style={{ background: 'rgba(229,9,20,.15)', border: '1px solid rgba(229,9,20,.4)', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ff6b6b' }}>
                            ⚠️ {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="login-form">
                        {mode === 'register' && (
                            <div className="input-group">
                                <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)} />
                            </div>
                        )}
                        <div className="input-group">
                            <input type="email" placeholder="Email address" required value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <input type="password" placeholder="Password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="login-btn" disabled={loading} style={{ transition: 'all 0.3s' }}>
                            {loading ? '⏳ Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>
                    <div className="login-bottom" style={{ marginTop: 20 }}>
                        <p className="login-signup-now">
                            {mode === 'login' ? 'New to Rimuru? ' : 'Already have an account? '}
                            <a href="#" onClick={e => { e.preventDefault(); setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
                                {mode === 'login' ? 'Sign up now' : 'Sign in'}
                            </a>
                        </p>
                        <div style={{ marginTop: 15, textAlign: 'center', borderTop: '1px solid #333', paddingTop: 15 }}>
                            <button onClick={(e) => { e.preventDefault(); setEmail('admin@rimuru.com'); setPassword('admin123'); setMode('login'); }} style={{ background: '#333', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: 13, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                Access Admin Panel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

