chrome.runtime.onInstalled.addListener(() => {
  console.log("Bulk Archive & Delete ChatGPT Chats Extension Installed.");
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});
