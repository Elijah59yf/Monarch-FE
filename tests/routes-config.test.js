import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../public/_routes.json', import.meta.url)));

// Pages rule semantics: "*" matches any characters, including "/".
const matches = (rule, path) => new RegExp(`^${rule.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`).test(path);
const invokesFunctions = (path) => config.include.some((r) => matches(r, path)) && !config.exclude.some((r) => matches(r, path));

test('API, pages, sitemap and robots reach Functions', () => {
    for (const path of ['/api/health', '/api/anything/nested', '/en/', '/ja/journal/a', '/about', '/sitemap.xml', '/robots.txt']) {
        assert.ok(invokesFunctions(path), path);
    }
});

test('static assets never invoke a Worker', () => {
    for (const path of ['/style.css', '/site.js', '/assets/fonts/dm-sans-400.woff2', '/assets/icons/monarch-icons.svg', '/img/profile.jpg', '/manifest.json', '/Elijah-Akinseloyin-CV.pdf']) {
        assert.ok(!invokesFunctions(path), path);
    }
});

test('Pages limits: at most 100 rules', () => {
    assert.ok(config.include.length + config.exclude.length <= 100);
});
