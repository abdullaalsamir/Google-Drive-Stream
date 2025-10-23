export function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

export function srtToVtt(data) {
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

export function parseMovieName(filename) {
    const name = filename.replace(/\.[^.]+$/, "");
    const parts = name.split(/[\s._]+/);
    let year = null;
    for (let i = 0; i < parts.length; i++) {
        if (/^(19|20)\d{2}$/.test(parts[i])) {
            year = parts[i];
            const titleParts = parts.slice(0, i);
            const title = titleParts.join(" ").trim();
            return { title: beautifyTitle(title || parts.slice(0, parts.length).join(" ")), year };
        }
    }
    return { title: beautifyTitle(parts.join(" ")), year: null };
}

export function beautifyTitle(raw) {
    const cleaned = raw.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    return cleaned
        .split(" ")
        .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ");
}
