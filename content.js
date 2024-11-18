document.addEventListener("copy", (event) => {
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText) {
    // Send to background script for storage
    chrome.runtime.sendMessage({
      action: 'saveText',
      text: selectedText
    }, (response) => {
      if (response && response.success) {
        console.log('Text saved to database successfully');
      } else {
        console.error('Failed to save text to database');
      }
    });
  }
});