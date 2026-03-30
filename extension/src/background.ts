// Background service worker — handles toolbar icon click to toggle the sidebar

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return
  chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" })
})

export {}
