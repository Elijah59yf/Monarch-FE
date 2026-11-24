import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createD1 } from './helpers/d1.js';
import * as settings from '../src/modules/settings/index.js';

let env;
beforeEach(() => {
    settings.clearCache();
    env = { DB: createD1() };
});

test('reads seeded business settings with their types', async () => {
    assert.equal(await settings.get(env, 'business.name'), 'Monarch');
    assert.equal(await settings.get(env, 'currency.default'), 'NGN');
    assert.deepEqual(await settings.get(env, 'currency.enabled'), ['NGN', 'USD']);
});

test('falls back to the registry default for unseeded keys', async () => {
    assert.equal(await settings.get(env, 'business.timezone'), 'Africa/Lagos');
});

test('falls back to defaults when D1 is down', async () => {
    env.DB.failing = true;
    assert.equal(await settings.get(env, 'business.contact_email'), 'contact@monarchdem.me');
});

test('ignores an invalid stored value', async () => {
    env.DB.sqlite.prepare("UPDATE settings SET value = '\"usd\"' WHERE key = 'currency.default'").run();
    assert.equal(await settings.get(env, 'currency.default'), 'NGN');
});

test('unknown keys are rejected', async () => {
    await assert.rejects(settings.get(env, 'nope'), settings.SettingsError);
    await assert.rejects(settings.set(env, 'nope', 1), settings.SettingsError);
});

test('set validates, stores JSON, records the actor and clears the cache', async () => {
    await settings.get(env, 'business.name');
    await settings.set(env, 'business.name', '  Monarch Ltd ', { actorId: 'staff_1' });
    assert.equal(await settings.get(env, 'business.name'), 'Monarch Ltd');
    const row = env.DB.sqlite.prepare("SELECT value, updated_by FROM settings WHERE key = 'business.name'").get();
    assert.equal(row.value, '"Monarch Ltd"');
    assert.equal(row.updated_by, 'staff_1');
});

test('set rejects values of the wrong type', async () => {
    await assert.rejects(settings.set(env, 'business.contact_email', 'not-an-email'), settings.SettingsError);
    await assert.rejects(settings.set(env, 'currency.enabled', ['NGN', 'NGN']), settings.SettingsError);
    await assert.rejects(settings.set(env, 'currency.enabled', ['ngn']), settings.SettingsError);
});

test('default currency must stay among the enabled currencies', async () => {
    await assert.rejects(settings.set(env, 'currency.default', 'EUR'), /enabled currencies/);
    await assert.rejects(settings.set(env, 'currency.enabled', ['USD']), /default currency/);
    await settings.set(env, 'currency.enabled', ['NGN', 'USD', 'EUR']);
    await settings.set(env, 'currency.default', 'EUR');
    assert.equal(await settings.get(env, 'currency.default'), 'EUR');
});

test('returned values are copies', async () => {
    const list = await settings.get(env, 'currency.enabled');
    list.push('GBP');
    assert.deepEqual(await settings.get(env, 'currency.enabled'), ['NGN', 'USD']);
});
