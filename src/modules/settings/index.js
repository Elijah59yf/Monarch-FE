import { REGISTRY } from './registry.js';
import { TYPES } from './types.js';

// Values are cached per isolate. set() clears the cache in its own isolate;
// other isolates pick up the change when their copy expires.
const TTL_MS = 60_000;
const ERROR_TTL_MS = 5_000;

let cached = null;    // { values, expires }
let loading = null;   // in-flight load, shared by concurrent callers

export class SettingsError extends Error {}

function definition(key) {
    const def = REGISTRY[key];
    if (!def) throw new SettingsError(`Unknown setting: ${key}`);
    return def;
}

function parse(key, value) {
    return TYPES[definition(key).type](value);
}

function defaults() {
    const values = {};
    for (const [key, def] of Object.entries(REGISTRY)) values[key] = structuredClone(def.default);
    return values;
}

async function load(env) {
    const values = defaults();
    let ttl = TTL_MS;
    try {
        const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
        for (const row of results) {
            if (!REGISTRY[row.key]) continue;
            try {
                values[row.key] = parse(row.key, JSON.parse(row.value));
            } catch (err) {
                console.warn(`settings: stored value for ${row.key} is invalid, using default`, err.message);
            }
        }
    } catch (err) {
        console.error('settings: could not read from D1, using defaults', err);
        ttl = ERROR_TTL_MS;
    }
    return { values, expires: Date.now() + ttl };
}

async function current(env) {
    if (cached && cached.expires > Date.now()) return cached.values;
    loading ??= load(env).then((result) => {
        cached = result;
        return result.values;
    }).finally(() => {
        loading = null;
    });
    return loading;
}

export async function get(env, key) {
    definition(key);
    return structuredClone((await current(env))[key]);
}

export async function getMany(env, keys) {
    keys.forEach(definition);
    const values = await current(env);
    return Object.fromEntries(keys.map((key) => [key, structuredClone(values[key])]));
}

export async function getAll(env) {
    return structuredClone(await current(env));
}

export function describe() {
    return Object.entries(REGISTRY).map(([key, def]) => ({
        key, type: def.type, default: structuredClone(def.default), description: def.description,
    }));
}

// Validates against the registry and writes to D1. actorId is the staff user id.
export async function set(env, key, value, { actorId = null } = {}) {
    const def = definition(key);
    let parsed;
    try {
        parsed = parse(key, value);
        def.check?.(parsed, { ...(await current(env)), [key]: parsed });
    } catch (err) {
        throw new SettingsError(`${key} ${err.message}`);
    }
    await env.DB.prepare(
        `INSERT INTO settings (key, value, updated_by) VALUES (?1, ?2, ?3)
         ON CONFLICT (key) DO UPDATE SET
             value = excluded.value,
             updated_by = excluded.updated_by,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    ).bind(key, JSON.stringify(parsed), actorId).run();
    clearCache();
    return parsed;
}

export function clearCache() {
    cached = null;
}
