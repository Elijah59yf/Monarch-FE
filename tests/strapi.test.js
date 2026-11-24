import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createD1 } from './helpers/d1.js';
import { createCache } from './helpers/cache.js';
import * as strapi from '../src/modules/strapi/index.js';
import { renderBlocks } from '../src/modules/strapi/blocks.js';

const BASE = 'https://api.example.test';
const posts = (...items) => ({ data: items });
const post = (slug, extra = {}) => ({
    slug, title: `Title ${slug}`, publishedAt: '2025-11-18T15:26:03.315Z',
    content: [{ type: 'paragraph', children: [{ type: 'text', text: 'Hello' }] }],
    featured_image: { url: '/uploads/a.png' }, ...extra,
});

let clock, calls, responder, pending, env, cache;

function cx(timeouts = { foreground: 30, background: 200 }) {
    return strapi.contentContext({
        env, cache, origin: 'https://monarchdem.me',
        now: () => clock,
        waitUntil: (p) => pending.push(p),
        timeouts,
        fetch: async (url, init) => {
            calls.push(url);
            return responder(url, init);
        },
    });
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
const never = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
const settle = () => Promise.allSettled(pending.splice(0));

beforeEach(() => {
    clock = 1_000_000;
    calls = [];
    pending = [];
    env = { DB: createD1(), STRAPI_URL: BASE + '/' };
    cache = createCache();
    responder = () => json(posts(post('a')));
});

test('cold cache: fetches, normalizes and stores in both layers', async () => {
    const res = await strapi.getJournalList(cx());
    assert.equal(res.status, 'fresh');
    assert.deepEqual(res.data[0], {
        slug: 'a', title: 'Title a', excerpt: '', date: '2025-11-18T15:26:03.315Z',
        image: BASE + '/uploads/a.png', readingTime: 1,
    });
    assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM content_cache').get().n, 1);
    assert.equal(cache.store.size, 1);
});

test('fresh L1 answers without touching D1 or Strapi', async () => {
    await strapi.getJournalList(cx());
    env.DB.failing = true;
    clock += 30_000;
    const res = await strapi.getJournalList(cx());
    assert.equal(res.status, 'fresh');
    assert.equal(calls.length, 1);
});

test('fresh L2 answers when L1 is empty (other data centre)', async () => {
    await strapi.getJournalList(cx());
    cache = createCache();
    clock += 5 * 60_000;
    const res = await strapi.getJournalList(cx());
    assert.equal(res.status, 'fresh');
    assert.equal(calls.length, 1);
});

test('Strapi hanging with nothing cached: calm unavailable within the foreground timeout', async () => {
    let aborted = false;
    responder = (url, init) => {
        init.signal.addEventListener('abort', () => { aborted = true; });
        return never(url, init);
    };
    // Wide gap between the two timeouts so a slow machine cannot blur them.
    const res = await strapi.getJournalList(cx({ foreground: 30, background: 2000 }));
    assert.equal(res.status, 'unavailable');
    assert.equal(aborted, false, 'page answered while Strapi was still hanging');
    await settle();
    assert.equal(aborted, true, 'background request gives up at its own timeout');
});

test('Strapi down with a stale D1 copy: stale served immediately, nothing overwritten', async () => {
    await strapi.getJournalList(cx());
    cache = createCache();
    clock += 60 * 60_000;
    responder = () => json({ error: 'restarting' }, 503);
    const res = await strapi.getJournalList(cx());
    assert.equal(res.status, 'stale');
    assert.equal(res.data[0].slug, 'a');
    await settle();
    const row = env.DB.sqlite.prepare('SELECT fetched_at FROM content_cache').get();
    assert.equal(row.fetched_at, 1_000_000);
});

test('stale copy is refreshed in the background', async () => {
    await strapi.getJournalList(cx());
    clock += 60 * 60_000;
    responder = () => json(posts(post('b'), post('a')));
    const res = await strapi.getJournalList(cx());
    assert.equal(res.status, 'stale');
    await settle();
    const next = await strapi.getJournalList(cx());
    assert.equal(next.status, 'fresh');
    assert.deepEqual(next.data.map((p) => p.slug), ['b', 'a']);
});

test('D1 down and L1 stale: L1 copy is still served', async () => {
    await strapi.getJournalList(cx());
    env.DB.failing = true;
    clock += 2 * 60_000;
    responder = never;
    const res = await strapi.getJournalList(cx());
    assert.equal(res.status, 'stale');
    await settle();
});

test('malformed Strapi response never replaces good content', async () => {
    await strapi.getJournalList(cx());
    clock += 60 * 60_000;
    cache = createCache();
    responder = () => json({ unexpected: true });
    await strapi.getJournalList(cx());
    await settle();
    const res = await strapi.getJournalList(cx());
    assert.equal(res.status, 'stale');
    assert.equal(res.data[0].slug, 'a');
});

test('concurrent misses share one Strapi request', async () => {
    await Promise.all([strapi.getJournalList(cx()), strapi.getJournalList(cx()), strapi.getJournalList(cx())]);
    assert.equal(calls.length, 1);
});

test('single post: found, not found, and removed when deleted in Strapi', async () => {
    responder = (url) => json(url.includes('%24eq%5D=a') || url.includes('$eq]=a') ? posts(post('a')) : posts());
    const found = await strapi.getJournalPost(cx(), 'a');
    assert.equal(found.status, 'fresh');
    assert.equal(found.data.body, '<p>Hello</p>');
    assert.equal((await strapi.getJournalPost(cx(), 'missing')).status, 'not_found');

    clock += 60 * 60_000;
    cache = createCache();
    responder = () => json(posts());
    await strapi.getJournalPost(cx(), 'a');
    await settle();
    assert.equal(env.DB.sqlite.prepare("SELECT count(*) n FROM content_cache WHERE key LIKE '%post:a'").get().n, 0);
    assert.equal((await strapi.getJournalPost(cx(), 'a')).status, 'not_found');
});

test('invalid slugs never reach Strapi', async () => {
    for (const slug of ['../x', 'a b', '', 'x'.repeat(121), 'a?b']) {
        assert.equal((await strapi.getJournalPost(cx(), slug)).status, 'not_found');
    }
    assert.equal(calls.length, 0);
});

test('no STRAPI_URL configured: unavailable, not a crash', async () => {
    delete env.STRAPI_URL;
    assert.equal((await strapi.getProjects(cx())).status, 'unavailable');
    await settle();
});

test('purge clears L1, marks L2 stale and keeps the body for fallback', async () => {
    await strapi.getJournalList(cx());
    responder = () => json(posts(post('a')));
    await strapi.getJournalPost(cx(), 'a');
    await strapi.purge(cx(), 'journal', 'a');
    assert.equal(cache.store.size, 0);
    const rows = env.DB.sqlite.prepare('SELECT fresh_until, body FROM content_cache').all();
    assert.equal(rows.length, 2);
    assert.ok(rows.every((r) => r.fresh_until === 0 && r.body.length > 2));

    responder = never;
    assert.equal((await strapi.getJournalList(cx())).status, 'stale');
    await settle();
    await assert.rejects(strapi.purge(cx(), 'nope'), TypeError);
});

test('projects normalize tags, trim links and resolve images', async () => {
    responder = () => json({ data: [
        { title: 'P', description: 'D', link: 'Https://x.example ', tags: 'web, infra,', main_image: { url: '/uploads/p.png' } },
        { title: null },
    ] });
    const res = await strapi.getProjects(cx());
    assert.deepEqual(res.data, [{ title: 'P', description: 'D', link: 'Https://x.example', tags: ['web', 'infra'], image: BASE + '/uploads/p.png' }]);
});

test('block renderer escapes CMS text and neutralizes unsafe links', () => {
    const out = renderBlocks([
        { type: 'paragraph', children: [
            { type: 'text', text: '<img src=x onerror=alert(1)>', bold: true },
            { type: 'link', url: 'javascript:alert(1)', children: [{ type: 'text', text: 'x' }] },
        ] },
        { type: 'heading', level: 9, children: [{ type: 'text', text: 'H' }] },
        { type: 'code', children: [{ text: '</code><script>' }] },
        { type: 'image', image: { url: 'javascript:x' } },
    ], BASE);
    assert.equal(out,
        '<p><strong>&lt;img src=x onerror=alert(1)&gt;</strong><a href="#" target="_blank" rel="noopener noreferrer">x</a></p>'
        + '<h6>H</h6><pre><code>&lt;/code&gt;&lt;script&gt;</code></pre>');
});
