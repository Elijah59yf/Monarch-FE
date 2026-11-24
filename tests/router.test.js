import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSite } from './helpers/site.js';

const strapiWith = (posts, projects = []) => (url) => {
    if (url.includes('/api/projects')) return new Response(JSON.stringify({ data: projects }));
    const slug = /\$eq\]=([^&]+)/.exec(decodeURIComponent(url))?.[1];
    const data = slug ? posts.filter((p) => p.slug === slug) : posts;
    return new Response(JSON.stringify({ data }));
};
const post = (slug, title = `Post ${slug}`) => ({
    slug, title, publishedAt: '2025-11-18T15:26:03.315Z',
    content: [{ type: 'paragraph', children: [{ type: 'text', text: 'Body text' }] }],
});

test('every page renders in every language with lang, canonical and hreflang', async () => {
    const site = createSite({ strapi: strapiWith([post('a')]) });
    for (const lang of ['en', 'ja', 'de']) {
        for (const path of ['/', '/about', '/services', '/projects', '/journal', '/journal/a']) {
            const localized = path === '/' ? `/${lang}/` : `/${lang}${path}`;
            const res = await site.request(localized);
            assert.equal(res.status, 200, localized);
            assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
            assert.equal(res.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
            const body = await res.text();
            assert.match(body, new RegExp(`<html lang="${lang}">`));
            assert.ok(body.includes(`<link rel="canonical" href="https://monarchdem.me${localized}">`), localized);
            for (const l of ['en', 'ja', 'de']) assert.ok(body.includes(`hreflang="${l}"`));
            assert.ok(body.includes(`hreflang="x-default" href="https://monarchdem.me${path}"`), localized);
            assert.ok(!body.includes('translations.js'));
        }
    }
});

test('language switcher keeps the current page', async () => {
    const site = createSite({ strapi: strapiWith([post('a')]) });
    const body = await (await site.request('/de/journal/a')).text();
    assert.ok(body.includes('href="/en/journal/a" hreflang="en"'));
    assert.ok(body.includes('href="/ja/journal/a" hreflang="ja"'));
    assert.match(body, /class="lang-option active" href="\/de\/journal\/a"/);
});

test('text comes from the locale and business settings', async () => {
    const site = createSite();
    const ja = await (await site.request('/ja/about')).text();
    assert.ok(ja.includes('<title>紹介 | Monarch</title>'));
    assert.ok(ja.includes('<strong>Monarch</strong>として知られています'));
    assert.ok(ja.includes('href="mailto:contact@monarchdem.me"'));
    const home = await (await site.request('/en/')).text();
    assert.ok(home.includes('<title>Monarch | Digital Craftsman</title>'));
    assert.ok(!home.includes('testimonial'));
});

test('canonical forms: /en and trailing slashes redirect permanently', async () => {
    const site = createSite();
    let res = await site.request('/en');
    assert.equal(res.status, 301);
    assert.equal(res.headers.get('location'), '/en/');
    res = await site.request('/ja/about/?x=1');
    assert.equal(res.status, 301);
    assert.equal(res.headers.get('location'), '/ja/about?x=1');
});

test('language-neutral paths negotiate with a private 302', async () => {
    const site = createSite();
    let res = await site.request('/about', { headers: { cookie: 'lang=de', 'accept-language': 'ja' } });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), '/de/about');
    assert.equal(res.headers.get('cache-control'), 'private, no-store');
    assert.equal(res.headers.get('vary'), 'Cookie, Accept-Language');
    res = await site.request('/journal/some-post/', { headers: { 'accept-language': 'ja-JP' } });
    assert.equal(res.headers.get('location'), '/ja/journal/some-post');
    res = await site.request('/projects');
    assert.equal(res.headers.get('location'), '/en/projects');
});

test('until the switch, "/" and old pages are left to static files', async () => {
    const site = createSite();
    for (const path of ['/', '/index.html', '/pages/about.html', '/style.css', '/fr/about']) {
        const res = await site.request(path);
        assert.equal(res.headers.get('x-from'), 'next', path);
    }
});

