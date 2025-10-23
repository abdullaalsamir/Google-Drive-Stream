import { escapeHtml } from './helpers.js';

export function renderPlayer(filename, subs) {
    const safe = encodeURIComponent(filename);
    const tracks = subs.map((s, i) => `<track label="Sub ${i + 1}" kind="subtitles" srclang="en" src="/${encodeURIComponent(s.name)}" default>`).join("\n");

    return `<!DOCTYPE html>
  <html><head><meta charset="utf-8"><title>${filename}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/plyr@3/dist/plyr.css" />
  </head>
  <body>
  <video id="player" controls crossorigin playsinline preload="metadata" autoplay>
    <source src="/${safe}" type="video/mp4">${tracks}
  </video>
  <button onclick="window.history.back()">✕</button>
  <script src="https://cdn.jsdelivr.net/npm/plyr@3/dist/plyr.polyfilled.min.js"></script>
  <script>const player=new Plyr('#player'); player.play().catch(()=>{});</script>
  </body></html>`;
}

// renderIndex() will be similar, include the grid HTML with posters
