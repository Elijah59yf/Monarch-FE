// In-memory stand-in for caches.default.
export function createCache() {
    const store = new Map();
    return {
        store,
        async match(request) {
            const hit = store.get(request.url);
            return hit ? new Response(hit) : undefined;
        },
        async put(request, response) {
            store.set(request.url, await response.text());
        },
        async delete(request) {
            return store.delete(request.url);
        },
    };
}
