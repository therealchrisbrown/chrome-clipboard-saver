console.log('Background script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'COPY_TEXT') {
    const { text, sourceUrl } = message;
    console.log('Background received text:', text);
    console.log('From URL:', sourceUrl);

    // Send to backend
    fetch('http://localhost:5001/api/clipboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': chrome.runtime.getURL('')
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        content: text,
        source_url: sourceUrl
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
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

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const sidebarURL = chrome.runtime.getURL('dist/index.html');
      
      // Check if sidebar already exists
      let sidebar = document.getElementById('clipboard-history-sidebar');
      if (sidebar) {
        // Toggle sidebar
        sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
        return;
      }
      
      // Create and inject sidebar
      sidebar = document.createElement('iframe');
      sidebar.id = 'clipboard-history-sidebar';
      sidebar.src = sidebarURL;
      sidebar.style.cssText = `
        position: fixed;
        top: 0;
        right: -400px;
        width: 400px;
        height: 100vh;
        border: none;
        background: white;
        box-shadow: -2px 0 5px rgba(0,0,0,0.1);
        z-index: 10000;
        transition: right 0.3s ease;
      `;
      
      document.body.appendChild(sidebar);
      
      // Animate sidebar in
      setTimeout(() => {
        sidebar.style.right = '0';
      }, 100);
    }
  });
});