// Function to format the timestamp
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString();
}

// Function to create a copied item element
function createCopiedItemElement(item) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'copied-item';
  itemDiv.innerHTML = `
    <div class="copied-text">${item.content}</div>
    <div class="meta-info">
      <a href="${item.source_url}" class="source-url" target="_blank" title="${item.source_url}">
        ${new URL(item.source_url).hostname}
      </a>
      <span class="timestamp">${formatTimestamp(item.timestamp)}</span>
    </div>
    <button class="delete-btn" data-id="${item.id}">×</button>
  `;

  // Add delete functionality
  const deleteBtn = itemDiv.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/clipboard/${item.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        itemDiv.remove();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  });

  return itemDiv;
}

// Function to load and display copied items
async function loadCopiedItems() {
  const copiedItemsContainer = document.getElementById('copied-items');
  
  try {
    const response = await fetch('http://localhost:5001/api/clipboard');
    const items = await response.json();
    
    copiedItemsContainer.innerHTML = ''; // Clear existing items
    
    if (items.length === 0) {
      copiedItemsContainer.innerHTML = '<p>No copied text yet.</p>';
      return;
    }
    
    items.forEach(item => {
      const itemElement = createCopiedItemElement(item);
      copiedItemsContainer.appendChild(itemElement);
    });
  } catch (error) {
    console.error('Error loading items:', error);
    copiedItemsContainer.innerHTML = '<p>Error loading items. Make sure the server is running.</p>';
  }
}

// Load items when popup opens
document.addEventListener('DOMContentLoaded', loadCopiedItems);

// Refresh items periodically
setInterval(loadCopiedItems, 5000);