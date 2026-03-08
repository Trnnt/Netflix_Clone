import React, { useState, useRef } from 'react';
import { Play, Plus, ThumbsUp, ChevronDown, Check } from 'lucide-react';

const MovieCard = ({ movie, onOpenModal, style = {} }) => {
    const [isHovered, setIsHovered] = useState(false);
    const hoverTimeoutRef = useRef(null);
    const cardRef = useRef(null);
    const [myList, setMyList] = useState(false);

    // Calculate position for translation when hovered (e.g. at the edges)
    const handleMouseEnter = (e) => {
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(true);
        }, 400); // 400ms delay like actual netflix
    };

    const handleMouseLeave = () => {
        clearTimeout(hoverTimeoutRef.current);
        setIsHovered(false);
    };

    return (
        <div
            className={`movie-card-wrapper ${isHovered ? 'hovered' : ''}`}
            ref={cardRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="movie-card" style={style}>
                <img
                    src={movie.backdrop || movie.poster}
                    alt={movie.title}
                    className="movie-poster"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1000&auto=format&fit=crop" }}
                />
            </div>

            {/* The expanded hover state */}
            <div className={`movie-card-hover ${isHovered ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onOpenModal(movie); }}>
                <div className="hover-video-area">
                    <img
                        src={movie.backdrop || movie.poster}
                        alt={movie.title}
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1000&auto=format&fit=crop" }}
                    />
                    <div className="hover-title-overlay">{movie.title}</div>
                    <div className="recently-added-badge">Recently added</div>
                </div>
                <div className="hover-info">
                    <div className="hover-actions">
                        <button className="action-btn play" onClick={(e) => e.stopPropagation()}><Play size={18} fill="currentColor" /></button>
                        <button className="action-btn" onClick={(e) => { e.stopPropagation(); setMyList(!myList); }}>
                            {myList ? <Check size={18} /> : <Plus size={18} />}
                        </button>
                        <button className="action-btn" onClick={(e) => e.stopPropagation()}><ThumbsUp size={16} /></button>
                        <button className="action-btn expand" onClick={(e) => { e.stopPropagation(); onOpenModal(movie); }}><ChevronDown size={18} /></button>
                    </div>

                    <div className="hover-meta">
                        <span className="match">{movie.match}% match</span>
                        <span className="maturity-badge">{movie.maturity}</span>
                        <span>{movie.episodes}</span>
                        <span className="hd-badge">HD</span>
                    </div>

                    <div className="hover-tags">
                        {movie.tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
