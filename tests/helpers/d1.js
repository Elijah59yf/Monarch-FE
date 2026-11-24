// A small D1 stand-in backed by node:sqlite with the real migrations applied.
import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS = new URL('../../migrations/', import.meta.url).pathname;

class Statement {
    constructor(db, sql, params = []) {
        this.db = db;
        this.sql = sql;
        this.params = params;
    }
    bind(...params) {
        return new Statement(this.db, this.sql, params);
    }
    async first(column) {
        this.db.check();
        const row = this.db.sqlite.prepare(this.sql).get(...this.params) ?? null;
        return column && row ? row[column] : row;
    }
    async all() {
        this.db.check();
        return { results: this.db.sqlite.prepare(this.sql).all(...this.params), success: true };
    }
    async run() {
        this.db.check();
        const info = this.db.sqlite.prepare(this.sql).run(...this.params);
        return { success: true, meta: { changes: info.changes } };
    }
}

export function createD1({ migrations = true } = {}) {
    const sqlite = new DatabaseSync(':memory:');
    if (migrations) {
        for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
            sqlite.exec(readFileSync(join(MIGRATIONS, file), 'utf8'));
        }
    }
    const db = {
        sqlite,
        failing: false,
        check() {
            if (db.failing) throw new Error('D1 unavailable');
        },
        prepare: (sql) => new Statement(db, sql),
    };
    return db;
}
