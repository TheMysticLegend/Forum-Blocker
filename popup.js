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

const finePointerQuery = window.matchMedia('(pointer: fine)');

if (finePointerQuery.matches) {
  const reflectionState = {
    frameId: 0,
    bounds: null,
    targetX: 50,
    targetY: 0,
    renderedX: 50,
    renderedY: 0,
  };

  function updateReflectionTarget(event) {
    if (!document.body.classList.contains('theme-glass')) {
      return;
    }

    if (!reflectionState.bounds) {
      reflectionState.bounds = document.body.getBoundingClientRect();
    }

    const { left, top, width, height } = reflectionState.bounds;
    reflectionState.targetX = ((event.clientX - left) / width) * 100;
    reflectionState.targetY = ((event.clientY - top) / height) * 100;

    if (!reflectionState.frameId) {
      reflectionState.frameId = requestAnimationFrame(renderReflection);
    }
  }

  function renderReflection() {
    const ease = 0.12;
    const deltaX = reflectionState.targetX - reflectionState.renderedX;
    const deltaY = reflectionState.targetY - reflectionState.renderedY;

    reflectionState.renderedX += deltaX * ease;
    reflectionState.renderedY += deltaY * ease;

    document.body.style.setProperty(
      '--glass-reflection-x',
      `${reflectionState.renderedX.toFixed(2)}%`
    );
    document.body.style.setProperty(
      '--glass-reflection-y',
      `${reflectionState.renderedY.toFixed(2)}%`
    );

    if (Math.abs(deltaX) > 0.05 || Math.abs(deltaY) > 0.05) {
      reflectionState.frameId = requestAnimationFrame(renderReflection);
    } else {
      reflectionState.frameId = 0;
    }
  }

  document.addEventListener('pointerenter', () => {
    reflectionState.bounds = document.body.getBoundingClientRect();
  });

  document.addEventListener('pointermove', updateReflectionTarget);

  window.addEventListener('resize', () => {
    reflectionState.bounds = null;
  });
}
