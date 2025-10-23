// cdn/utils.js

function isVideoFile(name) {
    return /\.(mp4|webm|ogg|mov|mkv|avi|flv)$/i.test(name);
}

function parseMovieName(filename) {
    const name = filename.replace(/\.[^.]+$/, "");
    const parts = name.split(/[\s._]+/);
    let year = null;
    for (let i = 0; i < parts.length; i++) {
        if (/^(19|20)\d{2}$/.test(parts[i])) {
            year = parts[i];
            const titleParts = parts.slice(0, i);
            const title = titleParts.join(" ").trim();
            return {
                title: beautifyTitle(title || parts.slice(0, parts.length).join(" ")),
                year,
            };
        }
    }
    return { title: beautifyTitle(parts.join(" ")), year: null };
}

function beautifyTitle(raw) {
    const cleaned = raw.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    return cleaned
        .split(" ")
        .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ");
}

async function fetchPosterForMovie(title, year) {
    if (!title) return { poster: null, release_date: null };
    const q = encodeURIComponent(title);
    const yearParam = year ? `&year=${encodeURIComponent(year)}` : "";
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${q}${yearParam}&include_adult=false&page=1`;

    try {
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) return { poster: null, release_date: null };
        const searchData = await searchRes.json();
        if (!searchData?.results?.length)
            return { poster: null, release_date: null };

        let movie = null;
        if (year) {
            movie = searchData.results.find((r) =>
                String(r.release_date || "").startsWith(String(year))
            );
        }
        if (!movie) movie = searchData.results[0];
        if (!movie) return { poster: null, release_date: null };

        const release_date = movie.release_date || null;

        const imagesUrl = `https://api.themoviedb.org/3/movie/${movie.id}/images?api_key=${TMDB_API_KEY}`;
        const imagesRes = await fetch(imagesUrl);
        let poster = null;
        if (imagesRes.ok) {
            const imagesData = await imagesRes.json();
            if (imagesData?.backdrops?.length) {
                const enBackdrop = imagesData.backdrops.find(
                    (b) => b.iso_639_1 === "en"
                );
                const selected = enBackdrop || imagesData.backdrops[0];
                poster = `${TMDB_IMAGE_BASE}${selected.file_path}`;
            }
        }
        if (!poster)
            poster = movie.backdrop_path
                ? TMDB_IMAGE_BASE + movie.backdrop_path
                : null;

        return { poster, release_date };
    } catch (err) {
        console.error("TMDb fetch failed:", err);
        return { poster: null, release_date: null };
    }
}

const FALLBACK_SVG_BASE64 = (() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='281' viewBox='0 0 500 281'>
    <rect width='100%' height='100%' fill='#222'/>
    <text x='50%' y='50%' font-size='20' fill='#eee' dominant-baseline='middle' text-anchor='middle'>No Poster</text>
  </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
})();

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function srtToVtt(data) {
    return (
        "WEBVTT\n\n" +
        data
            .replace(/\r+/g, "")
            .replace(/^\s+|\s+$/g, "")
            .split("\n\n")
            .map((block) => block.replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, "$1.$2"))
            .join("\n\n")
    );
}
