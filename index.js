import { getAccessToken, listFiles, findFileByName, streamFile } from './drive.js';
import { parseMovieName, beautifyTitle, escapeHtml, srtToVtt } from './helpers.js';
import { fetchPosterForMovie } from './tmdb.js';
import { renderIndex, renderPlayer } from './player.js';

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const FALLBACK_SVG_BASE64 = (() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='281' viewBox='0 0 500 281'>
    <rect width='100%' height='100%' fill='#222'/>
    <text x='50%' y='50%' font-size='20' fill='#eee' dominant-baseline='middle' text-anchor='middle'>No Poster</text>
  </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
})();

export async function handleRequest(req, secrets) {
    const url = new URL(req.url);
    const path = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const mode = url.searchParams.get("a");
    const token = await getAccessToken(secrets);

    if (!path) {
        const files = await listFiles(token, secrets.FOLDER_ID);
        return new Response(await renderIndex(files), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    const file = await findFileByName(token, path, secrets.FOLDER_ID);
    if (!file) return new Response("404 Not Found", { status: 404 });

    if (file.name.toLowerCase().endsWith(".srt")) {
        const src = await (await streamFile(token, file.id)).text();
        const vtt = srtToVtt(src);
        return new Response(vtt, { headers: { "Content-Type": "text/vtt; charset=utf-8" } });
    }

    if (mode === "view") {
        const files = await listFiles(token, secrets.FOLDER_ID);
        const subs = files.filter(f => f.name.startsWith(file.name.replace(/\.[^.]+$/, "")) && f.name.toLowerCase().endsWith(".srt"));

        const { title, year: fileYear } = parseMovieName(file.name);

        let movieDetails = await fetchPosterForMovie(title, fileYear, secrets.TMDB_API_KEY);

        return new Response(await renderIndex(files, movieDetails, file, subs, secrets), {
            headers: { "Content-Type": "text/html; charset=utf-8" }
        });
    }

    if (mode === "play") {
        const files = await listFiles(token, secrets.FOLDER_ID);
        const subs = files.filter(f => f.name.startsWith(file.name.replace(/\.[^.]+$/, "")) && f.name.toLowerCase().endsWith(".srt"));
        return new Response(renderPlayer(file.name, subs), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    const range = req.headers.get("Range");
    const fileRes = await streamFile(token, file.id, range);
    const headers = new Headers(fileRes.headers);
    headers.set("Content-Disposition", `inline; filename="${file.name}"`);
    return new Response(fileRes.body, { status: fileRes.status, headers });
}
