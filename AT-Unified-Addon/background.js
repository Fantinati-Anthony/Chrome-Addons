// AT Unified Toolkit - Background Service Worker

// Context menu for GPT text correction
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for text correction
  chrome.contextMenus.create({
    id: 'correct-with-gpt',
    title: 'Corriger avec GPT',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'correct-with-gpt') {
    const selectedText = info.selectionText;

    if (!selectedText) {
      return;
    }

    // Get API key from storage
    const { openaiApiKey } = await chrome.storage.sync.get(['openaiApiKey']);

    if (!openaiApiKey) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          alert('Cle API OpenAI non configuree. Allez dans les options de l\'extension.');
        }
      });
      return;
    }

    try {
      // Call GPT API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: 'Tu es un correcteur orthographique et grammatical. Corrige uniquement l\'orthographe, la grammaire et la syntaxe du texte fourni. Ne change pas le sens ni le style. Retourne uniquement le texte corrige sans explication.'
            },
            {
              role: 'user',
              content: selectedText
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const correctedText = data.choices[0].message.content;

      // Copy to clipboard and replace text
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (original, corrected) => {
          // Copy both to clipboard
          navigator.clipboard.writeText(`Original: ${original}\n\nCorrige: ${corrected}`);

          // Try to replace selected text
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const activeElement = document.activeElement;

            // Check if selection is in an editable element
            if (activeElement && (activeElement.isContentEditable ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'INPUT')) {

              if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
                const start = activeElement.selectionStart;
                const end = activeElement.selectionEnd;
                activeElement.value = activeElement.value.substring(0, start) +
                                     corrected +
                                     activeElement.value.substring(end);
              } else {
                range.deleteContents();
                range.insertNode(document.createTextNode(corrected));
              }
            }
          }

          alert('Texte corrige et copie dans le presse-papiers!');
        },
        args: [selectedText, correctedText]
      });

    } catch (error) {
      console.error('GPT correction error:', error);
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (errorMsg) => {
          alert('Erreur lors de la correction: ' + errorMsg);
        },
        args: [error.message]
      });
    }
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'extractEmails') {
    // Handle email extraction request
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
              const pageContent = document.documentElement.innerHTML;
              const matches = pageContent.match(emailRegex) || [];
              return [...new Set(matches)];
            }
          });
          sendResponse({ emails: results[0].result });
        } catch (error) {
          sendResponse({ error: error.message });
        }
      }
    });
    return true; // Keep channel open for async response
  }
});

console.log('AT Unified Toolkit background service worker loaded');

// ========== CUSTOM FAVICON RESTORE ==========
// Restore custom extension icon on startup
async function restoreCustomFavicon() {
  try {
    const data = await chrome.storage.local.get(['customFavicon']);

    if (data.customFavicon) {
      const dataUrl = data.customFavicon;

      // Create different sizes for the icon
      const sizes = [16, 32, 48, 128];
      const imageData = {};

      for (const size of sizes) {
        const canvas = new OffscreenCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // Create image from data URL
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);

        ctx.drawImage(imageBitmap, 0, 0, size, size);
        imageData[size] = ctx.getImageData(0, 0, size, size);
      }

      // Set the extension icon
      chrome.action.setIcon({ imageData });
      console.log('Custom favicon restored');
    }
  } catch (error) {
    console.error('Failed to restore custom favicon:', error);
  }
}

// Restore favicon when service worker starts
restoreCustomFavicon();
