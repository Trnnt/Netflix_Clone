import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

const MovieRow = ({ title, movies, onOpenModal, showRank }) => {
  const rowRef = useRef(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  if (!movies || movies.length === 0) return null;

  const updateArrows = () => {
    if (!rowRef.current) return;
    setCanLeft(rowRef.current.scrollLeft > 0);
    setCanRight(
      rowRef.current.scrollLeft + rowRef.current.offsetWidth <
      rowRef.current.scrollWidth - 10
    );
  };

  const scroll = dir => {
    rowRef.current.scrollBy({ left: dir * 860, behavior: 'smooth' });
    setTimeout(updateArrows, 420);
  };

  return (
    <section className="row-section">
      <div className="row-header">
        <h3 className="row-title">{title}</h3>
        <button className="see-all-btn">See All →</button>
      </div>

      <div className="row-outer">
        {canLeft && (
          <button className="row-arrow left" onClick={() => scroll(-1)}>
            <ChevronLeft size={24} />
          </button>
        )}

        <div className="row-scroll" ref={rowRef} onScroll={updateArrows}>
          {movies.map((m, i) => (
            <MovieCard
              key={m.uniqueId || `${m.id}-${i}`}
              movie={m}
              onOpenModal={onOpenModal}
              rank={showRank ? i + 1 : null}
            />
          ))}
        </div>

        {canRight && (
          <button className="row-arrow right" onClick={() => scroll(1)}>
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </section>
  );
};

export default MovieRow;