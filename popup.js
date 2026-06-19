const toggle = document.getElementById('toggle');
const STORAGE_KEY = 'hide_forums';

function setToggleState(enabled) {
  toggle.checked = enabled;
}

chrome.storage.sync.get([STORAGE_KEY], (result) => {
  setToggleState(result[STORAGE_KEY] !== false);
});

toggle.addEventListener('change', () => {
  chrome.storage.sync.set({ [STORAGE_KEY]: toggle.checked });
});
