/* ═══════════════════════════════════════════════════════════
   NETFLIX CLONE — NETFLIX.JS
   Movie data, dynamic rendering, hover cards, hero rotation,
   search, sidebar, modal, my list, toast notifications
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Movie Database ─────────────────────────────────────── */
const MOVIES = [
  /* ── TRENDING ── */
  {
    id: 1, title: "Stranger Things", year: 2024, rating: 8.7,
    category: "tvshow", genre: "Sci-Fi, Horror, Drama, Teen",
    cast: "Millie Bobby Brown, Finn Wolfhard, David Harbour",
    desc: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.",
    maturity: "TV-14", episodes: "4 Seasons", match: 97,
    poster: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    tags: ["Sci-Fi", "Horror", "Drama", "Teen"], section: "trending", rank: 1
  },
  {
    id: 2, title: "Wednesday", year: 2023, rating: 8.1,
    category: "tvshow", genre: "Comedy, Crime, Fantasy, Horror",
    cast: "Jenna Ortega, Percy Hynes White, Emma Myers",
    desc: "Follows Wednesday Addams' years as a student at Nevermore Academy, where she attempts to master her psychic powers.",
    maturity: "TV-14", episodes: "2 Seasons", match: 94,
    poster: "https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg",
    tags: ["Fantasy", "Horror", "Teen"], section: "trending", rank: 2
  },
  {
    id: 3, title: "Squid Game", year: 2024, rating: 8.0,
    category: "KDrama", genre: "Action, Drama, Mystery, Thriller",
    cast: "Lee Jung-jae, Park Hae-soo, Wi Ha-jun",
    desc: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits — with deadly high stakes.",
    maturity: "TV-MA", episodes: "2 Seasons", match: 96,
    poster: "https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/qw3J9cNeLioOLoR68WX7z79aCdK.jpg",
    tags: ["Thriller", "Drama", "K-Drama"], section: "trending", rank: 3
  },
  {
    id: 4, title: "The Crown", year: 2023, rating: 8.1,
    category: "tvshow", genre: "Drama, History",
    cast: "Imelda Staunton, Jonathan Pryce, Elizabeth Debicki",
    desc: "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the UK in the second half of the twentieth century.",
    maturity: "TV-MA", episodes: "6 Seasons", match: 89,
    poster: "https://image.tmdb.org/t/p/w500/1M876KPjulVwppEpldhdc8V4o68.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/xDss8eFR4ViE1VBIjpTHqnZAJvh.jpg",
    tags: ["Drama", "History"], section: "trending", rank: 4
  },
  {
    id: 5, title: "Money Heist: Berlin", year: 2023, rating: 7.8,
    category: "Movie", genre: "Action, Crime, Drama, Thriller",
    cast: "Pedro Alonso, Michelle Jenner, Tristán Ulloa",
    desc: "Berlin, the most charismatic of the heist's thieves, leads a robbery in Paris, putting at risk his team to get the biggest score of his life.",
    maturity: "TV-MA", episodes: "Season 1", match: 91,
    poster: "https://image.tmdb.org/t/p/w500/3NTAbAiao4JLzFQw6YxP1YZqFDB.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/zf1MlRqVQO2hYMQMYanXi7cRNn1.jpg",
    tags: ["Crime", "Drama", "Action"], section: "trending", rank: 5
  },
  {
    id: 6, title: "Lucifer", year: 2021, rating: 8.1,
    category: "tvshow", genre: "Comedy, Crime, Drama, Fantasy",
    cast: "Tom Ellis, Lauren German, Kevin Alejandro",
    desc: "The Devil, bored and unhappy as the Lord of Hell, abandons his throne and moves to Los Angeles, where he becomes a consultant to the LAPD.",
    maturity: "TV-14", episodes: "6 Seasons", match: 92,
    poster: "https://image.tmdb.org/t/p/w500/4EYPN5mVIhKLfxGruy7Dy41dTVn.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/6iVZUGrT7HYOBCqkTQAXOgk9Ggp.jpg",
    tags: ["Fantasy", "Crime", "Comedy"], section: "trending", rank: 6
  },

  /* ── TOP PICKS ── */
  {
    id: 7, title: "Oppenheimer", year: 2023, rating: 8.4,
    category: "Movie", genre: "Biography, Drama, History",
    cast: "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.",
    desc: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
    maturity: "R", episodes: "3h", match: 95,
    poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    tags: ["Biography", "Drama", "History"], section: "picks"
  },
  {
    id: 8, title: "Dune: Part Two", year: 2024, rating: 8.7,
    category: "Movie", genre: "Action, Adventure, Drama, Sci-Fi",
    cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson",
    desc: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    maturity: "PG-13", episodes: "2h 46m", match: 98,
    poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    tags: ["Sci-Fi", "Adventure", "Action"], section: "picks"
  },
  {
    id: 9, title: "Avatar: The Way of Water", year: 2022, rating: 7.6,
    category: "Movie", genre: "Action, Adventure, Fantasy, Sci-Fi",
    cast: "Sam Worthington, Zoe Saldana, Sigourney Weaver",
    desc: "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri.",
    maturity: "PG-13", episodes: "3h 12m", match: 87,
    poster: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/s16H6tpK2utvwpapmrhDo0BO66K.jpg",
    tags: ["Fantasy", "Sci-Fi", "Action"], section: "picks"
  },
  {
    id: 10, title: "John Wick 4", year: 2023, rating: 7.8,
    category: "Movie", genre: "Action, Crime, Thriller",
    cast: "Keanu Reeves, Laurence Fishburne, Ian McShane",
    desc: "John Wick discovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy.",
    maturity: "R", episodes: "2h 49m", match: 90,
    poster: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/h8gHn9g6v9DjrGp1oCRCxFmB3LI.jpg",
    tags: ["Action", "Crime", "Thriller"], section: "picks"
  },
  {
    id: 11, title: "Interstellar", year: 2014, rating: 8.7,
    category: "Hollywood", genre: "Adventure, Drama, Sci-Fi",
    cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
    desc: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    maturity: "PG-13", episodes: "2h 49m", match: 99,
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/pbrkL804EoFCNEsARRIOBBLJ8bI.jpg",
    tags: ["Sci-Fi", "Drama", "Adventure"], section: "picks"
  },
  {
    id: 12, title: "The Dark Knight", year: 2008, rating: 9.0,
    category: "Hollywood", genre: "Action, Crime, Drama",
    cast: "Christian Bale, Heath Ledger, Aaron Eckhart",
    desc: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
    maturity: "PG-13", episodes: "2h 32m", match: 99,
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/nMKdUUepR0i5zn0y1T4CejMPADh.jpg",
    tags: ["Action", "Crime", "Drama"], section: "picks"
  },

  /* ── ANIME ── */
  {
    id: 13, title: "Attack on Titan", year: 2023, rating: 9.0,
    category: "Anime", genre: "Action, Adventure, Drama, Fantasy, Horror",
    cast: "Yuki Kaji, Yui Ishikawa, Marina Inoue",
    desc: "In a world where humanity lives inside cities surrounded by enormous walls that protect them from Titans, a boy vows to kill all Titans when his hometown is attacked.",
    maturity: "TV-MA", episodes: "4 Seasons", match: 99,
    poster: "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/sOrei8XSTl4kAHdqhevHNf3RxuA.jpg",
    tags: ["Action", "Fantasy", "Drama"], section: "anime"
  },
  {
    id: 14, title: "Demon Slayer", year: 2024, rating: 8.7,
    category: "Anime", genre: "Action, Adventure, Fantasy",
    cast: "Natsuki Hanae, Akari Kitô, Yoshitsugu Matsuoka",
    desc: "A family is attacked by demons and only two members survive — Tanjiro and his sister Nezuko, who is turning into a demon. Tanjiro sets out to become a demon slayer.",
    maturity: "TV-14", episodes: "4 Seasons", match: 95,
    poster: "https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/sqiLMDypFGpw9gRmGzp79VwKBeg.jpg",
    tags: ["Action", "Fantasy"], section: "anime"
  },
  {
    id: 15, title: "Jujutsu Kaisen", year: 2024, rating: 8.6,
    category: "Anime", genre: "Action, Adventure, Fantasy",
    cast: "Junya Enoki, Yûichi Nakamura, Yuma Uchida",
    desc: "Yuji Itadori, a high school student, enters the world of Jujutsu Sorcery after swallowing a cursed item to save a classmate.",
    maturity: "TV-14", episodes: "3 Seasons", match: 96,
    poster: "https://image.tmdb.org/t/p/w500/oqP1qEZccmNIFsTBYFNKjOeGnbT.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/vIgyYkXkg6NC2whRbNjfeVmXsev.jpg",
    tags: ["Action", "Fantasy", "Horror"], section: "anime"
  },
  {
    id: 16, title: "One Piece", year: 2023, rating: 8.9,
    category: "Anime", genre: "Action, Adventure, Comedy, Fantasy",
    cast: "Mayumi Tanaka, Tony Beck, Laurent Vernin",
    desc: "Monkey D. Luffy sails with his crew in search of the world's ultimate treasure known as 'One Piece' to become the next King of Pirates.",
    maturity: "TV-14", episodes: "1000+ Eps", match: 97,
    poster: "https://image.tmdb.org/t/p/w500/fcPdf8oIaM3OJnEVFuHo3VEBFoN.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/2rmK7mnchw9Xr3XdiAwBvOHkRhe.jpg",
    tags: ["Adventure", "Action", "Comedy"], section: "anime"
  },
  {
    id: 17, title: "Naruto: Shippuden", year: 2017, rating: 8.7,
    category: "Anime", genre: "Action, Adventure, Fantasy",
    cast: "Junko Takeuchi, Maile Flanagan, Steve Blum",
    desc: "Naruto Uzumaki, a hyperactive ninja, trains and struggles to fulfill his desire of becoming the Hokage and gaining the recognition of the Hidden Leaf Village.",
    maturity: "TV-14", episodes: "500 Eps", match: 94,
    poster: "https://image.tmdb.org/t/p/w500/xppeysfvDKVx775MFuH8Z9ex9M.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/hcLqeOv1EVn2LqzTSFLM2GqXARi.jpg",
    tags: ["Action", "Adventure", "Fantasy"], section: "anime"
  },
  {
    id: 18, title: "Dragon Ball Super", year: 2018, rating: 7.6,
    category: "Anime", genre: "Action, Adventure, Fantasy",
    cast: "Masako Nozawa, Ryou Horikawa",
    desc: "After the dramatic battle with Majin Buu, Son Goku continues his journey to become stronger. A new threat — Beerus, God of Destruction — challenges him.",
    maturity: "TV-14", episodes: "131 Eps", match: 88,
    poster: "https://image.tmdb.org/t/p/w500/1KXzpCCT6LlVEpUByGEWH1NLMCL.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/lgT9oMQOd2xCH1pQ0DgbNxXUYzO.jpg",
    tags: ["Action", "Fantasy"], section: "anime"
  },

  /* ── K-DRAMA ── */
  {
    id: 19, title: "Crash Landing on You", year: 2020, rating: 8.7,
    category: "KDrama", genre: "Comedy, Drama, Romance",
    cast: "Hyun Bin, Son Ye-jin, Kim Jung-hyun",
    desc: "A paragliding mishap drops a South Korean heiress in North Korea. She falls in love with a North Korean army officer who decides to help her hide and return home.",
    maturity: "TV-14", episodes: "1 Season", match: 96,
    poster: "https://image.tmdb.org/t/p/w500/61moGKDrFPyfsqD0sTGHhLwOpiD.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/dkRiXAGqEMWIPFkJEFZqBYsLRyB.jpg",
    tags: ["Romance", "Comedy", "Drama"], section: "kdrama"
  },
  {
    id: 20, title: "Goblin", year: 2017, rating: 8.7,
    category: "KDrama", genre: "Comedy, Fantasy, Romance",
    cast: "Gong Yoo, Kim Go-eun, Lee Dong-wook",
    desc: "A goblin, who needs a human bride to end his immortal life, crosses paths with a girl who can see the supernatural world.",
    maturity: "TV-14", episodes: "1 Season", match: 98,
    poster: "https://image.tmdb.org/t/p/w500/jsWPPKmQBGPLLv5HdNomHaJOT0n.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/h4JoYHCHLcRTU3MoWAIJO1VQU2s.jpg",
    tags: ["Fantasy", "Romance", "Comedy"], section: "kdrama"
  },
  {
    id: 21, title: "My Love from the Star", year: 2014, rating: 8.5,
    category: "KDrama", genre: "Comedy, Fantasy, Mystery, Romance",
    cast: "Kim Soo-hyun, Jun Ji-hyun, Park Hae-jin",
    desc: "An alien who came to Earth 400 years ago, just 3 months before his return to his home planet, meets a top actress who resembles his first love.",
    maturity: "TV-14", episodes: "1 Season", match: 92,
    poster: "https://image.tmdb.org/t/p/w500/1jlIpZchLvGz4FHqPHQQWiSJj2e.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/9LqiXiHjhsI3ZeZH0q7RAfMeeDo.jpg",
    tags: ["Fantasy", "Romance"], section: "kdrama"
  },
  {
    id: 22, title: "It's Okay to Not Be Okay", year: 2020, rating: 8.5,
    category: "KDrama", genre: "Comedy, Drama, Romance",
    cast: "Kim Soo-hyun, Seo Ye-ji, Oh Jung-se",
    desc: "A community health worker and an antisocial children's book author help each other heal from their emotional and psychological wounds.",
    maturity: "TV-14", episodes: "1 Season", match: 94,
    poster: "https://image.tmdb.org/t/p/w500/bFIAHh2FS1GUGiSvv0O6e9Xvfhw.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/z8mOhfA3vNFi7nBPeWqECcxYOiE.jpg",
    tags: ["Romance", "Drama"], section: "kdrama"
  },
  {
    id: 23, title: "Vincenzo", year: 2021, rating: 8.5,
    category: "KDrama", genre: "Action, Comedy, Crime, Drama",
    cast: "Song Joong-ki, Jeon Yeo-bin, Kwak Dong-yeon",
    desc: "A Korean-Italian mafia lawyer uses his Mafia-like tactics to root out corruption while practicing law in Korea.",
    maturity: "TV-14", episodes: "1 Season", match: 96,
    poster: "https://image.tmdb.org/t/p/w500/mnX0QMq9GKVSnAfOdX8Fn7sLi4B.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/aluoRMjdTBqNLh7zKUGqNEsYGxw.jpg",
    tags: ["Crime", "Comedy", "Action"], section: "kdrama"
  },

  /* ── HOLLYWOOD ── */
  {
    id: 24, title: "Spider-Man: No Way Home", year: 2021, rating: 8.2,
    category: "Hollywood", genre: "Action, Adventure, Fantasy",
    cast: "Tom Holland, Zendaya, Benedict Cumberbatch",
    desc: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When the spell goes wrong, dangerous foes from other worlds start to appear.",
    maturity: "PG-13", episodes: "2h 28m", match: 95,
    poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg",
    tags: ["Action", "Fantasy", "Adventure"], section: "hollywood"
  },
  {
    id: 25, title: "Top Gun: Maverick", year: 2022, rating: 8.2,
    category: "Hollywood", genre: "Action, Drama",
    cast: "Tom Cruise, Miles Teller, Jennifer Connelly",
    desc: "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when training elite graduates.",
    maturity: "PG-13", episodes: "2h 11m", match: 97,
    poster: "https://image.tmdb.org/t/p/w500/62HCnUTHk3kaasQ0YyfMJqU6aeI.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/AkYoHWlH1c0E0UuHiRU2fFOLslS.jpg",
    tags: ["Action", "Drama"], section: "hollywood"
  },
  {
    id: 26, title: "Avengers: Endgame", year: 2019, rating: 8.4,
    category: "Hollywood", genre: "Action, Adventure, Sci-Fi",
    cast: "Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth",
    desc: "After the devastating events of Infinity War, the universe is in ruins. The Avengers assemble once more to reverse Thanos' actions and restore the universe.",
    maturity: "PG-13", episodes: "3h 2m", match: 97,
    poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    tags: ["Action", "Adventure", "Sci-Fi"], section: "hollywood"
  },
  {
    id: 27, title: "Inception", year: 2010, rating: 8.8,
    category: "Hollywood", genre: "Action, Adventure, Sci-Fi, Thriller",
    cast: "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page",
    desc: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    maturity: "PG-13", episodes: "2h 28m", match: 98,
    poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    tags: ["Thriller", "Sci-Fi", "Action"], section: "hollywood"
  },
  {
    id: 28, title: "The Shawshank Redemption", year: 1994, rating: 9.3,
    category: "Hollywood", genre: "Drama",
    cast: "Tim Robbins, Morgan Freeman, Bob Gunton",
    desc: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    maturity: "R", episodes: "2h 22m", match: 99,
    poster: "https://image.tmdb.org/t/p/w500/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
    tags: ["Drama"], section: "hollywood"
  },

  /* ── BOLLYWOOD ── */
  {
    id: 29, title: "RRR", year: 2022, rating: 7.8,
    category: "Bollywood", genre: "Action, Drama, History",
    cast: "N.T. Rama Rao Jr., Ram Charan, Ajay Devgn",
    desc: "A fictional history of two legendary revolutionaries' journey away from home before they began to fight for their country in the 1920s.",
    maturity: "NR", episodes: "3h 2m", match: 90,
    poster: "https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO6QKv2e2kLBVhhK.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/jeAQdDX9nguP3c1oEMLOy0pcrV9.jpg",
    tags: ["Action", "Drama", "History"], section: "bolly"
  },
  {
    id: 30, title: "3 Idiots", year: 2009, rating: 8.4,
    category: "Bollywood", genre: "Comedy, Drama",
    cast: "Aamir Khan, R. Madhavan, Sharman Joshi",
    desc: "Two friends search for their long lost companion who inspired them to think differently, even as they recall their college days.",
    maturity: "PG-13", episodes: "2h 50m", match: 96,
    poster: "https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/2Pjfao5MLymwLkCOGfp5mS8Gvnv.jpg",
    tags: ["Comedy", "Drama"], section: "bolly"
  },
  {
    id: 31, title: "Dangal", year: 2016, rating: 8.4,
    category: "Bollywood", genre: "Biography, Drama, Sport",
    cast: "Aamir Khan, Fatima Sana Shaikh, Sanya Malhotra",
    desc: "Former wrestler Mahavir Singh Phogat and his two daughters Geeta and Babita Phogat achieve gold and silver at the 2010 Commonwealth Games in wrestling.",
    maturity: "PG", episodes: "2h 41m", match: 94,
    poster: "https://image.tmdb.org/t/p/w500/jkEivyFnFbsQxuOrJqxfGfVbW0V.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/2Jua4Tv2vjPjfqgAtKxTqnr0BEV.jpg",
    tags: ["Sports", "Drama", "Biopic"], section: "bolly"
  },
  {
    id: 32, title: "Pathaan", year: 2023, rating: 5.7,
    category: "Bollywood", genre: "Action, Adventure, Thriller",
    cast: "Shah Rukh Khan, Deepika Padukone, John Abraham",
    desc: "An unnamed spy rescues Indian soldiers held captive in Afghanistan and joins forces with a woman to investigate a nefarious global organization.",
    maturity: "NR", episodes: "2h 26m", match: 78,
    poster: "https://image.tmdb.org/t/p/w500/eU2VR6R2CKm6xYZKiUdJvP21Z5D.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/2vFuG6bWGyQUzYS9d69E5l85nIz.jpg",
    tags: ["Action", "Thriller", "Adventure"], section: "bolly"
  },
  {
    id: 33, title: "Bajrangi Bhaijaan", year: 2015, rating: 8.1,
    category: "Bollywood", genre: "Adventure, Drama",
    cast: "Salman Khan, Kareena Kapoor, Nawazuddin Siddiqui",
    desc: "An Indian man with a magnanimous heart takes a speech-impaired Pakistani girl back to her homeland to reunite her with her family.",
    maturity: "PG-13", episodes: "2h 43m", match: 88,
    poster: "https://image.tmdb.org/t/p/w500/3qMaGKLZ2KsNTkSA8jy0k3jbOA6.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/fV5cVfKerKpkqV4iD2P9e3i8C8j.jpg",
    tags: ["Drama", "Adventure"], section: "bolly"
  },
];

