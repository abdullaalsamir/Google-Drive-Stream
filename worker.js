// ...existing code...
// replace hard-coded secrets with environment-bound names (set these as Worker secrets)
const CLIENT_ID = typeof CLIENT_ID !== "undefined" ? CLIENT_ID : "";
const CLIENT_SECRET = typeof CLIENT_SECRET !== "undefined" ? CLIENT_SECRET : "";
const REFRESH_TOKEN = typeof REFRESH_TOKEN !== "undefined" ? REFRESH_TOKEN : "";
const FOLDER_ID = typeof FOLDER_ID !== "undefined" ? FOLDER_ID : "";
const TMDB_API_KEY = typeof TMDB_API_KEY !== "undefined" ? TMDB_API_KEY : "";
const OMDB_API_KEY = typeof OMDB_API_KEY !== "undefined" ? OMDB_API_KEY : "";

// CDN base (host these new files on your CDN)
const CDN_BASE = "https://cdn.example.com/samflix";
// ...existing code...

// inside renderIndex(...) replace inline CSS+script with CDN refs
// ...existing code...
return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SAMFLIX</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/modern-normalize/modern-normalize.css" />
  <link rel="stylesheet" href="${CDN_BASE}/index.css">
</head>
<body>
<header>
  <img class="logo" src="${CDN_BASE}/logo.svg" alt="logo" height="60">
</header>

<div class="container">
  <main>
    <div class="grid">
      ${items.map(item => `
        <a class="card" href="/${item.encoded}?a=view" title="${escapeHtml(item.title)}">
          <div class="thumb" data-bg="${item.poster}" role="img" aria-label="${escapeHtml(item.title)}">
            <div class="play-icon">▶</div>
          </div>
          <div class="title">${escapeHtml(item.title)}</div>
        </a>
      `).join("")}
    </div>
  </main>
</div>

<script src="${CDN_BASE}/index.js" defer></script>
</body>
</html>`;
// ...existing code...

// inside renderPlayer(...) replace inline CSS+script with CDN refs
// ...existing code...
return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(filename)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/plyr@3/dist/plyr.css" />
  <link rel="stylesheet" href="${CDN_BASE}/player.css" />
</head>
<body>
  <video id="player" controls crossorigin playsinline preload="metadata" autoplay>
    <source src="/${safe}" type="video/mp4">
    ${tracks}
  </video>
  <button class="close-btn" onclick="window.history.back()">✕</button>

  <script src="https://cdn.jsdelivr.net/npm/plyr@3/dist/plyr.polyfilled.min.js"></script>
  <script src="${CDN_BASE}/player.js" defer></script>
</body>
</html>`;
// ...existing code...