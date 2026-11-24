import { json } from '../../src/lib/http.js';

async function probe(name, check) {
    const start = Date.now();
    try {
        await check();
        return { ok: true, ms: Date.now() - start };
    } catch (err) {
        console.error(`health: ${name} failed`, err);
        return { ok: false, ms: Date.now() - start };
    }
}

export async function onRequestGet({ env }) {
    const [d1, r2] = await Promise.all([
        probe('d1', async () => {
            const row = await env.DB.prepare('SELECT 1 AS ok').first();
            if (row?.ok !== 1) throw new Error('unexpected result');
        }),
        // head() resolves to null for a missing key, which still proves the binding works
        probe('r2', () => env.FILES.head('health-probe')),
    ]);

    const ok = d1.ok && r2.ok;
    return json({ ok, d1, r2 }, { status: ok ? 200 : 503 });
}
