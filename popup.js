document.getElementById("deleteChats").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    if (tab.url.includes("chat.openai.com") || tab.url.includes("chatgpt.com")) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
        function: () => {
            alert("Deleting selected chats...");
          }
      });
    } else {
      alert("This extension only works on ChatGPT!");
    }
  });