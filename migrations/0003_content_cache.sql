-- Durable last-known-good copy of Strapi content, used when Render is slow or down.
-- body holds normalized JSON, not raw Strapi responses.
-- fetched_at and fresh_until are Unix epoch milliseconds.
-- A purge sets fresh_until to 0 and keeps body so it can still serve as a fallback.
CREATE TABLE content_cache (
    key         TEXT PRIMARY KEY NOT NULL,
    body        TEXT NOT NULL CHECK (json_valid(body)),
    fetched_at  INTEGER NOT NULL,
    fresh_until INTEGER NOT NULL
);
