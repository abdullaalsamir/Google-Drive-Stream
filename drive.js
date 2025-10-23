export async function getAccessToken({ CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN }) {
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

export async function listFiles(token, folderId) {
    const q = encodeURIComponent(`'${folderId}' in parents`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=folder,name`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return data.files || [];
}

export async function findFileByName(token, name, folderId) {
    const q = encodeURIComponent(`'${folderId}' in parents and name='${name}'`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size)`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return data.files?.[0];
}

export async function streamFile(token, fileId, range) {
    const headers = { Authorization: `Bearer ${token}` };
    if (range) headers.Range = range;
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    return fetch(url, { headers });
}
