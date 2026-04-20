/**
 * HTTP API + static dashboard for FocusTrack.
 * Default port 3847 — must match the extension default in background.js / options.
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { mergeUsageRows, summaryByCategory, dailyBreakdown, topHosts } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3847;

const app = express();
app.use(express.json({ limit: '2mb' }));

// Browser extension pages use chrome-extension:// origins; allow all for local dev API.
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
);

const publicDir = path.join(__dirname, '..', 'public');
app.use('/dashboard', express.static(path.join(publicDir, 'dashboard')));

/**
 * Health check for deployment / sanity.
 */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'focustrack-server' });
});

/**
 * Accepts batched rows from the extension and merges into SQLite.
 * Body: { userId: string, rows: [{ hostname, day, category, seconds }] }
 */
app.post('/api/sync', (req, res) => {
  const userId = req.body?.userId;
  const rows = req.body?.rows;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId required' });
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'rows must be a non-empty array' });
  }

  const cleaned = [];
  for (const r of rows) {
    if (!r.hostname || !r.day || !r.category || typeof r.seconds !== 'number') continue;
    if (!['productive', 'unproductive', 'neutral'].includes(r.category)) continue;
    cleaned.push({
      hostname: String(r.hostname).slice(0, 255),
      day: String(r.day).slice(0, 10),
      category: r.category,
      seconds: Math.max(0, Math.round(r.seconds)),
    });
  }

  try {
    mergeUsageRows(userId, cleaned);
    res.json({ ok: true, merged: cleaned.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'merge failed' });
  }
});

/**
 * Category totals for the last `days` days (default 7).
 */
app.get('/api/summary', (req, res) => {
  const userId = req.query.userId;
  const days = Math.min(90, Math.max(1, parseInt(String(req.query.days || '7'), 10) || 7));
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId required' });
  }
  const totals = summaryByCategory(userId, days);
  res.json({ userId, days, totals });
});

/**
 * Per-day stacked data for charts.
 */
app.get('/api/daily', (req, res) => {
  const userId = req.query.userId;
  const days = Math.min(90, Math.max(1, parseInt(String(req.query.days || '7'), 10) || 7));
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId required' });
  }
  const breakdown = dailyBreakdown(userId, days);
  res.json({ userId, days, breakdown });
});

/**
 * Weekly-style report: summary + top sites for the last 7 days.
 */
app.get('/api/weekly', (req, res) => {
  const userId = req.query.userId;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId required' });
  }
  const days = 7;
  const totals = summaryByCategory(userId, days);
  const breakdown = dailyBreakdown(userId, days);
  const hosts = topHosts(userId, days, 12);
  const totalSec = totals.productive + totals.unproductive + totals.neutral;
  const productiveRatio = totalSec > 0 ? totals.productive / totalSec : 0;

  res.json({
    userId,
    periodDays: days,
    totals,
    breakdown,
    topHosts: hosts,
    productiveRatio,
    generatedAt: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.redirect('/dashboard/');
});

app.listen(PORT, () => {
  console.log(`FocusTrack server listening on http://localhost:${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard/`);
});
