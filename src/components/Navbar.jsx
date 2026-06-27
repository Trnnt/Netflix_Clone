import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronLeft, User, Bookmark, Download, Settings, LogOut, Menu } from 'lucide-react';
import { socket } from '../services/movieApi';

const NAV_ITEMS = ['Home','Anime','Cartoon','Hollywood','Wollywood','K-Drama','C-Drama','J-Drama'];

const INITIAL_NOTIFICATIONS = [
  { id:1, text:'New episode of Demon Slayer is out!',      time:'2h ago',  img:'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80' },
  { id:2, text:'Attack on Titan Final Season added',       time:'1d ago',  img:'https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=400&q=80' },
  { id:3, text:'New K-Drama recommendations for you',      time:'2d ago',  img:'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80' },
];

const Navbar = ({ isScrolled, currentCategory, setCategory, onSearch, setIsLoggedIn, setActiveModal }) => {
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [query,       setQuery]       = useState('');
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hoveredNav,  setHoveredNav]  = useState(null);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = JSON.parse(localStorage.getItem('netflix_user') || '{"name": "User"}');

  const searchRef  = useRef(null);
  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  const inputRef   = useRef(null);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Real-time notifications
  useEffect(() => {
    const handleNewNotif = (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(c => c + 1);
    };
    socket.on('new_notification', handleNewNotif);
    return () => socket.off('new_notification', handleNewNotif);
  }, []);

  // Close all dropdowns on Escape or outside click
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') {
        setSearchOpen(false); setNotifOpen(false); setProfileOpen(false);
        setQuery(''); if (onSearch) onSearch('');
      }
      if (e.type === 'mousedown') {
        if (!searchRef.current?.contains(e.target))  setSearchOpen(false);
        if (!notifRef.current?.contains(e.target))   setNotifOpen(false);
        if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
      }
    };
    document.addEventListener('keydown',   handler);
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('keydown',   handler);
      document.removeEventListener('mousedown', handler);
    };
  }, [onSearch]);

  const handleSearchToggle = () => {
    if (searchOpen && query) { setQuery(''); if (onSearch) onSearch(''); }
    setSearchOpen(s => !s);
  };

  const handleSearchChange = e => {
    setQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const openModal = modal => {
    setProfileOpen(false);
    if (modal === 'signout') { if (setIsLoggedIn) setIsLoggedIn(false); }
    else { if (setActiveModal) setActiveModal(modal); }
  };

  const profileMenuItems = [
    { icon:<User size={14}/>,     label:'Edit Profile', modal:'profile'   },
    { icon:<Bookmark size={14}/>, label:'My List',      modal:'mylist'    },
    { icon:<Download size={14}/>, label:'Downloads',    modal:'downloads' },
    { icon:<Settings size={14}/>, label:'Settings',     modal:'settings'  },
    { icon:<LogOut size={14}/>,   label:'Sign Out',     modal:'signout'   },
  ];

  return (
    <nav className={`navbar${isScrolled ? ' scrolled' : ''}`}>
      {/* ── LEFT ── */}
      <div className="nav-left">
        <div className="logo" onClick={() => setCategory && setCategory('Home')}>
          <span className="logo-etflix" style={{ fontSize: 24, letterSpacing: 1, fontWeight: 900, background: 'linear-gradient(to right, #e50914, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RIMURU</span>
        </div>

        <ul className="nav-links desktop">
          {NAV_ITEMS.map(item => (
            <li
              key={item}
              data-cat={item}
              className={currentCategory === item ? 'active' : ''}
              onMouseEnter={() => setHoveredNav(item)}
              onMouseLeave={() => setHoveredNav(null)}
              onClick={() => setCategory && setCategory(item)}
            >

              {item}
              <span className={`nav-underline${hoveredNav === item || currentCategory === item ? ' visible' : ''}${currentCategory === item ? ' permanent' : ''}`} />
            </li>
          ))}
        </ul>

        <button className="hamburger" onClick={() => setMenuOpen(m => !m)}>
          <Menu size={20} />
        </button>
      </div>

      {/* ── RIGHT ── */}
      <div className="nav-right">

        {/* Search */}
        <div ref={searchRef} className={`search-wrap${searchOpen ? ' open' : ''}`}>
          <button className="icon-btn" onClick={handleSearchToggle}>
            <Search size={19} />
          </button>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Titles, genres…"
            value={query}
            onChange={handleSearchChange}
          />
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="notif-wrap">
          <button
            className="icon-btn notif-btn"
            onClick={() => { 
              setNotifOpen(n => !n); 
              setProfileOpen(false); 
              if (!notifOpen) setUnreadCount(0);
            }}
          >
            <Bell size={19} />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>

          {notifOpen && (
            <div className="dropdown notif-dropdown">
              <p className="dropdown-heading">NOTIFICATIONS</p>
              {notifications.length === 0 ? <p className="notif-text" style={{padding: '10px 15px', color:'#aaa'}}>No new notifications</p> : null}
              {notifications.map(n => (
                <div key={n.id} className="notif-item">
                  <img src={n.img} alt="" className="notif-thumb" />
                  <div>
                    <p className="notif-text">{n.text}</p>
                    <p className="notif-time">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="profile-wrap">
          <button
            className="profile-btn"
            onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
              alt="Avatar"
              className="avatar"
            />
            <span className="avatar-name">{user.name}</span>
            <ChevronLeft
              size={13}
              style={{
                transform: profileOpen ? 'rotate(-90deg)' : 'rotate(-180deg)',
                transition: 'transform 0.3s',
              }}
            />
          </button>

          {profileOpen && (
            <div className="dropdown profile-dropdown">
              <div className="profile-header">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"
                  width={40}
                  style={{ borderRadius:4 }}
                  alt="Avatar"
                />
                <div>
                  <p className="profile-header-name">{user.name}</p>
                  <p className="profile-header-plan">Premium · 4K HDR</p>
                </div>
              </div>

              {profileMenuItems.map(item => (
                <button
                  key={item.label}
                  className={`profile-menu-item${item.modal === 'signout' ? ' signout' : ''}`}
                  onClick={() => openModal(item.modal)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div className="mobile-menu">
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              data-cat={item}
              className={`mobile-menu-item${currentCategory === item ? ' active' : ''}`}
              onClick={() => { setCategory && setCategory(item); setMenuOpen(false); }}
            >

              {item}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;