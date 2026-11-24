// Maps URLs from the old static site to their language-neutral replacements.
// The targets then negotiate a language with a 302, so these can be 301s:
// a permanent redirect must never depend on who is asking.

const PAGES = {
    about: '/about',
    services: '/services',
    projects: '/projects',
    blog: '/journal',
    index: '/',
};

const LEGACY_PAGE = /^\/pages\/([a-z-]+?)(?:\.html)?\/?$/;
const SLUG = /^[A-Za-z0-9._~-]{1,120}$/;

function withQuery(path, params) {
    const query = params.toString();
    return query ? `${path}?${query}` : path;
}

// Returns the target path (with any remaining query) or null.
export function legacyRedirect(url) {
    const { pathname } = url;
    const params = new URLSearchParams(url.search);

    if (pathname === '/index.html') return withQuery('/', params);

    const match = LEGACY_PAGE.exec(pathname);
    if (!match) return null;
    const name = match[1];

    if (name === 'blog-post') {
        const slug = params.get('slug');
        params.delete('slug');
        if (slug && SLUG.test(slug)) return withQuery(`/journal/${encodeURIComponent(slug)}`, params);
        return withQuery('/journal', params);
    }
    return Object.hasOwn(PAGES, name) ? withQuery(PAGES[name], params) : null;
}
