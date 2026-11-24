// Each type parses a stored or submitted value and returns it, or throws a TypeError.

const CURRENCY = /^[A-Z]{3}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(message) {
    throw new TypeError(message);
}

export const TYPES = {
    string(value) {
        if (typeof value !== 'string') fail('must be a string');
        const trimmed = value.trim();
        if (trimmed.length === 0) fail('must not be empty');
        if (trimmed.length > 500) fail('must be at most 500 characters');
        return trimmed;
    },
    email(value) {
        const v = TYPES.string(value).toLowerCase();
        if (!EMAIL.test(v)) fail('must be an email address');
        return v;
    },
    int(value) {
        if (!Number.isSafeInteger(value)) fail('must be an integer');
        return value;
    },
    bool(value) {
        if (typeof value !== 'boolean') fail('must be true or false');
        return value;
    },
    currency(value) {
        if (typeof value !== 'string' || !CURRENCY.test(value)) fail('must be an ISO 4217 code such as NGN');
        return value;
    },
    currency_list(value) {
        if (!Array.isArray(value) || value.length === 0) fail('must be a non-empty list of currency codes');
        const list = value.map(TYPES.currency);
        if (new Set(list).size !== list.length) fail('must not repeat a currency');
        return list;
    },
    timezone(value) {
        const v = TYPES.string(value);
        try {
            new Intl.DateTimeFormat('en', { timeZone: v });
        } catch {
            fail('must be an IANA time zone such as Africa/Lagos');
        }
        return v;
    },
    json(value) {
        if (value === undefined) fail('must be set');
        return JSON.parse(JSON.stringify(value));
    },
};
