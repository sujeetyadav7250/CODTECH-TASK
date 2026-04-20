/**
 * Popup UI: aggregates today’s seconds by category and links to the web dashboard.
 */

const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function formatDuration(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

async function load() {
  const res = await chrome.runtime.sendMessage({ type: 'FOCUS_TRACK_GET_SNAPSHOT' });
  const daily = res?.daily || {};
  const day = todayKey();
  const hosts = daily[day] || {};

  const totals = { productive: 0, unproductive: 0, neutral: 0 };
  for (const cats of Object.values(hosts)) {
    totals.productive += cats.productive || 0;
    totals.unproductive += cats.unproductive || 0;
    totals.neutral += cats.neutral || 0;
  }

  const ul = document.getElementById('today');
  ul.innerHTML = '';
  const order = [
    ['Productive', totals.productive],
    ['Neutral', totals.neutral],
    ['Unproductive', totals.unproductive],
  ];
  for (const [label, sec] of order) {
    const li = document.createElement('li');
    li.innerHTML = `<span>${label}</span><span>${formatDuration(Math.round(sec))}</span>`;
    ul.appendChild(li);
  }

  const syncEl = document.getElementById('sync');
  if (res?.lastSync) {
    const d = new Date(res.lastSync);
    syncEl.textContent = `Last synced: ${d.toLocaleString()}`;
  } else {
    syncEl.textContent = 'Not synced yet (start the backend or click Sync).';
  }

  const baseData = await chrome.storage.local.get(['focusTrackApiBase', 'focusTrackUserId']);
  const apiBase = (baseData.focusTrackApiBase || 'http://localhost:3847').replace(/\/$/, '');
  const userId = baseData.focusTrackUserId || '';
  const dash = document.getElementById('dashLink');
  dash.href = `${apiBase}/dashboard/?userId=${encodeURIComponent(userId)}`;

  document.getElementById('syncNow').onclick = async () => {
    await chrome.runtime.sendMessage({ type: 'FOCUS_TRACK_SYNC' });
    load();
  };
}

load();
