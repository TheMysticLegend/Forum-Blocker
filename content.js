const LEGACY_STORAGE_KEY = 'hide_forums';
const STORAGE_KEYS = ['hide_reddit', 'hide_quora', LEGACY_STORAGE_KEY];
const blockedDomains = {
  hide_reddit: 'reddit.com',
  hide_quora: 'quora.com',
};
const HIDDEN_ATTR = 'data-forum-blocker-hidden';
let hideSettings = {
  hide_reddit: true,
  hide_quora: true,
};

function isAllSearchSection() {
  const url = new URL(location.href);

  if (url.pathname !== '/search') {
    return false;
  }

  // Google uses these params for non-All result sections, including Images.
  if (url.searchParams.has('tbm') || url.searchParams.has('udm')) {
    return false;
  }

  return true;
}

function getHostname(value) {
  try {
    const url = new URL(value, location.href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }

    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function getTargetUrls(href) {
  try {
    const url = new URL(href, location.href);
    const hostname = url.hostname.toLowerCase();

    if (!hostname.includes('google.')) {
      return [href];
    }

    return ['url', 'q', 'u', 'imgurl', 'imgrefurl']
      .map((param) => url.searchParams.get(param))
      .filter((value) => value && getHostname(value));
  } catch {
    return [];
  }
}

function getEnabledDomains() {
  return Object.entries(blockedDomains)
    .filter(([key]) => hideSettings[key])
    .map(([, domain]) => domain);
}

function matchesBlockedDomain(href) {
  const enabledDomains = getEnabledDomains();

  if (enabledDomains.length === 0) {
    return false;
  }

  return getTargetUrls(href).some((targetUrl) => {
    const hostname = getHostname(targetUrl);

    return enabledDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  });
}

function hideForumResults() {
  showForumResults();

  if (!isAllSearchSection()) {
    return;
  }

  const resultLinks = document.querySelectorAll('a[href]');
  const hiddenBlocks = new Set();

  for (const link of resultLinks) {
    if (!matchesBlockedDomain(link.href || '')) {
      continue;
    }

    const resultBlock =
      link.closest('div.g') ||
      link.closest('div.MjjYud') ||
      link.closest('div[data-snc]') ||
      link.parentElement;

    if (resultBlock && !hiddenBlocks.has(resultBlock)) {
      hiddenBlocks.add(resultBlock);
      resultBlock.style.display = 'none';
      resultBlock.setAttribute(HIDDEN_ATTR, 'true');
    }
  }
}

function showForumResults() {
  const hiddenNodes = document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`);
  for (const node of hiddenNodes) {
    node.style.display = '';
    node.removeAttribute(HIDDEN_ATTR);
  }
}

function getSettingsFromStorage(result) {
  const legacyEnabled = result[LEGACY_STORAGE_KEY] !== false;

  return {
    hide_reddit: result.hide_reddit ?? legacyEnabled,
    hide_quora: result.hide_quora ?? legacyEnabled,
  };
}

function applySettings(settings) {
  hideSettings = settings;
  hideForumResults();
}

chrome.storage.sync.get(STORAGE_KEYS, (result) => {
  applySettings(getSettingsFromStorage(result));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') {
    return;
  }

  const changedKeys = Object.keys(changes);
  if (!changedKeys.some((key) => STORAGE_KEYS.includes(key))) {
    return;
  }

  chrome.storage.sync.get(STORAGE_KEYS, (result) => {
    applySettings(getSettingsFromStorage(result));
  });
});

const observer = new MutationObserver(() => {
  hideForumResults();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
