// Tagged template for HTML. Every interpolated value is escaped unless it is
// SafeHtml (from html`` itself or raw()). Arrays are joined; null, undefined,
// true and false render nothing, so `${cond && html`...`}` works.

class SafeHtml {
    constructor(value) {
        this.value = value;
    }
    toString() {
        return this.value;
    }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escape(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

function render(value) {
    if (value === null || value === undefined || value === false || value === true) return '';
    if (value instanceof SafeHtml) return value.value;
    if (Array.isArray(value)) return value.map(render).join('');
    return escape(value);
}

export function html(strings, ...values) {
    let out = strings[0];
    for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
    return new SafeHtml(out);
}

// Marks trusted markup. Only for locale strings and output of our own renderers.
export function raw(value) {
    return new SafeHtml(value === null || value === undefined ? '' : String(value));
}

export function isSafeHtml(value) {
    return value instanceof SafeHtml;
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

// Returns the URL if it is relative or uses an allowed protocol, else fallback.
export function safeUrl(value, fallback = '#') {
    if (typeof value !== 'string') return fallback;
    const url = value.trim();
    if (url === '') return fallback;
    if (url.startsWith('#') || (url.startsWith('/') && !url.startsWith('//'))) return url;
    try {
        const parsed = new URL(url);
        return SAFE_PROTOCOLS.has(parsed.protocol) ? parsed.href : fallback;
    } catch {
        return fallback;
    }
}
