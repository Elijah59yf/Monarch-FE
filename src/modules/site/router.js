import { htmlResponse, json, redirect, textResponse } from '../../lib/http.js';
import { DEFAULT_LANG, isLang, negotiate } from '../i18n/index.js';
import * as settings from '../settings/index.js';
import { contentContext } from '../strapi/index.js';
import { layout } from './layout.js';
import { matchPage } from './routes.js';
import { localizedPath } from './paths.js';
import { notFound, serverError } from './pages/status.js';
import { robots, sitemap } from './seo.js';

const PAGE_SETTINGS = ['business.name', 'business.contact_email', 'business.timezone'];
const LANG_PREFIX = /^\/([a-z]{2})(\/.*)?$/;

const NEGOTIATED = {
    'cache-control': 'private, no-store',
    vary: 'Cookie, Accept-Language',
};
const PERMANENT = { 'cache-control': 'public, max-age=86400' };

function siteUrl(env, url) {
    return (env.SITE_URL || url.origin).replace(/\/+$/, '');
}

function methodNotAllowed() {
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
}

async function renderPage(context, url, lang, path, match) {
    const { request, env } = context;
    const ctx = {
        lang,
        path,
        params: match?.params ?? {},
        env,
        siteUrl: siteUrl(env, url),
        settings: await settings.getMany(env, PAGE_SETTINGS),
        content: contentContext({ env, origin: url.origin, waitUntil: (p) => context.waitUntil(p) }),
    };

    let page = match ? await match.page.render(ctx) : { notFound: true };
    if (page.notFound) page = notFound(ctx);

    const status = page.status ?? 200;
    const headers = { 'content-language': lang };
    if (status === 503) headers['retry-after'] = '120';
    return htmlResponse(request, layout(page, ctx), { status, headers });
}

async function renderError(context, url, lang) {
    try {
        const ctx = {
            lang,
            path: '/',
            siteUrl: siteUrl(context.env, url),
            settings: await settings.getMany(context.env, PAGE_SETTINGS),
        };
        return htmlResponse(context.request, layout(serverError(ctx), ctx), { status: 500 });
    } catch (err) {
        console.error('router: error page failed', err);
        return new Response('Something went wrong.', {
            status: 500, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
        });
    }
}

async function route(context, url) {
    const { request, env } = context;
    const { pathname } = url;
    const readOnly = request.method === 'GET' || request.method === 'HEAD';

    if (pathname.startsWith('/api/')) return json({ error: 'not_found' }, { status: 404 });

    if (pathname === '/robots.txt' || pathname === '/sitemap.xml') {
        if (!readOnly) return methodNotAllowed();
        const site = siteUrl(env, url);
        if (pathname === '/robots.txt') {
            return textResponse(request, robots(site), {
                contentType: 'text/plain; charset=utf-8', cacheControl: 'public, max-age=86400',
            });
        }
        const content = contentContext({ env, origin: url.origin, waitUntil: (p) => context.waitUntil(p) });
        return textResponse(request, await sitemap(site, content), {
            contentType: 'application/xml; charset=utf-8', cacheControl: 'public, max-age=3600',
        });
    }

    // /en/... pages
    const prefixed = LANG_PREFIX.exec(pathname);
    if (prefixed && isLang(prefixed[1])) {
        const lang = prefixed[1];
        const rest = prefixed[2];
        if (rest === undefined) return redirect(`/${lang}/${url.search}`, 301, PERMANENT);
        if (rest.length > 1 && rest.endsWith('/')) {
            return redirect(`/${lang}${rest.replace(/\/+$/, '')}${url.search}`, 301, PERMANENT);
        }
        if (!readOnly) return methodNotAllowed();
        return renderPage(context, url, lang, rest, matchPage(rest));
    }

    // Language-neutral page paths pick a language. "/" stays on the static
    // homepage until the switch to server rendering is complete.
    const neutral = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    if (neutral !== '/' && matchPage(neutral)) {
        return redirect(`${localizedPath(negotiate(request), neutral)}${url.search}`, 302, NEGOTIATED);
    }

    return null;
}

// Pages Functions entry. Returns context.next() for anything not handled here,
// so static assets and the old pages keep working.
export async function handle(context) {
    const url = new URL(context.request.url);
    try {
        const response = await route(context, url);
        return response ?? context.next();
    } catch (err) {
        console.error('router: unhandled error', err);
        const prefixed = LANG_PREFIX.exec(url.pathname);
        return renderError(context, url, prefixed && isLang(prefixed[1]) ? prefixed[1] : DEFAULT_LANG);
    }
}
