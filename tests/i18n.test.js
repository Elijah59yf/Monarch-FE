import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as i18n from '../src/modules/i18n/index.js';

const req = (headers) => new Request('https://monarchdem.me/', { headers });

test('every language has exactly the English keys', () => {
    const en = i18n.localeKeys('en').sort();
    for (const lang of i18n.LANGS) assert.deepEqual(i18n.localeKeys(lang).sort(), en, lang);
});

test('negotiation: saved cookie wins', () => {
    assert.equal(i18n.negotiate(req({ cookie: 'a=1; lang=de', 'accept-language': 'ja' })), 'de');
});

test('negotiation: invalid cookie falls through to Accept-Language', () => {
    assert.equal(i18n.negotiate(req({ cookie: 'lang=fr', 'accept-language': 'ja-JP,ja;q=0.9' })), 'ja');
});

test('negotiation: respects q values and region subtags', () => {
    assert.equal(i18n.negotiate(req({ 'accept-language': 'fr-FR, de;q=0.5, ja;q=0.8' })), 'ja');
    assert.equal(i18n.negotiate(req({ 'accept-language': 'en-GB;q=0.2, de-AT' })), 'de');
    assert.equal(i18n.negotiate(req({ 'accept-language': 'ja;q=0, de;q=0.1' })), 'de');
});

test('negotiation: defaults to English', () => {
    assert.equal(i18n.negotiate(req({})), 'en');
    assert.equal(i18n.negotiate(req({ 'accept-language': 'fr, *;q=0.5' })), 'en');
    assert.equal(i18n.negotiate(req({ 'accept-language': ';;,garbage;q=x' })), 'en');
});

test('t interpolates; tHtml escapes variables but keeps locale markup', () => {
    assert.equal(i18n.t('en', 'meta.home.title', { business: 'Monarch' }), 'Monarch | Digital Craftsman');
    assert.ok(String(i18n.tHtml('en', 'about.intro')).includes('<strong>Monarch</strong>'));
    assert.equal(String(i18n.tHtml('en', 'meta.home.title', { business: '<b>' })), '&lt;b&gt; | Digital Craftsman');
});

test('plural forms follow each language', () => {
    assert.equal(i18n.plural('en', 'blog.viewCount', 1), '1 view');
    assert.equal(i18n.plural('en', 'blog.viewCount', 2), '2 views');
    assert.equal(i18n.plural('de', 'blog.viewCount', 1), '1 Aufruf');
    assert.equal(i18n.plural('ja', 'blog.viewCount', 1), '1回閲覧');
});

test('dates use the language and time zone', () => {
    const late = '2025-11-18T23:30:00Z';
    assert.equal(i18n.formatDate('en', late, 'Africa/Lagos'), 'November 19, 2025');
    assert.equal(i18n.formatDate('de', late, 'Africa/Lagos'), '19. November 2025');
    assert.equal(i18n.formatDate('ja', late, 'Africa/Lagos'), '2025年11月19日');
    assert.equal(i18n.formatDate('en', 'nope', 'UTC'), '');
});
