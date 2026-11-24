import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, raw, safeUrl } from '../src/lib/html.js';

test('interpolated values are escaped', () => {
    const value = `<script>alert("x")</script>&'`;
    assert.equal(String(html`<p title="${value}">${value}</p>`),
        '<p title="&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;">&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;</p>');
});

test('nested templates, arrays and raw are not escaped twice', () => {
    const items = ['a<b', 'c'].map((x) => html`<li>${x}</li>`);
    assert.equal(String(html`<ul>${items}</ul>${raw('<hr>')}`), '<ul><li>a&lt;b</li><li>c</li></ul><hr>');
});

test('null, undefined and booleans render nothing; numbers render', () => {
    assert.equal(String(html`${null}${undefined}${false}${true}${0}`), '0');
});

test('safeUrl allows http, https, mailto and relative URLs only', () => {
    assert.equal(safeUrl('https://example.com/a'), 'https://example.com/a');
    assert.equal(safeUrl(' Https://kidoclassicmall.com '), 'https://kidoclassicmall.com/');
    assert.equal(safeUrl('mailto:a@b.co'), 'mailto:a@b.co');
    assert.equal(safeUrl('/en/journal'), '/en/journal');
    assert.equal(safeUrl('#top'), '#top');
    assert.equal(safeUrl('javascript:alert(1)'), '#');
    assert.equal(safeUrl(' JavaScript:alert(1)'), '#');
    assert.equal(safeUrl('data:text/html,x'), '#');
    assert.equal(safeUrl('//evil.example'), '#');
    assert.equal(safeUrl(undefined), '#');
});
