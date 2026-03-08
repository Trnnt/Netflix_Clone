import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, List, Settings, LogOut, ChevronDown } from 'lucide-react';

const Navbar = ({ onSearch, isScrolled, currentCategory, setCategory, setIsLoggedIn, setActiveModal }) => {
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const searchWrapRef = useRef(null);

    // Close search on Esc or Click Outside
    useEffect(() => {
        const handleEvents = (e) => {
            if (e.type === 'keydown' && e.key === 'Escape') {
                setSearchOpen(false);
                setQuery("");
                if (onSearch) onSearch("");
            }
            if (e.type === 'mousedown' && searchOpen && searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
                setSearchOpen(false);
                if (!query && onSearch) onSearch("");
            }
        };

        document.addEventListener('mousedown', handleEvents);
        document.addEventListener('keydown', handleEvents);

        return () => {
            document.removeEventListener('mousedown', handleEvents);
            document.removeEventListener('keydown', handleEvents);
        };
    }, [searchOpen, query, onSearch]);

    const handleSearchToggle = () => {
        setSearchOpen(prev => {
            if (prev) {
                setQuery("");
                if (onSearch) onSearch("");
            } else {
                setTimeout(() => {
                    searchWrapRef.current.querySelector('input')?.focus();
                }, 100);
            }
            return !prev;
        });
    };

    const handleSearchChange = (e) => {
        setQuery(e.target.value);
        if (onSearch) onSearch(e.target.value);
    };

    return (
        <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="nav-left">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix" className="logo" />
                <nav className="nav-links">
                    {["Home", "Anime", "Hollywood", "Wollywood", "K-Drama", "C-Drama", "J-Drama", "Cartoon"].map(cat => (
                        <span
                            key={cat}
                            className={`nav-link ${currentCategory === cat ? 'active' : ''}`}
                            onClick={() => setCategory && setCategory(cat)}
                        >
                            {cat}
                        </span>
                    ))}
                </nav>
            </div>
            <div className="nav-right">
                <div className={`search-wrap ${searchOpen ? 'open' : ''}`} ref={searchWrapRef}>
                    <Search className="nav-icon" size={24} onClick={handleSearchToggle} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Titles, people, genres..."
                        value={query}
                        onChange={handleSearchChange}
                    />
                </div>

                <div className="notification-wrapper">
                    <Bell className="nav-icon" size={24} />
                    <span className="notif-badge">3</span>
                </div>

                <div className="profile-menu group" tabIndex="0">
                    <div className="profile-flex">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" alt="Profile" className="nav-avatar" />
                        <ChevronDown size={14} className="profile-caret" />
                    </div>
                    <div className="profile-dropdown">
                        <div className="profile-item" onClick={() => setActiveModal && setActiveModal('profile')}><User size={16} /> Profile</div>
                        <div className="profile-item" onClick={() => setActiveModal && setActiveModal('mylist')}><List size={16} /> My List</div>
                        <div className="profile-item" onClick={() => setActiveModal && setActiveModal('settings')}><Settings size={16} /> Settings</div>
                        <div className="profile-item" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', color: '#f87171' }} onClick={() => setIsLoggedIn && setIsLoggedIn(false)}>
                            <LogOut size={16} /> Sign Out
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
