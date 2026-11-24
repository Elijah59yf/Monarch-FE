import { escape } from '../../lib/html.js';
import { LANGS } from '../i18n/index.js';
import { getJournalList } from '../strapi/index.js';
import { journalPostPath, localizedPath } from './paths.js';
import { SITEMAP_PATHS } from './routes.js';

function urlEntry(site, path, lastmod) {
    const alternates = [
        ...LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${escape(site + localizedPath(l, path))}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escape(site + path)}"/>`,
    ].join('\n');
    return LANGS.map((lang) => [
        '  <url>',
        `    <loc>${escape(site + localizedPath(lang, path))}</loc>`,
        lastmod ? `    <lastmod>${escape(lastmod)}</lastmod>` : null,
        alternates,
        '  </url>',
    ].filter(Boolean).join('\n')).join('\n');
}

// Journal posts are included whenever a fresh or stale list is available.
export async function sitemap(site, content) {
    const entries = SITEMAP_PATHS.map((path) => urlEntry(site, path));
    const journal = await getJournalList(content);
    for (const post of journal.data ?? []) {
        const date = post.date ? new Date(post.date) : null;
        const lastmod = date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
        entries.push(urlEntry(site, journalPostPath(post.slug), lastmod));
    }
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        ...entries,
        '</urlset>',
        '',
    ].join('\n');
}

export function robots(site) {
    return [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        '',
        `Sitemap: ${site}/sitemap.xml`,
        '',
    ].join('\n');
}
