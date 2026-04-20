/**
 * Service worker: tracks active-tab time, buckets by hostname/day/category,
 * persists to chrome.storage.local, and syncs to the FocusTrack backend on an alarm.
 */
import { resolveCategory } from './categoryResolver.js';

/** @type {{ productive: string[], unproductive: string[], neutral: string[] } | null} */
let defaultRules = null;

/** Current focused normal tab segment (null if none). */
let activeSegment = null;

const STORAGE_KEYS = {
  USER_ID: 'focusTrackUserId',
  DAILY: 'focusTrackDaily',
  OVERRIDES: 'focusTrackCategoryOverrides',
  API_BASE: 'focusTrackApiBase',
  LAST_SYNC: 'focusTrackLastSync',
};

const SYNC_ALARM = 'focusTrackSync';
const FLUSH_ALARM = 'focusTrackFlush';

/**
 * Loads bundled default classification lists (productive / unproductive / neutral).
 */
async function loadDefaultRules() {
  if (defaultRules) return defaultRules;
  const url = chrome.runtime.getURL('defaultRules.json');
  const res = await fetch(url);
  defaultRules = await res.json();
  return defaultRules;
}

/**
 * Returns a stable random user id (created on first run).
 */
async function getOrCreateUserId() {
  const data = await chrome.storage.local.get(STORAGE_KEYS.USER_ID);
  if (data[STORAGE_KEYS.USER_ID]) return data[STORAGE_KEYS.USER_ID];
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ [STORAGE_KEYS.USER_ID]: id });
  return id;
}

/**
 * Per-host category overrides from the options page.
 * @returns {Promise<Record<string, 'productive'|'unproductive'|'neutral'>>}
 */
async function getOverrides() {
  const data = await chrome.storage.local.get(STORAGE_KEYS.OVERRIDES);
  return data[STORAGE_KEYS.OVERRIDES] || {};
}

/**
 * YYYY-MM-DD in local timezone.
 */
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Extracts a usable hostname or null for non-http(s) / system pages.
 * @param {string} url
 */
function hostnameFromUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Reads nested map: daily[date][hostname][category] = seconds.
 */
async function getDailyMap() {
  const data = await chrome.storage.local.get(STORAGE_KEYS.DAILY);
  return data[STORAGE_KEYS.DAILY] || {};
}

/**
 * Adds seconds to today's bucket for hostname/category.
 */
async function addSeconds(hostname, category, seconds) {
  if (seconds <= 0 || !hostname) return;
  const day = todayKey();
  const daily = await getDailyMap();
  if (!daily[day]) daily[day] = {};
  if (!daily[day][hostname]) daily[day][hostname] = { productive: 0, unproductive: 0, neutral: 0 };
  daily[day][hostname][category] += seconds;
  await chrome.storage.local.set({ [STORAGE_KEYS.DAILY]: daily });
}

/**
 * Flushes elapsed time from activeSegment into storage and resets its start time.
 */
async function flushActiveSegment() {
  if (!activeSegment) return;
  const now = Date.now();
  const elapsedSec = Math.floor((now - activeSegment.startTime) / 1000);
  if (elapsedSec > 0) {
    await addSeconds(activeSegment.hostname, activeSegment.category, elapsedSec);
  }
  activeSegment.startTime = now;
}

/**
 * Starts tracking a tab if it is a normal http(s) page.
 * @param {chrome.tabs.Tab} tab
 */
async function beginSegmentForTab(tab) {
  await loadDefaultRules();
  const overrides = await getOverrides();
  const url = tab.url || '';
  const hostname = hostnameFromUrl(url);
  if (!hostname) {
    activeSegment = null;
    return;
  }
  const category = resolveCategory(hostname, defaultRules, overrides);
  activeSegment = {
    tabId: tab.id,
    windowId: tab.windowId,
    hostname,
    category,
    startTime: Date.now(),
  };
}

/**
 * Chooses the active tab in the focused window and begins a segment.
 */
