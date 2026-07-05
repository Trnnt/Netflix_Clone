import 'dotenv/config';
import Groq from 'groq-sdk';

// ─── MOVIE CONTEXT BUILDER ────────────────────────────────────────────────────
// Takes a reference to the live movie cache and a user query, finds relevant movies
function buildMovieContext(movieCache, query = '', premiumExclusives = []) {
    const allMovies = [...premiumExclusives];
    for (const [key, movies] of Object.entries(movieCache)) {
        if (Array.isArray(movies)) {
            movies.forEach(m => {
                if (!allMovies.find(x => x.id === m.id)) {
                    allMovies.push({ ...m, _category: key });
                }
            });
        }
    }

    // Score each movie by relevance to query
    const q = (query || '').toLowerCase();
    
    // Extract year from query (e.g., "2026", "2024")
    const yearMatch = q.match(/\b(19|20)\d{2}\b/);
    const targetYear = yearMatch ? yearMatch[0] : null;

    const scored = allMovies.map(m => {
        let score = 0;
        const title = (m.title || '').toLowerCase();
        const desc = (m.desc || '').toLowerCase();
        const genre = (m.genre || '').toLowerCase();
        const tags = (m.tags || []).join(' ').toLowerCase();
        const year = String(m.year);

        if (title.includes(q)) score += 12;
        if (desc.includes(q)) score += 5;
        if (genre.includes(q)) score += 10;
        if (tags.includes(q)) score += 8;

        // Year boost
        if (targetYear && year === targetYear) {
            score += 25;
        }

        // Keyword matching for common queries
        const keywords = q.split(' ').filter(w => w.length > 2);
        keywords.forEach(kw => {
            if (title.includes(kw)) score += 4;
            if (desc.includes(kw)) score += 2;
            if (genre.includes(kw)) score += 4;
            if (tags.includes(kw)) score += 4;
        });

        // Genre-specific boosts (More inclusive for mixed-genre queries)
        const isAnimeQuery = q.includes('anime') || q.includes('animation');
        const isKDramaQuery = q.includes('korean') || q.includes('kdrama') || q.includes('k-drama');
        const isCDramaQuery = q.includes('chinese') || q.includes('cdrama') || q.includes('c-drama');
        const isRomComQuery = q.includes('rom-com') || q.includes('romcom') || (q.includes('romance') && q.includes('comedy'));

        if (isAnimeQuery && (genre.includes('anime') || tags.includes('anime') || genre.includes('animation'))) score += 15;
        if (isKDramaQuery && (tags.includes('kdrama') || tags.includes('k-drama') || genre.includes('korean'))) score += 15;
        if (isCDramaQuery && (tags.includes('cdrama') || tags.includes('c-drama') || genre.includes('chinese'))) score += 20;
        if (isRomComQuery && (genre.includes('romance') || genre.includes('comedy') || tags.includes('rom-com'))) score += 15;
        
        if (q.includes('isekai') && (desc.includes('isekai') || tags.includes('isekai'))) score += 25;
        if (q.includes('action') && (genre.includes('action') || desc.includes('action'))) score += 5;
        
        // "Latest" boost
        if (q.includes('latest') || q.includes('new')) {
            const currentYear = 2026;
            if (parseInt(year) >= currentYear - 1) score += 10;
        }

        return { ...m, _score: score };
    });

    // Sort by score desc, then by rating
    scored.sort((a, b) => b._score - a._score || parseFloat(b.rating) - parseFloat(a.rating));

    // Take top 25 for context to give the AI more variety
    const top = scored.slice(0, 25);

    const contextLines = top.map(m =>
        `• "${m.title}" (${m.year}) [ID: ${m.id}] — Genre: ${m.genre || m._category} | Rating: ${m.rating}/10 | ${m.desc?.slice(0, 100)}...`
    ).join('\n');

    return { contextLines, topMovies: scored.filter(m => m._score > 0).slice(0, 10), allMovies };
}

