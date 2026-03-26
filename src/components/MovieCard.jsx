import React, { useState, useRef } from 'react';
import { Play, Plus, ThumbsUp, Info, Check, Star, Clock } from 'lucide-react';

const MovieCard = ({ movie, onOpenModal, rank }) => {
  const [hovered,    setHovered]    = useState(false);
  const [inMyList,   setInMyList]   = useState(false);
  const hoverTimer = useRef(null);

  // 400 ms delay before expanding — matches real Netflix behaviour
  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setHovered(true), 400);
  };
  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setHovered(false);
  };

  const fallback = 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&q=80';

  return (
    <div
      className={`card${hovered ? ' hovered' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Rank badge (Trending row) */}
      {rank && <span className="rank-badge">{rank}</span>}

      {/* Thumbnail */}
      <div className="card-img-wrap">
        <img
          src={movie.backdrop || movie.thumbnail || movie.poster}
          alt={movie.title}
          className="card-img"
          onError={e => { e.target.src = fallback; }}
        />
        <div className="card-shimmer" />
        <div className="card-gradient" />
        <div className="card-rating">
          <Star size={10} fill="#f6c90e" color="#f6c90e" />
          {movie.rating}
        </div>
      </div>

      {/* Expanded hover panel */}
      <div className="card-hover-content">
        <div className="card-title-row">
          <h4 className="card-title">{movie.title}</h4>
        </div>

        <div className="card-actions">
          <button
            className="card-action-play"
            onClick={e => e.stopPropagation()}
            title="Play"
          >
            <Play size={14} fill="black" />
          </button>

          <button
            className="card-action-icon"
            onClick={e => { e.stopPropagation(); setInMyList(l => !l); }}
            title={inMyList ? 'Remove from My List' : 'Add to My List'}
          >
            {inMyList ? <Check size={15} /> : <Plus size={15} />}
          </button>

          <button
            className="card-action-icon"
            onClick={e => e.stopPropagation()}
            title="Like"
          >
            <ThumbsUp size={14} />
          </button>

          <button
            className="card-action-icon card-action-info"
            onClick={e => { e.stopPropagation(); onOpenModal(movie); }}
            title="More Info"
          >
            <Info size={14} />
          </button>
        </div>

        <div className="card-meta-row">
          <span className="match-pct">{movie.match}% Match</span>
          <span className="maturity-chip">{movie.maturity}</span>
          <span className="duration-chip">
            <Clock size={9} /> {movie.duration}
          </span>
        </div>

        <div className="card-tags">
          {movie.tags.slice(0, 3).map((t, i) => (
            <span key={t} className="tag">
              {t}{i < Math.min(movie.tags.length, 3) - 1 ? ' · ' : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;