/* Hero movies (featured on banner) */
const HERO_MOVIES = [MOVIES[0], MOVIES[1], MOVIES[2], MOVIES[7], MOVIES[12]];

/* ── State ─────────────────────────────────────────────── */
let myList     = new Set();
let heroIndex  = 0;
let heroTimer  = null;
let searchOpen = false;

/* ── Init ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    buildHeroIndicators();
    renderHero(heroIndex);
    startHeroRotation();

    renderRow('track-trending', MOVIES.filter(m => m.section === 'trending'));
    renderRow('track-picks',    MOVIES.filter(m => m.section === 'picks'));
    renderRow('track-anime',    MOVIES.filter(m => m.section === 'anime'));
    renderRow('track-kdrama',   MOVIES.filter(m => m.section === 'kdrama'));
    renderRow('track-hollywood',MOVIES.filter(m => m.section === 'hollywood'));
    renderRow('track-bolly',    MOVIES.filter(m => m.section === 'bolly'));

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
    });

    // Nav link category filter
    document.querySelectorAll('.nav-link[data-category]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const cat = link.dataset.category;
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            filterCategory(cat);
        });
    });
});

/* ── Hero Banner ─────────────────────────────────────── */
function buildHeroIndicators() {
    const wrap = document.getElementById('heroIndicators');
    wrap.innerHTML = '';
    HERO_MOVIES.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
        dot.onclick = () => { clearInterval(heroTimer); renderHero(i); startHeroRotation(); };
        wrap.appendChild(dot);
    });
}

