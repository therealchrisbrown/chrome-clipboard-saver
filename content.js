document.addEventListener("copy", (event) => {
  const copiedText = document.getSelection().toString();
  if (!copiedText) {
    console.warn("No text selected to copy.");
    return;
  }

  const sourceUrl = window.location.href;

  // Check if chrome.runtime is defined before sending a message
  if (chrome.runtime) {
    chrome.runtime.sendMessage(
      {
        type: "saveCopy",
        text: copiedText,
        url: sourceUrl
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError.message);
        } else if (response && response.status === "success") {
          console.log("Copied text saved successfully.");
        }
      }
    );
  } else {
    console.warn("Chrome runtime is not available. The extension context may be invalidated.");
  }
});