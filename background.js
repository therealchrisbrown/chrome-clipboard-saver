chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage
  chrome.storage.local.set({ copiedItems: [] });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "saveCopy") {
    // Retrieve and update the copied items
    chrome.storage.local.get(["copiedItems"], (result) => {
      const copiedItems = result.copiedItems || [];
      // Add the new copied item
      copiedItems.push({ text: message.text, url: message.url, time: new Date().toISOString() });
      
      // Save updated list back to storage
      chrome.storage.local.set({ copiedItems }, () => {
        // Check for errors in set operation
        if (chrome.runtime.lastError) {
          sendResponse({ status: "error", message: chrome.runtime.lastError.message });
        } else {
          sendResponse({ status: "success" });
        }
      });
    });
    
    // Required for asynchronous sendResponse
    return true;
  }
});