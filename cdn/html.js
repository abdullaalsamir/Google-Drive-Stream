// cdn/html.js

async function renderIndex(files) {
    const items = await buildItemsWithPosters(files);

    const header = await (await fetch("https://cdn.jsdelivr.net/gh/abdullaalsamir/gds@v1.0.1/cdn/header.html")).text();
    const styles = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/abdullaalsamir/gds@v1.0.1/cdn/style.css" />`;

    return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>SAMFLIX</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    ${styles}
  </head>
  <body>
  ${header}
  <div class="container">
    <main>
      <div class="grid">
        ${items.map(
        (item) => `
          <a class="card" href="/${item.encoded}?a=view" title="${escapeHtml(item.title)}">
            <div class="thumb" style="background-image:url('${item.poster}')" role="img" aria-label="${escapeHtml(item.title)}">
              <div class="play-icon">▶</div>
            </div>
            <div class="title">${escapeHtml(item.title)}</div>
          </a>
        `
    ).join("")}
      </div>
    </main>
  </div>
  </body>
  </html>`;
}

function renderPlayer(filename, subs) {
    const encoded = encodeURIComponent(filename);

    // 🔗 External header and style references (same as renderIndex)
    const header = `<div id="header"></div>`;
    const styles = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/abdullaalsamir/gds@v1.0.1/cdn/style.css">`;

    return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(filename)}</title>
    ${styles}
    <script>
      // Load header.html dynamically (same pattern as renderIndex)
      fetch("https://cdn.jsdelivr.net/gh/abdullaalsamir/gds@v1.0.1/cdn/header.html")
        .then(r => r.text())
        .then(h => document.getElementById("header").innerHTML = h);
    </script>
  </head>
  <body>
    ${header}

    <div class="player-container">
      <video controls autoplay crossorigin="anonymous" playsinline>
        <source src="/${encoded}" type="video/mp4">
        ${subs
            .map(
                (sub) =>
                    `<track label="${escapeHtml(sub.name)}" kind="subtitles" src="/${encodeURIComponent(
                        sub.name
                    )}" srclang="en" default>`
            )
            .join("")}
        Your browser does not support HTML5 video.
      </video>
    </div>
  </body>
  </html>`;
}


async function buildItemsWithPosters(files) {
    const videos = files.filter((f) => isVideoFile(f.name));
    const items = await Promise.all(
        videos.map(async (f) => {
            const { title, year: fileYear } = parseMovieName(f.name);
            const { poster, release_date: tmdbDate } = await fetchPosterForMovie(
                title,
                fileYear
            );
            const displayYear = tmdbDate ? tmdbDate.slice(0, 4) : fileYear;
            return {
                name: f.name,
                encoded: encodeURIComponent(f.name),
                title: title + (displayYear ? ` (${displayYear})` : ""),
                poster: poster || FALLBACK_SVG_BASE64,
                release_date: tmdbDate || "0000-00-00",
            };
        })
    );

    items.sort((a, b) => {
        if (!a.release_date) return 1;
        if (!b.release_date) return -1;
        return new Date(b.release_date) - new Date(a.release_date);
    });

    return items;
}
