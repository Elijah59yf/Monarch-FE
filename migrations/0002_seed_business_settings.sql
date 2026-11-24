-- Seed business settings. Values are JSON text, matching the settings table in 0001.
-- INSERT OR IGNORE keeps any value already edited in D1.
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('business.name',          '"Monarch"'),
    ('business.address',       '"Lagos, Nigeria"'),
    ('business.contact_email', '"contact@monarchdem.me"'),
    ('currency.default',       '"NGN"'),
    ('currency.enabled',       '["NGN","USD"]');
