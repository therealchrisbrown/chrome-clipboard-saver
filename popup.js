document.addEventListener("DOMContentLoaded", () => {
  const copiedTextsDiv = document.getElementById("copied-texts");

  // Load copied items from storage and display them
  chrome.storage.local.get("copiedItems", (result) => {
    const copiedItems = result.copiedItems || [];

    // Clear the display area
    copiedTextsDiv.innerHTML = "";

    // Display each copied item
    copiedItems.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "copied-item";

      const textP = document.createElement("p");
      textP.textContent = item.text;

      const urlA = document.createElement("a");
      urlA.href = item.url;
      urlA.textContent = item.url;
      urlA.target = "_blank";

      const timeP = document.createElement("p");
      timeP.textContent = new Date(item.time).toLocaleString();
      timeP.style.fontSize = "0.8em";
      timeP.style.color = "gray";

      itemDiv.appendChild(textP);
      itemDiv.appendChild(urlA);
      itemDiv.appendChild(timeP);

      copiedTextsDiv.appendChild(itemDiv);
    });
  });
});