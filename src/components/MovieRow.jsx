import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

const MovieRow = ({ title, movies, onOpenModal }) => {
    const [slideIndex, setSlideIndex] = useState(0);

    if (!movies || movies.length === 0) return null;

    const itemsPerPage = 6;
    const maxIndex = Math.ceil(movies.length / itemsPerPage) - 1;

    const slideLeft = () => setSlideIndex(prev => Math.max(prev - 1, 0));
    const slideRight = () => setSlideIndex(prev => Math.min(prev + 1, maxIndex));

    return (
        <div className="row">
            <h2 className="row-title">{title}</h2>
            <div className="slider-wrapper">
                {slideIndex > 0 && (
                    <div className="slider-handle left" onClick={slideLeft}>
                        <ChevronLeft size={44} />
                    </div>
                )}
                <div
                    className="slider"
                    style={{ transform: `translateX(calc(-${slideIndex * 100}% - ${slideIndex * 8}px))` }}
                >
                    {movies.map((m, idx) => (
                        <MovieCard key={m.uniqueId} movie={m} onOpenModal={onOpenModal} />
                    ))}
                </div>
                {slideIndex < maxIndex && (
                    <div className="slider-handle right" onClick={slideRight}>
                        <ChevronRight size={44} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieRow;
