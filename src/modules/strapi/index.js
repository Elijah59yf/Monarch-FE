import { mediaUrl, readingTime, renderBlocks } from './blocks.js';

// Reads from Strapi go through three layers so a slow or sleeping Render
// instance never blocks a page:
//   L1 Cache API (per data centre, fast), L2 D1 content_cache (durable, global),
//   then Strapi itself. Stale copies are served at once and refreshed in the
//   background. A visitor waits on Strapi only when nothing is cached anywhere,
//   and then for at most the foreground timeout.
//
// Results: { status: 'fresh' | 'stale' | 'unavailable' | 'not_found', data }

const VERSION = 'v1';                     // bump when normalized shapes change
const L1_FRESH_MS = 60_000;
const L1_MAX_AGE_S = 86_400;
const L2_FRESH_MS = 10 * 60_000;
const NOT_FOUND_MS = 60_000;              // negative results live in L1 only
const TIMEOUTS = { foreground: 3_000, background: 25_000 };
const SLUG = /^[A-Za-z0-9._~-]{1,120}$/;
const NOT_FOUND = Symbol('not found');

// In-flight refreshes, per environment so separate bindings never share a request.
const inflightByEnv = new WeakMap();
const NO_ENV = {};

function inflightFor(env) {
    let map = inflightByEnv.get(env);
    if (!map) {
        map = new Map();
        inflightByEnv.set(env, map);
    }
    return map;
}

function entries(json) {
    if (!json || !Array.isArray(json.data)) throw new Error('Strapi response has no data array');
    return json.data.map((item) => item?.attributes ?? item);
}

function image(field, base) {
    return mediaUrl(field?.data?.attributes?.url ?? field?.url, base);
}

function normalizePost(d, base, withBody) {
    if (!d?.slug || !d.title) return null;
    const post = {
        slug: String(d.slug),
        title: String(d.title),
        excerpt: d.excerpt ? String(d.excerpt) : '',
        date: d.publishedAt || d.createdAt || null,
        image: image(d.featured_image, base),
        readingTime: readingTime(d.content),
    };
    if (withBody) post.body = renderBlocks(d.content, base);
    return post;
}

function normalizeProject(d, base) {
    if (!d?.title) return null;
    return {
        title: String(d.title),
        description: d.description ? String(d.description) : '',
        tags: typeof d.tags === 'string' ? d.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        link: typeof d.link === 'string' ? d.link.trim() : '',
        image: image(d.main_image, base),
    };
}

const RESOURCES = {
    journalList: {
        key: () => 'journal:list',
        path: () => '/api/blog-posts?populate=featured_image&sort=publishedAt:desc&pagination[pageSize]=100',
        normalize: (json, base) => entries(json).map((d) => normalizePost(d, base, false)).filter(Boolean),
    },
    journalPost: {
        key: (slug) => `journal:post:${slug}`,
        path: (slug) => `/api/blog-posts?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=featured_image`,
        normalize: (json, base) => normalizePost(entries(json)[0], base, true) ?? NOT_FOUND,
    },
    projects: {
        key: () => 'projects:list',
        path: () => '/api/projects?populate=main_image&sort=createdAt:desc&pagination[pageSize]=100',
        normalize: (json, base) => entries(json).map((d) => normalizeProject(d, base)).filter(Boolean),
    },
};

// cx carries everything that touches the outside world, so tests can replace it.
export function contentContext({ env, waitUntil, origin, fetch, cache, now, timeouts } = {}) {
    return {
        env,
        origin,
        waitUntil: waitUntil ?? (() => {}),
        fetch: fetch ?? ((...args) => globalThis.fetch(...args)),
        cache: cache === undefined ? globalThis.caches?.default ?? null : cache,
        now: now ?? Date.now,
        timeouts: { ...TIMEOUTS, ...timeouts },
    };
}

function baseUrl(cx) {
    return (cx.env?.STRAPI_URL ?? '').replace(/\/+$/, '');
}

function l1Request(cx, key) {
    return new Request(`${cx.origin}/__content-cache/${VERSION}/${encodeURIComponent(key)}`);
}

async function l1Get(cx, key) {
    if (!cx.cache || !cx.origin) return null;
    try {
        const res = await cx.cache.match(l1Request(cx, key));
        return res ? await res.json() : null;
    } catch (err) {
        console.warn('strapi: L1 read failed', err);
        return null;
    }
}

async function l1Put(cx, key, entry) {
    if (!cx.cache || !cx.origin) return;
    try {
        await cx.cache.put(l1Request(cx, key), new Response(JSON.stringify(entry), {
            headers: { 'content-type': 'application/json', 'cache-control': `max-age=${L1_MAX_AGE_S}` },
        }));
    } catch (err) {
        console.warn('strapi: L1 write failed', err);
    }
}

async function l2Get(cx, key) {
    try {
        const row = await cx.env.DB.prepare(
            'SELECT body, fetched_at, fresh_until FROM content_cache WHERE key = ?1'
        ).bind(`${VERSION}:${key}`).first();
        return row ? { data: JSON.parse(row.body), fetchedAt: row.fetched_at, freshUntil: row.fresh_until } : null;
    } catch (err) {
        console.warn('strapi: L2 read failed', err);
        return null;
    }
}

