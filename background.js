console.log('Background script loaded');

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('Message received:', message);
    
    if (message.action === 'saveText') {
        fetch('http://localhost:5001/api/clipboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: message.text,
                source_url: sender.tab?.url || ''
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Save successful:', data);
            sendResponse({ success: true, data });
        })
        .catch(error => {
            console.error('Save failed:', error);
            sendResponse({ success: false, error: error.message });
        });
        
        return true; // Keep the message channel open for async response
    }
});