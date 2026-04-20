/**
 * SQLite persistence for per-user daily usage by hostname and category.
 * Uses better-sqlite3 for synchronous, parameterized queries.
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'focustrack.db');
const db = new Database(dbPath);

/** @param {Date} d */
function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Start date key (local) for rolling `days` calendar days including today. */
function windowStartKey(days) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return toYMD(start);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS usage (
    user_id TEXT NOT NULL,
    hostname TEXT NOT NULL,
    day TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('productive','unproductive','neutral')),
    seconds INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, hostname, day, category)
  );
  CREATE INDEX IF NOT EXISTS idx_usage_user_day ON usage(user_id, day);
`);

/** @param {string} userId */
/** @param {Array<{ hostname: string, day: string, category: string, seconds: number }>} rows */
/**
 * Upserts rows as absolute totals for each key (matches the extension’s local daily map).
 * Repeated syncs with the same totals are idempotent — we replace, not add.
 */
export function mergeUsageRows(userId, rows) {
  const stmt = db.prepare(`
    INSERT INTO usage (user_id, hostname, day, category, seconds)
    VALUES (@user_id, @hostname, @day, @category, @seconds)
    ON CONFLICT(user_id, hostname, day, category) DO UPDATE SET
      seconds = excluded.seconds
  `);

  const insertMany = db.transaction((/** @type {typeof rows} */ list) => {
    for (const r of list) {
      stmt.run({
        user_id: userId,
        hostname: r.hostname,
        day: r.day,
        category: r.category,
        seconds: r.seconds,
      });
    }
  });

  insertMany(rows);
}

/**
 * Aggregates seconds by category for the last N calendar days (local server timezone).
 * @param {string} userId
 * @param {number} days
 */
export function summaryByCategory(userId, days) {
  const startKey = windowStartKey(days);

  const rows = db
    .prepare(
      `
    SELECT category, SUM(seconds) AS seconds
    FROM usage
    WHERE user_id = ? AND day >= ?
    GROUP BY category
  `,
    )
    .all(userId, startKey);

  /** @type {Record<string, number>} */
  const out = { productive: 0, unproductive: 0, neutral: 0 };
  for (const r of rows) {
    out[r.category] = r.seconds;
  }
  return out;
}

/**
 * Per-day totals for stacked chart (last `days` days).
 * @param {string} userId
 * @param {number} days
 */
export function dailyBreakdown(userId, days) {
  const startKey = windowStartKey(days);

  const rows = db
    .prepare(
      `
    SELECT day, category, SUM(seconds) AS seconds
    FROM usage
    WHERE user_id = ? AND day >= ?
    GROUP BY day, category
    ORDER BY day ASC
  `,
    )
    .all(userId, startKey);

  /** @type {Record<string, { productive: number, unproductive: number, neutral: number }>} */
  const byDay = {};
  for (const r of rows) {
    if (!byDay[r.day]) {
      byDay[r.day] = { productive: 0, unproductive: 0, neutral: 0 };
    }
    byDay[r.day][r.category] = r.seconds;
  }
  return byDay;
}

/**
 * Top hostnames by total seconds in the window.
 * @param {string} userId
 * @param {number} days
 * @param {number} limit
 */
export function topHosts(userId, days, limit = 10) {
  const startKey = windowStartKey(days);

  return db
    .prepare(
      `
    SELECT hostname, SUM(seconds) AS seconds
    FROM usage
    WHERE user_id = ? AND day >= ?
    GROUP BY hostname
    ORDER BY seconds DESC
    LIMIT ?
  `,
    )
    .all(userId, startKey, limit);
}