async function syncActiveFromBrowser() {
  await flushActiveSegment();
  const win = await chrome.windows.getLastFocused({ populate: true });
  if (!win || !win.tabs) {
    activeSegment = null;
    return;
  }
  const active = win.tabs.find((t) => t.active);
  if (!active || !active.id) {
    activeSegment = null;
    return;
  }
  await beginSegmentForTab(active);
}

chrome.runtime.onInstalled.addListener(async () => {
  await loadDefaultRules();
  await getOrCreateUserId();
  // Idle after ~1 minute of no input — pause attribution while away from keyboard.
  chrome.idle.setDetectionInterval(60);
  // Periodic sync to backend (every 5 minutes).
  await chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 5 });
  // Persist in-progress time if the worker goes idle (minimum 1 minute in Chrome).
  await chrome.alarms.create(FLUSH_ALARM, { periodInMinutes: 1 });
  await syncActiveFromBrowser();
});

chrome.runtime.onStartup.addListener(async () => {
  await loadDefaultRules();
  chrome.idle.setDetectionInterval(60);
  await chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 5 });
  await chrome.alarms.create(FLUSH_ALARM, { periodInMinutes: 1 });
  await syncActiveFromBrowser();
});

chrome.tabs.onActivated.addListener(async () => {
  await syncActiveFromBrowser();
});

// If the active tab is closed, flush time for that segment so seconds are not lost.
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (activeSegment && activeSegment.tabId === tabId) {
    await flushActiveSegment();
    activeSegment = null;
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    const active = await chrome.tabs.query({ active: true, currentWindow: true });
    if (active[0] && active[0].id === tabId) {
      await flushActiveSegment();
      await beginSegmentForTab(tab);
    }
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await flushActiveSegment();
    activeSegment = null;
    return;
  }
  await syncActiveFromBrowser();
});

// When the user is idle, stop attributing time until active again.
chrome.idle.onStateChanged.addListener(async (state) => {
  if (state === 'active') {
    await syncActiveFromBrowser();
  } else {
    await flushActiveSegment();
    activeSegment = null;
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === FLUSH_ALARM) {
    await flushActiveSegment();
  }
  if (alarm.name === SYNC_ALARM) {
    await syncToBackend();
  }
});

/**
 * Builds flat rows from local daily map for API sync.
 */
async function collectRowsForSync() {
  const daily = await getDailyMap();
  /** @type {Array<{ hostname: string, day: string, category: string, seconds: number }>} */
  const rows = [];
  for (const [day, hosts] of Object.entries(daily)) {
    for (const [hostname, cats] of Object.entries(hosts)) {
      for (const [category, sec] of Object.entries(cats)) {
        if (sec > 0) {
          rows.push({ hostname, day, category, seconds: Math.round(sec) });
        }
      }
    }
  }
  return rows;
}

/**
 * POSTs usage rows to the configured API base URL.
 */
async function syncToBackend() {
  const baseData = await chrome.storage.local.get([STORAGE_KEYS.API_BASE, STORAGE_KEYS.USER_ID]);
  const apiBase = (baseData[STORAGE_KEYS.API_BASE] || 'http://localhost:3847').replace(/\/$/, '');
  const userId = baseData[STORAGE_KEYS.USER_ID];
  if (!userId) return;

  const rows = await collectRowsForSync();
  if (rows.length === 0) return;

  try {
    const res = await fetch(`${apiBase}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, rows }),
    });
    if (!res.ok) {
      console.warn('FocusTrack sync failed', res.status);
      return;
    }
    await chrome.storage.local.set({ [STORAGE_KEYS.LAST_SYNC]: Date.now() });
  } catch (e) {
    console.warn('FocusTrack sync error', e);
  }
}

// Allow popup/options to request an immediate sync or refresh.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'FOCUS_TRACK_SYNC') {
    syncToBackend().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (msg?.type === 'FOCUS_TRACK_GET_SNAPSHOT') {
    Promise.all([getDailyMap(), chrome.storage.local.get(STORAGE_KEYS.LAST_SYNC)])
      .then(([daily, rest]) => {
        sendResponse({ daily, lastSync: rest[STORAGE_KEYS.LAST_SYNC] || null });
      })
      .catch(() => sendResponse({ daily: {}, lastSync: null }));
    return true;
  }
  return false;
});
