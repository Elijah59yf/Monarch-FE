import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyRedirect } from '../src/modules/site/legacy.js';

const cases = [
    ['/index.html', '/'],
    ['/pages/index.html', '/'],
    ['/pages/about.html', '/about'],
    ['/pages/about', '/about'],
    ['/pages/about/', '/about'],
    ['/pages/services.html', '/services'],
    ['/pages/projects.html', '/projects'],
    ['/pages/blog.html', '/journal'],
    ['/pages/blog', '/journal'],
    ['/pages/blog-post.html?slug=networking-tools', '/journal/networking-tools'],
    ['/pages/blog-post?slug=ieflj', '/journal/ieflj'],
    ['/pages/blog-post.html', '/journal'],
    ['/pages/blog-post.html?slug=', '/journal'],
    ['/pages/blog-post.html?slug=../../etc', '/journal'],
    ['/pages/blog-post.html?slug=a&utm_source=x', '/journal/a?utm_source=x'],
    ['/pages/about.html?utm_source=x', '/about?utm_source=x'],
    ['/pages/unknown.html', null],
    ['/pages/', null],
    ['/about', null],
    ['/en/about', null],
];

for (const [from, to] of cases) {
    test(`${from} -> ${to}`, () => {
        assert.equal(legacyRedirect(new URL(`https://monarchdem.me${from}`)), to);
    });
}
