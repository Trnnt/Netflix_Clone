import React, { useState, useEffect } from 'react';
import { 
    Users, Play, Download, ThumbsUp, Heart, BarChart2, Activity, Clock, LogOut, 
    ChevronRight, ShieldCheck, Database, Zap, Eye, EyeOff, AlertCircle 
} from 'lucide-react';
import { trackLogin } from '../services/movieApi.js';

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
    const [contentInsights, setContentInsights] = useState({ topWatched: [], topSaved: [], topDownloaded: [] });
    const [health, setHealth] = useState(null);

    const token = () => localStorage.getItem('netflix_token') || '';

    const api = async (path, opts = {}) => {
        // Ensure path starts with /api if not present
        const fullPath = path.startsWith('/api') ? path : '/api' + path;
        const r = await fetch('https://netflix-backend-n0s4.onrender.com' + fullPath, {
            ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) }
        });
        if (!r.ok) {
            if (r.status === 404) throw new Error(`🚨 Endpoint not found: ${fullPath}`);
            throw new Error((await r.json()).error || 'Failed');
        }
        return r.json();
    };

    const load = async () => {
        setLoading(true);
        try {
            // Fetch everything individually to prevent one 404 from blocking others
            api('/api/admin/stats').then(setStats).catch(e => {
                console.warn('Stats fetch failed:', e);
                setMsg('⚠️ Stats: ' + e.message);
            });
            
            api('/api/admin/users').then(setUsers).catch(e => {
                console.warn('Users fetch failed:', e);
            });
            
            api('/api/admin/content-insights').then(setContentInsights).catch(e => {
                console.warn('Insights fetch failed:', e);
                setMsg(e.message); // This shows the red badge 🚨
            });
            
            api('/api/admin/sys-health').then(setHealth).catch(e => {
                console.warn('Health fetch failed:', e);
            });

        } catch (e) {
            console.error('Admin Load Failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadUserDetails = async (user) => {
        setLoading(true);
        setSelectedUser(user);
        try {
            const details = await api(`/api/admin/users/${user._id || user.id}/details`);
            setUserDetails(details);
            setActiveTab('user-detail');
        } catch (e) { 
            console.error('User Detail Fetch Failed:', e);
            setMsg('⚠️ ' + e.message); 
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
        import('../services/movieApi.js').then(({ socket }) => {
            if (socket) {
                socket.on('admin_live_update', (data) => {
                    console.log('📡 Admin Socket Event:', data);
                    let action = '';
                    if (data.type === 'login') action = `${data.user?.name || 'A user'} logged in.`;
                    else if (data.type === 'watch') action = `${data.user?.name || 'A user'} started watching ${data.movie_title}.`;
                    else if (data.type === 'download') action = `${data.user?.name || 'A user'} downloaded ${data.movie_title}.`;

                    if (action) {
                        setLiveLogs(prev => [`[${new Date(data.timestamp).toLocaleTimeString()}] 🟢 LIVE: ${action}`, ...prev].slice(0, 50));
                    }
                });
                socket.on('connect_error', (err) => console.error('❌ Socket Connection Error:', err));
            }
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
                            <div className="metric-body"><h3>{selectedUser.watch_hours || 0}h</h3><p>Lifetime Watch Time</p></div>
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
                                    <div key={h._id || h.id} style={{ borderBottom: '1px solid #222', paddingBottom: 8 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px 0' }}>{h.movie_title}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: .5 }}>
                                            <span>{h.createdAt ? new Date(h.createdAt).toLocaleString() : 'Recently'}</span>
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
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Plan</th><th>Joined</th><th>Watch Hrs</th><th>Activity</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                                    <tbody>
                                        {users.filter(u => u.role !== 'admin').map(u => (
                                            <tr key={u._id || u.id}>
                                                <td className="bold">{u.name}</td>
                                                <td>{u.email}</td>
                                                <td><span className={`status-pill ${u.status.toLowerCase()}`}>{u.status}</span></td>
                                                <td>
                                                    <select value={u.plan} style={{ background: '#222', color: '#fff', border: '1px solid #333', padding: '3px 6px', borderRadius: 3, fontSize: 12 }}
                                                        onChange={e => handlePlan(u._id || u.id, e.target.value, u.status)}>
                                                        {['Basic', 'Standard', 'Premium'].map(p => <option key={p}>{p}</option>)}
                                                    </select>
                                                </td>
                                                <td>{u.created_at?.slice(0, 10) || u.createdAt?.slice(0, 10) || '—'}</td>
                                                <td className="bold text-red">{u.watch_hours ? u.watch_hours.toFixed(1) : 0}h</td>
                                                <td><button className="text-btn" onClick={() => loadUserDetails(u)}>View Details →</button></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', gap: 10 }}>
                                                        <button className="text-btn" onClick={() => handlePlan(u._id || u.id, u.plan, u.status === 'Active' ? 'Inactive' : 'Active')}>
                                                            {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button className="text-btn" style={{ color: '#f87171' }} onClick={() => handleDelete(u._id || u.id, u.name)}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.filter(u => u.role !== 'admin').length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', opacity: .4, padding: '24px' }}>No users registered yet.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
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
                            {contentInsights.topWatched.map(c => (
                                <div key={c._id} className="viz-card content-card">
                                    <div className="content-badge">Trending</div>
                                    <h3>{c.title || 'Untitled Content'}</h3>
                                    <p style={{ fontSize: 11, opacity: .4, margin: '-10px 0 10px 0' }}>ID: {c._id}</p>
                                    <div className="content-stats">
                                        <span><Play size={14} /> {c.views} views</span>
                                        <span><Activity size={14} color="#e50914" /> Real-time</span>
                                    </div>
                                </div>
                            ))}
                            {contentInsights.topWatched.length === 0 && <div className="viz-card" style={{ gridColumn: 'span 3', textAlign: 'center', opacity: .4 }}>No engagement data found. Try watching some movies!</div>}
                        </div>
                    </div>
                );
            case 'logs':
                return (
                    <div className="admin-section animate-fade">
                        <div className="section-header"><h2>System Health & Tracking</h2></div>
                        
                        {health && (
                            <div className="metrics-row" style={{ marginBottom: 24 }}>
                                <div className="metric-card">
                                    <div className="metric-header"><div className="metric-icon"><Zap size={20} /></div></div>
                                    <div className="metric-body"><h3>{health.memory.percent}%</h3><p>RAM ({health.memory.used}GB/{health.memory.total}GB)</p></div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-header"><div className="metric-icon"><Activity size={20} /></div></div>
                                    <div className="metric-body"><h3>{health.cpu.load}%</h3><p>CPU Load ({health.cpu.count} Cores)</p></div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-header"><div className="metric-icon"><Clock size={20} /></div></div>
                                    <div className="metric-body"><h3>{Math.floor(health.uptime / 3600)}h</h3><p>System Uptime</p></div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-header"><div className="metric-icon"><Database size={20} /></div></div>
                                    <div className="metric-body"><h3>{health.db}</h3><p>Database Status</p></div>
                                </div>
                            </div>
                        )}

                        <div className="admin-grid">
                            <div className="middle-row" style={{ gridTemplateColumns: '2fr 1.2fr' }}>
                                <div className="viz-card log-console" style={{ height: 450 }}>
                                    <h3>Live Activity Log</h3>
                                    {liveLogs.length === 0 && <div className="log-entry" style={{ opacity: .5 }}>Listening for live user events... 👀</div>}
                                    {liveLogs.map((log, i) => <div key={i} className="log-entry" style={{ color: '#46d369' }}>{log}</div>)}
                                </div>
                                <div className="viz-card">
                                    <h3>System Environment</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {[
                                            { label: 'Platform', val: health?.platform || '—' },
                                            { label: 'Node Version', val: health?.nodeVersion || '—' },
                                            { label: 'Admin Role', val: 'Rimuru Head' },
                                            { label: 'API Status', val: 'Online (200 OK)' },
                                            { label: 'Socket.io', val: 'Connected' },
                                        ].map(item => (
                                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                                <span style={{ opacity: .5 }}>{item.label}</span>
                                                <span style={{ fontWeight: 600 }}>{item.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
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
                        <div className="middle-row" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 350px)' }}>
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
                                        <div key={u._id || u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #222', paddingBottom: 6 }}>
                                            <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
                                                <p style={{ fontWeight: 600, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{u.name}</p>
                                                <p style={{ fontSize: 11, opacity: .45, margin: 0 }}>{(u.watch_hours || 0).toFixed(1)} hrs watched</p>
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
    const [mode, setMode] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let data;
            if (mode === 'register') {
                if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
                const res = await fetch('https://netflix-backend-n0s4.onrender.com/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });
                data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Registration failed');
            } else {
                const res = await fetch('https://netflix-backend-n0s4.onrender.com/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem('netflix_token', data.token);
            localStorage.setItem('netflix_user', JSON.stringify(data.user));
            
            // Notify Admin Panel about domestic activity
            trackLogin(data.user);
            
            onLogin();
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
                .login-page {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #000;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .login-bg {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    opacity: 0.35;
                    z-index: 0;
                }
                .login-bg img { width: 100%; height: 100%; object-fit: cover; }

                .login-header { padding: 10px 20px; text-align: center; z-index: 10; position: relative; }
                .rimuru-logo {
                    font-size: 38px;
                    font-weight: 900;
                    letter-spacing: -2px;
                    color: #e50914;
                    text-shadow: 0 0 20px rgba(229,9,20,0.4);
                    margin: 0;
                }
                .rimuru-tagline { font-size: 11px; color: rgba(255,255,255,0.6); letter-spacing: 1.5px; text-transform: uppercase; margin-top: -5px; }

                .login-body { flex: 1; display: flex; justify-content: center; align-items: center; padding: 5px 20px; z-index: 10; position: relative; }
                .login-form-wrapper {
                    background: rgba(0, 0, 0, 0.75);
                    padding: 24px 40px;
                    border-radius: 4px;
                    width: 100%;
                    max-width: 450px;
                }
                .login-form-wrapper h2 { color: #fff; font-size: 28px; font-weight: 700; margin-bottom: 20px; }

                .input-group { margin-bottom: 16px; position: relative; }
                .input-group input {
                    width: 100%;
                    padding: 16px 20px;
                    background: #333;
                    border: none;
                    border-radius: 4px;
                    color: #fff;
                    font-size: 16px;
                }
                .input-group input:focus { background: #454545; outline: none; }
                .password-toggle { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #8c8c8c; cursor: pointer; }

                .login-btn {
                    width: 100%;
                    padding: 16px;
                    background: #e50914;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    font-size: 16px;
                    font-weight: 700;
                    margin-top: 16px;
                    cursor: pointer;
                }
                .login-btn:hover { background: #f40612; }
                .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .error-message { background: #e87c03; border-radius: 4px; color: #fff; padding: 10px 20px; font-size: 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }

                .login-bottom { margin-top: 30px; }
                .login-signup-now { color: #737373; font-size: 16px; }
                .login-signup-now a { color: #fff; text-decoration: none; }
                .login-signup-now a:hover { text-decoration: underline; }

                .admin-access-btn {
                    width: 100%;
                    padding: 10px;
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                }
                .admin-access-btn:hover { background: rgba(255,255,255,0.2); }

                /* ============================================================================ */
                /* ADMIN DASHBOARD STYLES */
                /* ============================================================================ */
                .admin-dashboard { display: flex; height: 100vh; background: #000; color: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
                .admin-sidebar { width: 260px; background: #000; border-right: 1px solid #222; display: flex; flex-direction: column; padding: 24px 16px; }
                .admin-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; font-size: 20px; font-weight: 800; color: #fff; }
                .admin-nav { flex: 1; display: flex; flex-direction: column; gap: 4px; }
                .admin-nav-item {
                    display: flex; align-items: center; gap: 12px; padding: 12px 16px;
                    border-radius: 8px; color: #888; border: none; background: none;
                    cursor: pointer; text-align: left; transition: .2s; font-size: 14px;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    width: 100%;
                }
                .admin-nav-item:hover { color: #fff; background: #111; }
                .admin-nav-item.active { color: #fff; background: #111; border: 1px solid #333; }
                .admin-sidebar-bottom { border-top: 1px solid #222; padding-top: 20px; display: flex; flex-direction: column; gap: 10px; }
                .theme-toggle, .admin-logout {
                    display: flex; align-items: center; gap: 12px; padding: 10px 16px;
                    border-radius: 8px; color: #888; border: none; background: none;
                    cursor: pointer; transition: .2s; font-size: 13px;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    width: 100%;
                }
                .theme-toggle:hover, .admin-logout:hover { color: #fff; background: #111; }
                .admin-logout { color: #f87171; }

                .admin-main { flex: 1; overflow-y: auto; padding: 40px; background: #000; position: relative; }
                .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; gap: 20px; }
                .admin-greeting h1 { font-size: 28px; font-weight: 800; margin: 0; }
                .admin-greeting p { color: #666; font-size: 13px; margin: 4px 0 0 0; }
                .admin-refresh-status { display: flex; align-items: center; gap: 8px; color: #46d369; font-size: 12px; font-weight: 600; white-space: nowrap; }
                .status-dot { width: 8px; height: 8px; background: #46d369; border-radius: 50%; box-shadow: 0 0 10px #46d369; }

                .admin-grid { display: flex; flex-direction: column; gap: 24px; }
                .metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                .metric-card { background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; transition: .3s; }
                .metric-card:hover { border-color: #333; transform: translateY(-2px); }
                .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .metric-icon { color: #e50914; }
                .metric-change { font-size: 11px; color: #46d369; background: rgba(70,211,105,0.1); padding: 2px 8px; border-radius: 10px; }
                .metric-body h3 { font-size: 20px; font-weight: 800; margin: 0; }
                .metric-body p { margin: 2px 0 0 0; font-size: 11px; color: #555; text-transform: uppercase; font-weight: 600; }

                .middle-row { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; align-items: start; }
                .viz-card { background: #111; border: 1px solid #222; border-radius: 12px; padding: 24px; min-width: 0; position: relative; }
                .viz-card h3 { font-size: 14px; font-weight: 700; margin: 0 0 20px 0; color: #555; text-transform: uppercase; letter-spacing: 1px; }
                .full-width { grid-column: 1 / -1; width: 100%; overflow-x: auto; }
                .admin-table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
                .admin-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: auto; }
                .admin-table th { text-align: left; padding: 12px; color: #555; border-bottom: 1px solid #222; white-space: nowrap; }
                .admin-table td { padding: 12px; border-bottom: 1px solid #111; color: #999; white-space: nowrap; vertical-align: middle; }
                .admin-table tr:hover td { background: #0b0b0b; color: #fff; }
                .status-pill { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
                .status-pill.active { background: rgba(70,211,105,0.1); color: #46d369; }
                .status-pill.inactive { background: rgba(248,113,113,0.1); color: #f87171; }
                .text-btn { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 12px; padding: 0; }
                .text-red { color: #e50914 !important; }

                .log-console { height: 400px; overflow-y: auto; font-family: 'Courier New', Courier, monospace; font-size: 12px; background: #050505; border: 1px solid #111; }
                .log-console::-webkit-scrollbar { width: 6px; }
                .log-console::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
                .log-entry { margin-bottom: 6px; }
                .log-entry span { color: #555; margin-right: 8px; }

                .bar-track { height: 6px; background: #222; border-radius: 3px; overflow: hidden; margin-top: 8px; }
                .bar-fill { height: 100%; transition: 1s cubic-bezier(0.1, 0, 0, 1); }
                .bar-labels { display: flex; justify-content: space-between; font-size: 11px; color: #666; }

                .admin-grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
                .content-card { position: relative; }
                .content-badge { position: absolute; top: 12px; right: 12px; font-size: 10px; background: #222; padding: 2px 8px; border-radius: 10px; color: #888; }
                .content-stats { display: flex; gap: 16px; margin-top: 12px; }
                .content-stats span { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #666; }

                .animate-fade { animation: fade .4s ease-out; }
                @keyframes fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                /* RESPONSIVENESS */
                @media (max-width: 1200px) {
                    .metrics-row { grid-template-columns: repeat(2, 1fr); }
                    .middle-row { grid-template-columns: 1fr; }
                }

                @media (max-width: 768px) {
                    .admin-dashboard { flex-direction: column; }
                    .admin-sidebar { width: 100%; height: auto; border-right: none; border-bottom: 1px solid #222; padding: 15px; }
                    .admin-brand { margin-bottom: 15px; }
                    .admin-nav { flex-direction: row; flex-wrap: wrap; gap: 8px; }
                    .admin-nav-item { padding: 8px 12px; font-size: 12px; }
                    .admin-main { padding: 20px; }
                    .admin-header { flex-direction: column; align-items: flex-start; }
                    .metrics-row { grid-template-columns: 1fr; }
                    .admin-grid-3 { grid-template-columns: 1fr; }
                }

                /* SCROLLBARS FOR MAIN AREA/LOGS ONLY */
                .admin-main::-webkit-scrollbar, .admin-table-wrapper::-webkit-scrollbar {
                    display: block; width: 6px; height: 6px;
                }
                .admin-main::-webkit-scrollbar-thumb, .admin-table-wrapper::-webkit-scrollbar-thumb {
                    background: #222; border-radius: 3px;
                }
                
                /* HIDE ALL OTHER SCROLLBARS */
                * { scrollbar-width: none; -ms-overflow-style: none; }
                .admin-main, .admin-table-wrapper { scrollbar-width: thin; -ms-overflow-style: auto; }
            `}</style>

            <div className="login-bg">
                <img src="https://assets.nflxext.com/FFE/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/US-en-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg" alt="Background" />
            </div>

            <header className="login-header">
                <div className="rimuru-logo">RIMURU</div>
                <p className="rimuru-tagline">Premium Streaming Platform</p>
            </header>

            <div className="login-body">
                <div className="login-form-wrapper">
                    <h2>{mode === 'register' ? '✨ Create Account' : '🔐 Sign In'}</h2>

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        {mode === 'register' && (
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <input
                                type="email"
                                placeholder="Email address"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? '⏳ Please wait...' : mode === 'register' ? '✨ Create Account' : '🔐 Sign In'}
                        </button>
                    </form>

                    <div className="login-bottom">
                        <p className="login-signup-now">
                            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setMode(m => m === 'login' ? 'register' : 'login');
                                    setError('');
                                }}
                            >
                                {mode === 'login' ? 'Sign up now' : 'Sign in'}
                            </a>
                        </p>

                        <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setEmail('admin@netflix.com');
                                    setPassword('admin123');
                                    setMode('login');
                                }}
                                className="admin-access-btn"
                            >
                                <ShieldCheck size={16} />
                                Access Admin Panel
                            </button>
                            <p style={{ fontSize: 11, opacity: 0.4, marginTop: 8 }}>Demo: admin@rimuru.com / admin123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
