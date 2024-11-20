console.log('Background script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'COPY_TEXT') {
    const { text, sourceUrl } = message;
    console.log('Background received text:', text);
    console.log('From URL:', sourceUrl);

    // Send to backend
    fetch('http://localhost:5000/api/clipboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: text,
        source_url: sourceUrl
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      sendResponse({ success: true });
    })
    .catch((error) => {
      console.error('Error:', error);
      sendResponse({ success: false, error: error.message });
    });

    return true; // Keep the message channel open for async response
  }
});