async function l2Put(cx, key, data, now) {
    try {
        await cx.env.DB.prepare(
            `INSERT INTO content_cache (key, body, fetched_at, fresh_until) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT (key) DO UPDATE SET body = excluded.body,
                 fetched_at = excluded.fetched_at, fresh_until = excluded.fresh_until`
        ).bind(`${VERSION}:${key}`, JSON.stringify(data), now, now + L2_FRESH_MS).run();
    } catch (err) {
        console.warn('strapi: L2 write failed', err);
    }
}

async function l2Delete(cx, key) {
    try {
        await cx.env.DB.prepare('DELETE FROM content_cache WHERE key = ?1').bind(`${VERSION}:${key}`).run();
    } catch (err) {
        console.warn('strapi: L2 delete failed', err);
    }
}

// One fetch per key per isolate at a time. Uses the long timeout: it either
// answers the waiting visitor or keeps running in waitUntil to wake Render.
function refresh(cx, resource, arg, key) {
    const inflight = inflightFor(cx.env ?? NO_ENV);
    if (inflight.has(key)) return inflight.get(key);
    const promise = (async () => {
        const base = baseUrl(cx);
        if (!base) throw new Error('STRAPI_URL is not configured');
        const res = await cx.fetch(base + resource.path(arg), {
            headers: { accept: 'application/json' },
            signal: AbortSignal.timeout(cx.timeouts.background),
        });
        if (!res.ok) throw new Error(`Strapi responded ${res.status}`);
        const data = resource.normalize(await res.json(), base);
        const now = cx.now();
        if (data === NOT_FOUND) {
            await Promise.all([l1Put(cx, key, { notFound: true, checkedAt: now }), l2Delete(cx, key)]);
            return { notFound: true };
        }
        await Promise.all([
            l2Put(cx, key, data, now),
            l1Put(cx, key, { data, fetchedAt: now, checkedAt: now }),
        ]);
        return { data };
    })();
    const tracked = promise
        .catch((err) => {
            console.error(`strapi: refresh of ${key} failed`, err?.message ?? err);
            throw err;
        })
        .finally(() => inflight.delete(key));
    inflight.set(key, tracked);
    return tracked;
}

function waitAtMost(promise, ms) {
    let timer;
    const timeout = new Promise((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
    });
    return Promise.race([promise.catch(() => null), timeout]).finally(() => clearTimeout(timer));
}

async function load(cx, resource, arg) {
    const key = resource.key(arg);
    const now = cx.now();

    const l1 = await l1Get(cx, key);
    if (l1?.notFound && now - l1.checkedAt < NOT_FOUND_MS) return { status: 'not_found', data: null };
    if (l1 && !l1.notFound && now - l1.checkedAt < L1_FRESH_MS) return { status: 'fresh', data: l1.data };

    const l2 = await l2Get(cx, key);
    if (l2 && now < l2.freshUntil) {
        cx.waitUntil(l1Put(cx, key, { data: l2.data, fetchedAt: l2.fetchedAt, checkedAt: now }));
        return { status: 'fresh', data: l2.data };
    }

    const candidates = [l1?.notFound ? null : l1, l2].filter(Boolean);
    const stale = candidates.sort((a, b) => b.fetchedAt - a.fetchedAt)[0];

    const refreshing = refresh(cx, resource, arg, key);
    cx.waitUntil(refreshing.catch(() => {}));

    if (stale) return { status: 'stale', data: stale.data };

    const result = await waitAtMost(refreshing, cx.timeouts.foreground);
    if (!result) return { status: 'unavailable', data: null };
    if (result.notFound) return { status: 'not_found', data: null };
    return { status: 'fresh', data: result.data };
}

export function isValidSlug(slug) {
    return typeof slug === 'string' && SLUG.test(slug);
}

export function getJournalList(cx) {
    return load(cx, RESOURCES.journalList);
}

export async function getJournalPost(cx, slug) {
    if (!isValidSlug(slug)) return { status: 'not_found', data: null };
    return load(cx, RESOURCES.journalPost, slug);
}

export function getProjects(cx) {
    return load(cx, RESOURCES.projects);
}

// For the admin to call after content changes in Strapi. Clears L1 in this
// data centre (others expire within L1_FRESH_MS) and marks L2 stale while
// keeping its body as a fallback. type is 'journal' or 'projects'.
export async function purge(cx, type, slug) {
    let keys;
    let pattern = null;
    if (type === 'journal') {
        if (slug !== undefined && !isValidSlug(slug)) throw new TypeError('Invalid slug');
        keys = ['journal:list'];
        if (slug) keys.push(`journal:post:${slug}`);
        else pattern = `${VERSION}:journal:%`;
    } else if (type === 'projects') {
        keys = ['projects:list'];
    } else {
        throw new TypeError(`Unknown content type: ${type}`);
    }

    if (cx.cache && cx.origin) {
        await Promise.all(keys.map((key) => cx.cache.delete(l1Request(cx, key)).catch(() => false)));
    }
    const db = cx.env.DB;
    if (pattern) {
        await db.prepare('UPDATE content_cache SET fresh_until = 0 WHERE key LIKE ?1').bind(pattern).run();
    } else {
        const placeholders = keys.map((_, i) => `?${i + 1}`).join(', ');
        await db.prepare(`UPDATE content_cache SET fresh_until = 0 WHERE key IN (${placeholders})`)
            .bind(...keys.map((key) => `${VERSION}:${key}`)).run();
    }
    return keys;
}
