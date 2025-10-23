// cdn/main.js
// All main logic (except secrets) from original worker.js

async function getAccessToken() {
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: "refresh_token",
        }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error_description);
    return data.access_token;
}

async function listFiles(token, folderId) {
    const q = encodeURIComponent(`'${folderId}' in parents`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=folder,name`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.files || [];
}

async function findFileByName(token, name, folderId) {
    const q = encodeURIComponent(`'${folderId}' in parents and name='${name}'`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size)`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.files?.[0];
}

async function streamFile(token, fileId, range) {
    const headers = { Authorization: `Bearer ${token}` };
    if (range) headers.Range = range;
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    return fetch(url, { headers });
}

async function handleRequest(req) {
    const url = new URL(req.url);
    const path = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const mode = url.searchParams.get("a");
    const token = await getAccessToken();

    if (!path) {
        const files = await listFiles(token, FOLDER_ID);
        return new Response(await renderIndex(files), {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    }

    const file = await findFileByName(token, path, FOLDER_ID);
    if (!file) return new Response("404 Not Found", { status: 404 });

    if (file.name.toLowerCase().endsWith(".srt")) {
        const src = await (await streamFile(token, file.id)).text();
        const vtt = srtToVtt(src);
        return new Response(vtt, {
            headers: { "Content-Type": "text/vtt; charset=utf-8" },
        });
    }

    if (mode === "view") {
        return await renderViewPage(file, token);
    }

    if (mode === "play") {
        const files = await listFiles(token, FOLDER_ID);
        const subs = files.filter(
            (f) =>
                f.name.startsWith(file.name.replace(/\.[^.]+$/, "")) &&
                f.name.toLowerCase().endsWith(".srt")
        );
        return new Response(renderPlayer(file.name, subs), {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    }

    const range = req.headers.get("Range");
    const fileRes = await streamFile(token, file.id, range);
    const headers = new Headers(fileRes.headers);
    headers.set("Content-Disposition", `inline; filename="${file.name}"`);
    return new Response(fileRes.body, { status: fileRes.status, headers });
}

async function renderViewPage(file, token) {
    const files = await listFiles(token, FOLDER_ID);
    const subs = files.filter(
        (f) =>
            f.name.startsWith(file.name.replace(/\.[^.]+$/, "")) &&
            f.name.toLowerCase().endsWith(".srt")
    );

    const { title, year: fileYear } = parseMovieName(file.name);

    const q = encodeURIComponent(title);
    const yearParam = fileYear ? `&year=${encodeURIComponent(fileYear)}` : "";
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${q}${yearParam}&include_adult=false&page=1`;

    let movie = null;
    try {
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        if (searchData.results?.length) {
            movie = searchData.results.find(r =>
                fileYear ? String(r.release_date || "").startsWith(String(fileYear)) : true
            ) || searchData.results[0];
        }
    } catch (err) {
        console.error("TMDB search failed", err);
    }

    let details = {};
    if (movie) {
        const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=external_ids`;
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) details = await detailsRes.json();
    }

    const poster = movie?.poster_path ? TMDB_IMAGE_BASE + movie.poster_path : FALLBACK_SVG_BASE64;
    const backdrop = movie?.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : "";
    const releaseDate = details.release_date
        ? new Date(details.release_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }).replace(/(\d{1,2} \w+) (\d{4})/, "$1, $2")
        : movie?.release_date
            ? new Date(movie.release_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }).replace(/(\d{1,2} \w+) (\d{4})/, "$1, $2")
            : "Unknown";
    const runtime = details.runtime
        ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
        : "N/A";
    const genres = details.genres ? details.genres.map(g => g.name).join(", ") : "N/A";

    const overview = details.overview || "No description available.";

    let imdbRating = 0;
    let imdbVotes = 0;

    try {
        if (details.external_ids?.imdb_id) {
            const imdbRes = await fetch(`https://www.omdbapi.com/?i=${details.external_ids.imdb_id}&apikey=${OMDB_API_KEY}`);
            const imdbData = await imdbRes.json();
            if (imdbData?.imdbRating && imdbData.imdbRating !== "N/A") {
                imdbRating = parseFloat(imdbData.imdbRating);
            }
            if (imdbData?.imdbVotes && imdbData.imdbVotes !== "N/A") {
                imdbVotes = parseInt(imdbData.imdbVotes.replace(/,/g, ''));
            }
        }
    } catch (err) {
        console.error("IMDb fetch failed", err);
    }

    const ratingValue = imdbRating;
    const voteCount = imdbVotes;

    const starWidth = imdbRating ? Math.min((imdbRating / 10) * 100, 100) : 0;

    return new Response(await renderViewHtml({
        title, file, details, poster, backdrop,
        releaseDate, runtime, genres, overview,
        imdbRating, imdbVotes, ratingValue, voteCount, starWidth
    }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}
