const LEGACY_STORAGE_KEY = 'hide_forums';
const STORAGE_KEYS = ['hide_reddit', 'hide_quora', LEGACY_STORAGE_KEY];

const toggles = {
  hide_reddit: document.getElementById('reddit-toggle'),
  hide_quora: document.getElementById('quora-toggle'),
};

function getSettings(result) {
  const legacyEnabled = result[LEGACY_STORAGE_KEY] !== false;

  return {
    hide_reddit: result.hide_reddit ?? legacyEnabled,
    hide_quora: result.hide_quora ?? legacyEnabled,
  };
}

chrome.storage.sync.get(STORAGE_KEYS, (result) => {
  const settings = getSettings(result);

  for (const [key, toggle] of Object.entries(toggles)) {
    toggle.checked = settings[key];
  }
});

for (const [key, toggle] of Object.entries(toggles)) {
  toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ [key]: toggle.checked });
  });
}
