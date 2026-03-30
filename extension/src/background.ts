// Toolbar icon toggles the sidebar. A default_popup in the manifest would block
// chrome.action.onClicked — do not add popup.tsx unless you wire the popup to
// send TOGGLE_SIDEBAR yourself.

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return
  chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" }, () => {
    void chrome.runtime.lastError
    // Fails on chrome://, edge://, the Web Store, etc. — no content script there.
  })
})

export {}
