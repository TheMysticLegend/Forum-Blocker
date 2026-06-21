const LEGACY_STORAGE_KEY = 'hide_forums';
const THEME_STORAGE_KEY = 'popup_theme';
const STORAGE_KEYS = [
  'hide_reddit',
  'hide_quora',
  LEGACY_STORAGE_KEY,
  THEME_STORAGE_KEY,
];

const toggles = {
  hide_reddit: document.getElementById('reddit-toggle'),
  hide_quora: document.getElementById('quora-toggle'),
};

const themeSelect = document.getElementById('theme-select');
const redditIcon = document.getElementById('reddit-icon');
const quoraIcon = document.getElementById('quora-icon');
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

const icons = {
  default: {
    reddit: 'reddit.png',
    quora: 'quora.png',
  },
  glass: {
    reddit: 'Reddit Liquid Glass.png',
    quora: 'Quora Liquid Glass.png',
  },
};

function getSettings(result) {
  const legacyEnabled = result[LEGACY_STORAGE_KEY] !== false;

  return {
    hide_reddit: result.hide_reddit ?? legacyEnabled,
    hide_quora: result.hide_quora ?? legacyEnabled,
  };
}

function applyTheme(theme) {
  const selectedTheme = ['system', 'light', 'dark', 'glass'].includes(theme)
    ? theme
    : 'light';
  const visibleTheme =
    selectedTheme === 'system'
      ? (systemThemeQuery.matches ? 'dark' : 'light')
      : selectedTheme;

  document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-glass');
  document.body.classList.remove('theme-light', 'theme-dark', 'theme-glass');
  document.documentElement.classList.add(`theme-${visibleTheme}`);
  document.body.classList.add(`theme-${visibleTheme}`);
  themeSelect.value = selectedTheme;

  const iconSet = visibleTheme === 'glass' ? icons.glass : icons.default;
  redditIcon.src = iconSet.reddit;
  quoraIcon.src = iconSet.quora;
}

chrome.storage.sync.get(STORAGE_KEYS, (result) => {
  const settings = getSettings(result);

  for (const [key, toggle] of Object.entries(toggles)) {
    toggle.checked = settings[key];
  }

  applyTheme(result[THEME_STORAGE_KEY]);
});

for (const [key, toggle] of Object.entries(toggles)) {
  toggle.addEventListener('change', () => {
    chrome.storage.sync.set({ [key]: toggle.checked });
  });
}

themeSelect.addEventListener('change', () => {
  const theme = themeSelect.value;

  applyTheme(theme);
  chrome.storage.sync.set({ [THEME_STORAGE_KEY]: theme });
});

systemThemeQuery.addEventListener('change', () => {
  if (themeSelect.value === 'system') {
    applyTheme('system');
  }
});
