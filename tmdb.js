export async function fetchPosterForMovie(title, year, TMDB_API_KEY) {
    if (!title) return { poster: null, release_date: null };
    const q = encodeURIComponent(title);
    const yearParam = year ? `&year=${encodeURIComponent(year)}` : "";
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${q}${yearParam}&include_adult=false&page=1`;

    try {
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) return { poster: null, release_date: null };
        const searchData = await searchRes.json();
        if (!searchData?.results?.length) return { poster: null, release_date: null };

        let movie = year ? searchData.results.find(r => String(r.release_date || "").startsWith(String(year))) : searchData.results[0];
        if (!movie) movie = searchData.results[0];

        const release_date = movie.release_date || null;
        const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
        return { poster, release_date };
    } catch {
        return { poster: null, release_date: null };
    }
}
