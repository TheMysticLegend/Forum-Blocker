const STORAGE_KEY = 'hide_forums';
const blockedDomains = ['reddit.com', 'quora.com'];
const HIDDEN_ATTR = 'data-forum-blocker-hidden';
let hideForumsEnabled = true;

function getTargetUrl(href) {
  try {
    const url = new URL(href, location.href);
    if (url.hostname.includes('google.')) {
      return url.searchParams.get('q') || url.searchParams.get('url') || href;
    }
    return href;
  } catch {
    return href;
  }
}

function matchesBlockedDomain(url) {
  return blockedDomains.some((domain) => url.toLowerCase().includes(domain));
}

function hideForumResults() {
  const resultLinks = document.querySelectorAll('a[href]');

  for (const link of resultLinks) {
    const targetUrl = getTargetUrl(link.href || '');
    if (!matchesBlockedDomain(targetUrl)) {
      continue;
    }

    const resultBlock =
      link.closest('div.g') ||
      link.closest('div.MjjYud') ||
      link.closest('div[data-snc]') ||
      link.parentElement;

    if (resultBlock) {
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

function applySetting(enabled) {
  hideForumsEnabled = enabled;

  if (enabled) {
    hideForumResults();
  } else {
    showForumResults();
  }
}

chrome.storage.sync.get([STORAGE_KEY], (result) => {
  applySetting(result[STORAGE_KEY] !== false);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync' || !changes[STORAGE_KEY]) {
    return;
  }

  applySetting(changes[STORAGE_KEY].newValue !== false);
});

const observer = new MutationObserver(() => {
  if (hideForumsEnabled) {
    hideForumResults();
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
