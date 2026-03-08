const heroPicks = {
    movie: [
        {
            title: 'Midnight Pulse',
            detail: 'An AI detective chases shadowy satellites across neon Los Angeles.',
            meta: 'Movie • Hollywood • 2026',
            image: 'https://image.tmdb.org/t/p/original/bP7u19opmHXYeTCUwGjlLldqn1o.jpg'
        },
        {
            title: 'Echo Signal',
            detail: 'An adrenaline heist ticks to the rhythm of stunt pilots and stolen symphonies.',
            meta: 'Movie • Hollywood • 2025',
            image: 'https://image.tmdb.org/t/p/original/o2Yl3T4ydG9kB6fF3HAFHqKMQVx.jpg'
        },
        {
            title: 'Crimson Skyline',
            detail: 'A globe-trotting thriller where music and memory collide above an illuminated skyline.',
            meta: 'Movie • Hollywood • 2024',
            image: 'https://image.tmdb.org/t/p/original/z2yVikwalHf7iUkQ9J9sK9s.jpg'
        }
    ],
    anime: [
        {
            title: 'Silver Sky Voyage',
            detail: 'Floating micro-cities defended by botanical mechs and starry pilots.',
            meta: 'Anime Movie • Studio Asteria',
            image: 'https://image.tmdb.org/t/p/original/pPG8svbuQqW2P2c0B2dAaxF5Q9E.jpg'
        },
        {
            title: 'Ember Bloom • Episode 14',
            detail: 'The season finale pairs two kids piloting radiant gardens to restore the sun.',
            meta: 'Series • S1 · E14',
            image: 'https://image.tmdb.org/t/p/original/q6y0Go1rZgVoTFZyDztCPq2oMon.jpg'
        },
        {
            title: 'Nova Bloom Chronicles',
            detail: 'Botanical robots shield a floating metropolis from meteor storms.',
            meta: 'Series • Episode 7',
            image: 'https://image.tmdb.org/t/p/original/l95Q1mLxZVAbmS3vP5kY6Yrhwf1.jpg'
        }
    ],
    cartoon: [
        {
            title: 'Galaxy Brawl',
            detail: 'Space rangers bounce through cosmic arcades in this high-energy cartoon feature.',
            meta: 'Feature • 2023',
            image: 'https://images.unsplash.com/photo-1453133451515-5ff7c1db9d42?auto=format&fit=crop&w=900&q=60'
        },
        {
            title: 'Retro Rocket Buddies',
            detail: 'Three friends clean up space junk with a retro rocket and unstoppable laughs.',
            meta: 'Series • Episode 9',
            image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60'
        },
        {
            title: 'Pixel Parade',
            detail: 'Shape-shifting heroes jam through neon streets in a vibrant cartoon special.',
            meta: 'Feature • 2022',
            image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=60'
        }
    ]
};

function paintHero(type) {
    const card = document.querySelector(`[data-hero="${type}"]`);
    if (!card) return;
    const picks = heroPicks[type];
    const selection = picks[Math.floor(Math.random() * picks.length)];
    card.querySelector('.hero-card-title').textContent = selection.title;
    card.querySelector('.hero-card-detail').textContent = selection.detail;
    card.querySelector('.hero-card-meta').textContent = selection.meta;
    card.querySelector('.hero-card-image').style.backgroundImage = `url('${selection.image}')`;
}

document.addEventListener('DOMContentLoaded', () => {
    Object.keys(heroPicks).forEach(paintHero);
});
