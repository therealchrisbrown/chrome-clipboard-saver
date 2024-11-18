chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage
  chrome.storage.local.set({ copiedItems: [] });
});

// Function to save text to database
async function saveToDatabase(text, sourceUrl) {
  try {
    const response = await fetch('http://localhost:5000/api/clipboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: text,
        source_url: sourceUrl
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save to database');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving to database:', error);
  }
}

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
  } else if (message.action === 'saveText') {
    saveToDatabase(message.text, sender.tab?.url || '')
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
});