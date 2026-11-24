export function json(data, init = {}) {
    const headers = new Headers(init.headers);
    headers.set('content-type', 'application/json; charset=utf-8');
    if (!headers.has('cache-control')) headers.set('cache-control', 'no-store');
    return new Response(JSON.stringify(data), { ...init, headers });
}

async function etagFor(body) {
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(body));
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `"${hex}"`;
}

function matchesEtag(request, etag) {
    const header = request.headers.get('if-none-match');
    if (!header) return false;
    return header.split(',').some((tag) => tag.trim().replace(/^W\//, '') === etag);
}

// Text responses with an ETag so browsers can revalidate cheaply. Cloudflare
// may weaken the ETag when compressing, so W/ is ignored when comparing.
export async function textResponse(request, body, { status = 200, contentType, headers = {}, cacheControl } = {}) {
    const out = new Headers(headers);
    out.set('content-type', contentType);
    out.set('cache-control', cacheControl ?? (status === 200 ? 'public, max-age=0, must-revalidate' : 'no-store'));
    if (status === 200) {
        const etag = await etagFor(body);
        out.set('etag', etag);
        if (matchesEtag(request, etag)) return new Response(null, { status: 304, headers: out });
    }
    return new Response(request.method === 'HEAD' ? null : body, { status, headers: out });
}

export function htmlResponse(request, body, options = {}) {
    return textResponse(request, String(body), { ...options, contentType: 'text/html; charset=utf-8' });
}

export function redirect(location, status, headers = {}) {
    return new Response(null, { status, headers: { location, ...headers } });
}
