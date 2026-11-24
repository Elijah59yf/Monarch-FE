import en from './locales/en.json' with { type: 'json' };
import ja from './locales/ja.json' with { type: 'json' };
import de from './locales/de.json' with { type: 'json' };
import { escape, raw } from '../../lib/html.js';
import { parseCookies } from '../../lib/cookies.js';

const LOCALES = { en, ja, de };

export const LANGS = Object.keys(LOCALES);
export const DEFAULT_LANG = 'en';
export const LANG_COOKIE = 'lang';

export function isLang(value) {
    return typeof value === 'string' && Object.hasOwn(LOCALES, value);
}

const warned = new Set();

function lookup(lang, key) {
    const value = LOCALES[lang]?.[key] ?? LOCALES[DEFAULT_LANG][key];
    if (value !== undefined) return value;
    if (!warned.has(key)) {
        warned.add(key);
        console.warn(`i18n: missing key ${key}`);
    }
    return key;
}

function interpolate(template, vars, encode) {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) =>
        Object.hasOwn(vars, name) ? encode(String(vars[name])) : match);
}

// Plain text. Escaping happens when it is placed into html``.
export function t(lang, key, vars) {
    return interpolate(lookup(lang, key), vars, (v) => v);
}

// Locale strings are trusted markup (for example <strong>); variables are escaped.
export function tHtml(lang, key, vars) {
    return raw(interpolate(lookup(lang, key), vars, escape));
}

export function intlLocale(lang) {
    return lookup(lang, '_meta.intl');
}

export function langName(lang) {
    return lookup(lang, '_meta.name');
}

export function pluralKey(lang, key, n) {
    const rule = new Intl.PluralRules(intlLocale(lang)).select(n);
    const candidate = `${key}.${rule}`;
    return LOCALES[lang]?.[candidate] !== undefined || LOCALES[DEFAULT_LANG][candidate] !== undefined
        ? candidate
        : `${key}.other`;
}

export function plural(lang, key, n, vars = {}) {
    return t(lang, pluralKey(lang, key, n), { n, ...vars });
}

export function formatDate(lang, value, timeZone) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(intlLocale(lang), {
        year: 'numeric', month: 'long', day: 'numeric', timeZone,
    }).format(date);
}

// Plural keys are expanded to their .one and .other forms.
export function clientStrings(lang, keys) {
    const out = {};
    for (const key of keys) {
        const variants = Object.keys(LOCALES[DEFAULT_LANG]).filter((k) => k.startsWith(`${key}.`));
        for (const k of variants.length ? variants : [key]) out[k] = t(lang, k);
    }
    return out;
}

export function parseAcceptLanguage(header) {
    if (!header) return [];
    return header.split(',')
        .map((part, index) => {
            const [tag, ...params] = part.trim().split(';');
            const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
            const quality = q ? Number.parseFloat(q.slice(2)) : 1;
            return { tag: tag.trim().toLowerCase(), quality: Number.isFinite(quality) ? quality : 0, index };
        })
        .filter((entry) => entry.tag && entry.quality > 0)
        .sort((a, b) => b.quality - a.quality || a.index - b.index)
        .map((entry) => entry.tag);
}

// Saved cookie, then Accept-Language, then English.
export function negotiate(request) {
    const saved = parseCookies(request.headers.get('cookie')).get(LANG_COOKIE);
    if (isLang(saved)) return saved;
    for (const tag of parseAcceptLanguage(request.headers.get('accept-language'))) {
        const primary = tag.split('-')[0];
        if (isLang(primary)) return primary;
    }
    return DEFAULT_LANG;
}

export function localeKeys(lang) {
    return Object.keys(LOCALES[lang] ?? {});
}
