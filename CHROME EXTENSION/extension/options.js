/**
 * Options page: API base URL and JSON map of hostname → category override.
 */

const STORAGE_KEYS = {
  API_BASE: 'focusTrackApiBase',
  OVERRIDES: 'focusTrackCategoryOverrides',
  USER_ID: 'focusTrackUserId',
};

async function load() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.API_BASE,
    STORAGE_KEYS.OVERRIDES,
    STORAGE_KEYS.USER_ID,
  ]);

  document.getElementById('apiBase').value = data[STORAGE_KEYS.API_BASE] || 'http://localhost:3847';
  document.getElementById('overrides').value = data[STORAGE_KEYS.OVERRIDES]
    ? JSON.stringify(data[STORAGE_KEYS.OVERRIDES], null, 2)
    : '';
  document.getElementById('userId').textContent = data[STORAGE_KEYS.USER_ID] || '(not created yet — reload after install)';
}

document.getElementById('save').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = '';

  const apiBase = document.getElementById('apiBase').value.trim() || 'http://localhost:3847';
  let overrides = {};
  const raw = document.getElementById('overrides').value.trim();
  if (raw) {
    try {
      overrides = JSON.parse(raw);
      if (typeof overrides !== 'object' || overrides === null) {
        throw new Error('Overrides must be a JSON object');
      }
    } catch (e) {
      status.style.color = '#c62828';
      status.textContent = `Invalid JSON: ${e.message}`;
      return;
    }
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.API_BASE]: apiBase.replace(/\/$/, ''),
    [STORAGE_KEYS.OVERRIDES]: overrides,
  });

  status.style.color = '#2e7d32';
  status.textContent = 'Saved.';
});

load();