function renderHero(idx) {
    heroIndex = idx;
    const m = HERO_MOVIES[idx];
    const bg = document.getElementById('heroBg');
    bg.style.backgroundImage = `url('${m.backdrop || m.poster}')`;
    document.getElementById('heroTitle').textContent = m.title;
    document.getElementById('heroDesc').textContent  = m.desc;
    document.getElementById('heroMeta').innerHTML = `
        <span class="hero-rating"><i class="fa-solid fa-star"></i> ${m.rating}</span>
        <span>${m.year}</span>
        <span class="maturity">${m.maturity}</span>
        <span>${m.episodes}</span>
    `;
    document.getElementById('heroTags').innerHTML = m.tags.map(t => `<span>${t}</span>`).join('');

    // My List button state
    const addBtn = document.getElementById('heroAddBtn');
    if (myList.has(m.id)) {
        addBtn.classList.add('added');
        addBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
    } else {
        addBtn.classList.remove('added');
        addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
    }
    addBtn.onclick = () => toggleMyList(m.id);

    // Indicators
    document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

function startHeroRotation() {
    heroTimer = setInterval(() => {
        renderHero((heroIndex + 1) % HERO_MOVIES.length);
    }, 6000);
}

function changeHero(dir) {
    clearInterval(heroTimer);
    renderHero((heroIndex + dir + HERO_MOVIES.length) % HERO_MOVIES.length);
    startHeroRotation();
}

/* ── Render Movie Cards ─────────────────────────────── */
function renderRow(trackId, movies) {
    const track = document.getElementById(trackId);
    if (!track) return;

    if (movies.length === 0) {
        track.innerHTML = `<div style="padding: 30px 0; color: #666; font-size: 14px;">No titles found.</div>`;
        return;
    }

    track.innerHTML = movies.map((m, i) => createCardHTML(m, i)).join('');
}

function createCardHTML(m, i) {
    const inList = myList.has(m.id) ? 'in-list' : '';
    const inListIcon = myList.has(m.id) ? 'fa-check' : 'fa-plus';
    const rankBadge = m.rank ? `<div class="card-rank">#${m.rank}</div>` : '';

    return `
    <div class="movie-card" id="card-${m.id}" onclick="openModal(${m.id})">
        <img class="card-poster"
             src="${m.poster}"
             alt="${m.title}"
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/300x450/1a1a1a/555?text=${encodeURIComponent(m.title)}'">
        ${rankBadge}

        <!-- HOVER CARD POPUP -->
        <div class="hover-card" onclick="event.stopPropagation()">
            <div class="hover-actions">
                <button class="hov-play" onclick="playMovie(${m.id}, event)" title="Play">
                    <i class="fa-solid fa-play"></i>
                </button>
                <button class="hov-icon ${inList}" id="hov-add-${m.id}"
                        onclick="toggleMyList(${m.id}, event)" title="Add to My List">
                    <i class="fa-solid ${inListIcon}" id="hov-add-icon-${m.id}"></i>
                </button>
                <button class="hov-icon" onclick="likeMovie(${m.id}, event)" title="Like">
                    <i class="fa-solid fa-thumbs-up"></i>
                </button>
                <button class="hov-expand" onclick="openModal(${m.id})" title="More Info">
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
            </div>

            <div class="hover-title">${m.title}</div>

            <div class="hover-meta">
                <span class="hover-match">${m.match}% Match</span>
                <span class="hover-year">${m.year}</span>
                <span class="hover-maturity">${m.maturity}</span>
                <span class="hover-ep">${m.episodes}</span>
                <span class="hover-rating"><i class="fa-solid fa-star"></i> ${m.rating}</span>
            </div>

            <div class="hover-genres">
                ${m.tags.map(t => `<span class="hover-genre-tag">${t}</span>`).join('')}
            </div>
        </div>
    </div>`;
}

/* ── Row Slider ────────────────────────────────────── */
function slideRow(rowId, dir) {
    const row   = document.getElementById(rowId);
    const track = row.querySelector('.cards-track');
    const card  = track.querySelector('.movie-card');
    if (!card) return;
    const scrollAmt = (card.offsetWidth + 8) * 3 * dir;
    track.scrollBy({ left: scrollAmt, behavior: 'smooth' });
}

/* ── My List ─────────────────────────────────────── */
function toggleMyList(movieId, e) {
    if (e) e.stopPropagation();
    if (myList.has(movieId)) {
        myList.delete(movieId);
        showToast('Removed from My List');
    } else {
        myList.add(movieId);
        showToast('Added to My List ✓');
    }
    // Update all add-buttons for this movie
    document.querySelectorAll(`[id^="hov-add-${movieId}"]`).forEach(btn => {
        btn.classList.toggle('in-list', myList.has(movieId));
    });
    document.querySelectorAll(`[id^="hov-add-icon-${movieId}"]`).forEach(icon => {
        icon.className = `fa-solid ${myList.has(movieId) ? 'fa-check' : 'fa-plus'}`;
    });
    // Update hero button if same movie
    const heroMovie = HERO_MOVIES[heroIndex];
    if (heroMovie && heroMovie.id === movieId) {
        const btn = document.getElementById('heroAddBtn');
        if (btn) {
            btn.classList.toggle('added', myList.has(movieId));
            btn.innerHTML = myList.has(movieId) ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-plus"></i>';
        }
    }
    // Update modal button if open
    const modalBtn = document.getElementById('modalAddBtn');
    if (modalBtn && modalBtn.dataset.movieId == movieId) {
        modalBtn.classList.toggle('added', myList.has(movieId));
        modalBtn.innerHTML = myList.has(movieId) ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-plus"></i>';
    }
}

/* ── Like ──────────────────────────────────────── */
function likeMovie(movieId, e) {
    if (e) e.stopPropagation();
    showToast('Liked! 👍');
}

/* ── Play ──────────────────────────────────────── */
function playMovie(movieId, e) {
    if (e) e.stopPropagation();
    showToast('Loading player...');
}

/* ── Modal ───────────────────────────────────── */
function openModal(movieId) {
    const m = MOVIES.find(x => x.id === movieId);
    if (!m) return;

    document.getElementById('modalPoster').src   = m.backdrop || m.poster;
    document.getElementById('modalPoster').alt   = m.title;
    document.getElementById('modalTitle').textContent = m.title;
    document.getElementById('modalDesc').textContent  = m.desc;
    document.getElementById('modalCast').textContent  = m.cast;
    document.getElementById('modalGenre').textContent = m.genre;
    document.getElementById('modalYear').textContent  = m.year;

    document.getElementById('modalMeta').innerHTML = `
        <span class="hover-match">${m.match}% Match</span>
        <span>${m.year}</span>
        <span class="maturity">${m.maturity}</span>
        <span>${m.episodes}</span>
        <span class="hover-rating"><i class="fa-solid fa-star"></i> ${m.rating}</span>
    `;

    document.getElementById('modalTags').innerHTML =
        m.tags.map(t => `<span>${t}</span>`).join('');

    const addBtn = document.getElementById('modalAddBtn');
    addBtn.dataset.movieId = movieId;
    addBtn.classList.toggle('added', myList.has(movieId));
    addBtn.innerHTML = myList.has(movieId) ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-plus"></i>';
    addBtn.onclick = () => toggleMyList(movieId);

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('movieModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('movieModal').classList.remove('open');
    document.body.style.overflow = '';
}

// ESC to close modal
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

/* ── Search ──────────────────────────────────── */
function toggleSearch() {
    searchOpen = !searchOpen;
    const wrap = document.getElementById('searchWrap');
    wrap.classList.toggle('open', searchOpen);
    if (searchOpen) {
        setTimeout(() => document.getElementById('searchInput').focus(), 100);
    } else {
        document.getElementById('searchInput').value = '';
        filterSearch('');
    }
}

let searchTimeout = null;
function filterSearch(q) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = q.trim().toLowerCase();
        if (!query) {
            ['trending','picks','anime','kdrama','hollywood','bolly'].forEach(s => {
                renderRow(`track-${s}`, MOVIES.filter(m => m.section === s));
            });
            document.getElementById('mainContent').querySelectorAll('.movie-row').forEach(r => r.style.display = '');
            return;
        }
        const results = MOVIES.filter(m =>
            m.title.toLowerCase().includes(query) ||
            m.genre.toLowerCase().includes(query) ||
            m.tags.some(t => t.toLowerCase().includes(query)) ||
            m.cast.toLowerCase().includes(query)
        );
        // Render all results into trending row, hide others
        renderRow('track-trending', results);
        document.getElementById('row-trending').querySelector('.row-title').innerHTML =
            `<span class="row-dot"></span> Search Results for "${q}"`;
        ['picks','anime','kdrama','hollywood','bolly'].forEach(s => {
            const row = document.getElementById(`row-${s}`);
            if (row) row.style.display = 'none';
        });
    }, 280);
}