test('unknown pages and posts get a localized 404', async () => {
    const site = createSite({ strapi: strapiWith([post('a')]) });
    for (const path of ['/de/nope', '/de/journal/missing', '/de/journal/bad%20slug', '/de/about/extra']) {
        const res = await site.request(path);
        assert.equal(res.status, 404, path);
        assert.equal(res.headers.get('cache-control'), 'no-store');
        const body = await res.text();
        assert.ok(body.includes('Seite nicht gefunden'), path);
        assert.ok(body.includes('<meta name="robots" content="noindex">'));
    }
});

test('Strapi down with nothing cached: calm 503 page, not an error', async () => {
    const site = createSite();
    site.strapi = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('timeout'))));
    const started = Date.now();
    for (const path of ['/en/journal', '/en/projects', '/en/journal/a']) {
        const res = await site.request(path);
        assert.equal(res.status, 503, path);
        assert.equal(res.headers.get('retry-after'), '120');
        assert.equal(res.headers.get('cache-control'), 'no-store');
        assert.ok((await res.text()).includes('taking a short rest'), path);
    }
    assert.ok(Date.now() - started < 15_000);
}, { timeout: 20_000 });

test('Strapi content is escaped in pages', async () => {
    const site = createSite({ strapi: strapiWith([post('x', '<script>alert(1)</script>')], [
        { title: '<img src=x onerror=alert(1)>', link: 'javascript:alert(1)', tags: '"><b>' },
    ]) });
    const journal = await (await site.request('/en/journal')).text();
    assert.ok(!journal.includes('<script>alert(1)</script>'));
    assert.ok(journal.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    const projects = await (await site.request('/en/projects')).text();
    assert.ok(!projects.includes('<img src=x'));
    assert.ok(!projects.includes('javascript:'));
    assert.ok(!projects.includes('"><b>'));
});

test('ETag revalidation and HEAD', async () => {
    const site = createSite();
    const first = await site.request('/en/services');
    const etag = first.headers.get('etag');
    assert.match(etag, /^"[0-9a-f]{40}"$/);
    const again = await site.request('/en/services', { headers: { 'if-none-match': `W/${etag}` } });
    assert.equal(again.status, 304);
    const head = await site.request('/en/services', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
});

test('state-changing methods are refused on pages', async () => {
    const site = createSite();
    const res = await site.request('/en/about', { method: 'POST' });
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'GET, HEAD');
});

test('unknown /api/ paths answer JSON 404', async () => {
    const site = createSite();
    const res = await site.request('/api/nope');
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: 'not_found' });
});

test('a crash renders the localized 500 page', async () => {
    const site = createSite({ strapi: strapiWith([post('a')]) });
    const original = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function () { throw new Error('boom'); };
    try {
        const res = await site.request('/ja/journal');
        assert.equal(res.status, 500);
        assert.equal(res.headers.get('cache-control'), 'no-store');
        assert.ok((await res.text()).includes('エラーが発生しました。'));
    } finally {
        Intl.DateTimeFormat = original;
    }
});

test('sitemap lists every page in every language with alternates, plus posts', async () => {
    const site = createSite({ strapi: strapiWith([post('a'), post('b')]) });
    const res = await site.request('/sitemap.xml');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/xml; charset=utf-8');
    const xml = await res.text();
    assert.equal((xml.match(/<url>/g) || []).length, 7 * 3);
    assert.ok(xml.includes('<loc>https://monarchdem.me/ja/about</loc>'));
    assert.ok(xml.includes('<loc>https://monarchdem.me/de/journal/b</loc>'));
    assert.ok(xml.includes('<lastmod>2025-11-18</lastmod>'));
    assert.ok(xml.includes('<xhtml:link rel="alternate" hreflang="x-default" href="https://monarchdem.me/journal/a"/>'));
});

test('robots.txt points to the sitemap', async () => {
    const site = createSite();
    const body = await (await site.request('/robots.txt')).text();
    assert.ok(body.includes('Sitemap: https://monarchdem.me/sitemap.xml'));
    assert.ok(body.includes('Disallow: /api/'));
});
