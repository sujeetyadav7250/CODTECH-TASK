/**
 * Resolves a hostname into a productivity category using default rules
 * and optional per-host overrides from chrome.storage.
 *
 * Categories: "productive" | "unproductive" | "neutral"
 */

/**
 * @param {string} hostname Lowercase hostname (no port).
 * @param {{ productive?: string[], unproductive?: string[], neutral?: string[] }} defaults
 * @param {Record<string, 'productive'|'unproductive'|'neutral'>} overrides
 * @returns {'productive'|'unproductive'|'neutral'}
 */
export function resolveCategory(hostname, defaults, overrides = {}) {
  if (overrides[hostname]) {
    return overrides[hostname];
  }

  const lists = [
    { key: 'productive', arr: defaults.productive || [] },
    { key: 'unproductive', arr: defaults.unproductive || [] },
    { key: 'neutral', arr: defaults.neutral || [] },
  ];

  for (const { key, arr } of lists) {
    for (const pattern of arr) {
      if (hostname === pattern || hostname.endsWith('.' + pattern)) {
        return /** @type {'productive'|'unproductive'|'neutral'} */ (key);
      }
    }
  }

  return 'neutral';
}