// ─── AI CHAT ──────────────────────────────────────────────────────────────────
async function chatWithAI(movieCache, messages, userMessage, userName = 'User', userApiKey = null) {
    const premiumExclusives = [
        { id: 10, title: "Put Your Head on My Shoulder", year: 2019, rating: 8.1, genre: "Romance • Youth", tags: ["C-Drama", "Romance"], desc: "Si Tu Mo's life is shaken up when she's forced to live with a physics genius.", type: "tv" },
        { id: 11, title: "Love is Sweet", year: 2020, rating: 8.4, genre: "Romance • Business", tags: ["C-Drama", "Romance"], desc: "Jiang Jun meets her childhood playmate in the workplace, as a rival.", type: "tv" },
        { id: 13, title: "Solo Leveling: Arise", year: 2026, rating: 9.2, genre: "Action • Isekai", tags: ["Anime", "Isekai", "2026"], desc: "The epic continuation of Jin-Woo Sung's leveling journey.", type: "tv" },
        { id: 14, title: "Pursuit of Jade", year: 2026, rating: 8.8, genre: "Romance • Comedy", tags: ["C-Drama", "Rom-Com"], desc: "A fake marriage turns into real love in this 2026 hit series.", type: "tv" },
        { id: 15, title: "TO BE HERO X", year: 2025, rating: 8.5, genre: "Action • Fantasy", tags: ["Animation", "Hero"], desc: "A heartwarming story of a hero finding love in a world of superheroes.", type: "movie" },
        { id: 16, title: "The Long Season", year: 2023, rating: 8.7, genre: "Drama • Mystery", tags: ["C-Drama", "Suspense"], desc: "A train driver falls in love while unraveling a decades-old mystery.", type: "tv" },
        { id: 17, title: "Falling Into Your Smile", year: 2021, rating: 8.6, genre: "Romance • Gaming", tags: ["C-Drama", "E-Sports"], desc: "A female pro-gamer joins an all-male team and finds love.", type: "tv" },
        { id: 18, title: "Hidden Love", year: 2023, rating: 8.9, genre: "Romance • Drama", tags: ["C-Drama", "Romance"], desc: "Sang Zhi falls in love with her brother's friend, and a years-long romance unfolds.", type: "tv" },
        { id: 19, title: "Moving", year: 2023, rating: 8.5, genre: "Action • Supernatural", tags: ["K-Drama", "Superpowers"], desc: "People with superpowers live in hiding while protecting their children.", type: "tv" },
        { id: 20, title: "Doraemon", year: 1979, rating: 7.7, genre: "Animation • Comedy", tags: ["Anime", "Cartoon"], desc: "The robotic cat from the future helps a young boy named Nobita.", type: "tv" },
        { id: 21, title: "Death Note", year: 2006, rating: 8.6, genre: "Animation • Mystery", tags: ["Anime", "Supernatural"], desc: "A high school student discovers a supernatural notebook that grants him the power to kill.", type: "tv" },
        { id: 22, title: "When Life Gives You Tangerines", year: 2025, rating: 8.7, genre: "Drama • Romance", tags: ["K-Drama", "Life"], desc: "A heartwarming journey of love and life set in beautiful Jeju Island.", type: "tv" }
    ];

    const { contextLines, topMovies, allMovies } = buildMovieContext(movieCache, userMessage, premiumExclusives);

    const systemPrompt = `You are Rimuru AI, the sentient premium concierge for the "Rimuru" platform. 
Date: March 25, 2026. 
User: ${userName}.

CRITICAL RULE (UI SYNC):
Every time you mention a movie/show, you MUST append its ID like this: **Title** [ID: x].
This is the ONLY way the user sees the poster. Failing to add [ID: x] breaks the UI.

LIBRARY CONTEXT:
${contextLines}

Style: Short, sharp, premium. Always **bold** recommended titles.`;

    try {
        console.log(`[AI] Request from ${userName}: "${userMessage}"`);
        
        const keyToUse = userApiKey || process.env.GROQ_API_KEY;
        if (!keyToUse) {
            throw new Error('No Groq API key found. Please add your key in Settings.');
        }
        
        const groqClient = new Groq({ apiKey: keyToUse });
        
        const chatCompletion = await groqClient.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                ...(messages || []).slice(-8).map(m => ({
                    role: m.role === 'user' ? 'user' : 'assistant',
                    content: m.content || m.text || ''
                })),
                { role: 'user', content: userMessage }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.3, // Even lower for maximum compliance
        });

        let rawReply = chatCompletion.choices[0]?.message?.content || `Systems offline, ${userName}.`;
        
        // 1. Primary Extraction: ID Tags [ID: x]
        const idMatches = rawReply.match(/\[ID:\s*(\d+)\]/g) || [];
        const extractedIds = new Set(idMatches.map(m => parseInt(m.match(/\d+/)[0])));

        // 2. FAILSAFE: Title Matching in Text
        // If the AI mentions a title from context but misses the ID, we force-add it.
        allMovies.forEach(m => {
            if (rawReply.includes(`**${m.title}**`) || rawReply.includes(`"${m.title}"`)) {
                extractedIds.add(m.id);
            }
        });

        const finalExtractedIds = [...extractedIds];

        // Clean text for frontend display
        const reply = rawReply.replace(/\[ID:\s*\d+\]/g, '').trim();

        // Build picks - prioritization: Extracted > High Score
        const syncPicks = allMovies.filter(m => finalExtractedIds.includes(m.id));
        const otherPicks = topMovies.filter(m => !finalExtractedIds.includes(m.id) && m._score >= 15);
        
        // Ensure final picks are unique by ID and order matches AI's mention
        const finalPicksCount = 8;
        const finalPicks = [...syncPicks, ...otherPicks].reduce((acc, current) => {
            if (!acc.find(item => item.id === current.id)) acc.push(current);
            return acc;
        }, []).slice(0, finalPicksCount);

        return { reply, suggestedMovies: finalPicks };
    } catch (err) {

        console.error('[AI Chat Error]', err.message);
        throw new Error('AI service down. Please try again.');
    }
}

// ─── SEARCH MOVIES (HELPER FOR RECOMMENDATIONS) ──────────────────────────────
function searchMovies(movieCache, query, limit = 8) {
    try {
        const { topMovies } = buildMovieContext(movieCache, query);
        return topMovies.slice(0, limit);
    } catch (err) {
        console.error('[Search Movies Error]', err.message);
        return [];
    }
}

export { chatWithAI, searchMovies, buildMovieContext };