/* ── Category Filter ──────────────────────────── */
function filterCategory(cat, btn) {
    // Update category bar buttons
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const rows = {
        trending: MOVIES.filter(m => m.section === 'trending'),
        picks:    MOVIES.filter(m => m.section === 'picks'),
        anime:    MOVIES.filter(m => m.section === 'anime'),
        kdrama:   MOVIES.filter(m => m.section === 'kdrama'),
        hollywood:MOVIES.filter(m => m.section === 'hollywood'),
        bolly:    MOVIES.filter(m => m.section === 'bolly'),
    };

    if (cat === 'all') {
        // Show everything, restore
        document.querySelectorAll('.movie-row').forEach(r => r.style.display = '');
        Object.entries(rows).forEach(([key, movies]) => {
            renderRow(`track-${key}`, movies);
            const titleEl = document.querySelector(`#row-${key === 'bolly' ? 'bolly' : key} .row-title`);
        });
    } else {
        // Filter all rows to show only matching category
        const filtered = MOVIES.filter(m =>
            m.category === cat ||
            m.section === cat.toLowerCase() ||
            m.genre.toLowerCase().includes(cat.toLowerCase()) ||
            m.tags.some(t => t.toLowerCase().includes(cat.toLowerCase()))
        );
        renderRow('track-trending', filtered);
        const titleSpan = document.querySelector('#row-trending .row-title');
        if (titleSpan) titleSpan.innerHTML = `<span class="row-dot"></span> ${getCatLabel(cat)}`;

        ['picks','anime','kdrama','hollywood','bolly'].forEach(s => {
            const row = document.getElementById(`row-${s}`);
            if (row) row.style.display = 'none';
        });
        document.getElementById('row-trending').style.display = '';
    }
    // Close sidebar if open
    closeSidebar();
}

function getCatLabel(cat) {
    const map = { all: 'All', Movie: 'Movies', tvshow: 'TV Shows', Anime: 'Anime', KDrama: 'K-Drama', Bollywood: 'Bollywood', Hollywood: 'Hollywood', new: 'New & Hot' };
    return map[cat] || cat;
}

/* ── Sidebar ────────────────────────────────── */
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebarOverlay');
    const isOpen = sb.classList.toggle('open');
    ov.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

/* ── Toast ──────────────────────────────────── */
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}
