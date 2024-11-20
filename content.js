// Test function to verify script is running
function testContentScript() {
    console.log('Content script is running!');
    document.body.style.border = '5px solid red';
}

console.log('Content script loaded');

// Create a button container for both buttons
const buttonContainer = document.createElement('div');
buttonContainer.style.cssText = `
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10000;
  transition: right 0.3s ease;
`;

// Create and style the clipboard button
const toggleButton = document.createElement('button');
toggleButton.innerHTML = '📋';
toggleButton.style.cssText = `
  width: 40px;
  height: 40px;
  border-radius: 5px 0 0 5px;
  border: none;
  background: white;
  box-shadow: -2px 0 5px rgba(0,0,0,0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: transform 0.2s;
`;

// Create and style the sessions button
const sessionsButton = document.createElement('button');
sessionsButton.innerHTML = '📚';
sessionsButton.style.cssText = toggleButton.style.cssText;

// Create the sidebar iframe
const sidebar = document.createElement('iframe');
sidebar.src = chrome.runtime.getURL('dist/index.html');
sidebar.style.cssText = `
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  border: none;
  background: white;
  box-shadow: -2px 0 10px rgba(0,0,0,0.1);
  z-index: 9999;
  transition: right 0.3s ease;
`;

// Create the sessions panel iframe
const sessionsPanel = document.createElement('iframe');
sessionsPanel.src = chrome.runtime.getURL('dist/sessions.html');
sessionsPanel.style.cssText = sidebar.style.cssText;

// Add buttons to container and everything to document
buttonContainer.appendChild(toggleButton);
buttonContainer.appendChild(sessionsButton);
document.body.appendChild(buttonContainer);
document.body.appendChild(sidebar);
document.body.appendChild(sessionsPanel);

let sidebarOpen = false;
let sessionsPanelOpen = false;

// Toggle sidebar when clipboard button is clicked
toggleButton.addEventListener('click', () => {
  sidebarOpen = !sidebarOpen;
  sidebar.style.right = sidebarOpen ? '0' : '-400px';
  buttonContainer.style.right = sidebarOpen ? '400px' : '0';
  
  // Close sessions panel if open
  if (sidebarOpen && sessionsPanelOpen) {
    sessionsPanelOpen = false;
    sessionsPanel.style.right = '-400px';
  }
});

// Toggle sessions panel when sessions button is clicked
sessionsButton.addEventListener('click', () => {
  sessionsPanelOpen = !sessionsPanelOpen;
  sessionsPanel.style.right = sessionsPanelOpen ? '0' : '-400px';
  buttonContainer.style.right = sessionsPanelOpen ? '400px' : '0';
  
  // Close sidebar if open
  if (sessionsPanelOpen && sidebarOpen) {
    sidebarOpen = false;
    sidebar.style.right = '-400px';
  }
});

// Listen for copy events
document.addEventListener('copy', function(e) {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.runtime.sendMessage({
      action: 'saveText',
      text: selectedText
    }, function(response) {
      console.log('Response from background:', response);
    });
  }
});

// Run test immediately
testContentScript();