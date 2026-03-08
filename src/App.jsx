import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', background: '#111', color: '#ff6b6b', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h2>App Crashed (Black Screen Error Caught)</h2>
                    <p style={{ marginTop: '20px', fontFamily: 'monospace', background: '#222', padding: '15px', borderRadius: '5px' }}>
                        {this.state.error && this.state.error.toString()}
                    </p>
                    <button style={{ marginTop: '20px', padding: '10px 20px', background: 'white', color: 'black', border: 'none', cursor: 'pointer' }} onClick={() => window.location.reload()}>
                        Refresh Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checking, setChecking] = useState(true);

    const recheck = () => {
        try {
            const token = localStorage.getItem('netflix_token');
            const userStr = localStorage.getItem('netflix_user');

            if (!token || !userStr) {
                setIsAdmin(false);
                setIsLoggedIn(false);
            } else {
                const user = JSON.parse(userStr);
                if (user.role === 'admin') {
                    setIsAdmin(true);
                    setIsLoggedIn(false);
                } else {
                    setIsLoggedIn(true);
                    setIsAdmin(false);
                }
            }
        } catch (e) {
            console.error("Session error:", e);
            localStorage.removeItem('netflix_token');
            localStorage.removeItem('netflix_user');
            setIsAdmin(false);
            setIsLoggedIn(false);
        }
        setChecking(false);
    };

    useEffect(() => { recheck(); }, []);

    if (checking) return (
        <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="netflix-spinner" />
        </div>
    );

    return (
        <ErrorBoundary>
            {isAdmin ? (
                <LoginPage onLogin={recheck} isAdminView={true} />
            ) : isLoggedIn ? (
                <HomePage onLogout={recheck} />
            ) : (
                <LoginPage onLogin={recheck} />
            )}
        </ErrorBoundary>
    );
}



