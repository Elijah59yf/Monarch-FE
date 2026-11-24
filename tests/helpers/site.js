import { createD1 } from './d1.js';
import { handle } from '../../src/modules/site/router.js';
import * as settings from '../../src/modules/settings/index.js';

// Calls the router as Pages would. fetch is replaced so Strapi is simulated.
export function createSite({ strapi } = {}) {
    settings.clearCache();
    const env = { DB: createD1(), SITE_URL: 'https://monarchdem.me', STRAPI_URL: 'https://api.example.test' };
    const pending = [];
    const site = {
        env,
        strapi: strapi ?? (() => new Response(JSON.stringify({ data: [] }))),
        async request(path, init = {}) {
            const realFetch = globalThis.fetch;
            globalThis.fetch = async (url, options) => site.strapi(String(url), options);
            try {
                return await handle({
                    request: new Request(`https://monarchdem.me${path}`, init),
                    env,
                    waitUntil: (p) => pending.push(p),
                    next: async () => new Response('static', { status: 200, headers: { 'x-from': 'next' } }),
                });
            } finally {
                globalThis.fetch = realFetch;
            }
        },
        settle: () => Promise.allSettled(pending.splice(0)),
    };
    return site;
}
