document.addEventListener("copy", (event) => {
  const copiedText = document.getSelection().toString();
  if (!copiedText) {
    console.warn("No text selected to copy.");
    return;
  }

  const sourceUrl = window.location.href;

  // Send the copied text and URL to the background script
  chrome.runtime.sendMessage(
    {
      type: "saveCopy",
      text: copiedText,
      url: sourceUrl
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
      } else if (response && response.status === "success") {
        console.log("Copied text saved successfully.");
      }
    }
  );
});