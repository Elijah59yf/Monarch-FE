export function parseCookies(header) {
    const cookies = new Map();
    if (!header) return cookies;
    for (const part of header.split(';')) {
        const eq = part.indexOf('=');
        if (eq < 0) continue;
        const name = part.slice(0, eq).trim();
        if (!name || cookies.has(name)) continue;
        let value = part.slice(eq + 1).trim();
        try {
            value = decodeURIComponent(value);
        } catch {
            // keep the raw value
        }
        cookies.set(name, value);
    }
    return cookies;
}
