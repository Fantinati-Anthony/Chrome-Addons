// Auto-update module for Blazing Toolkit
// Downloads only CHANGED files from GitHub using Compare API

const AutoUpdater = (function() {
  'use strict';

  // Repository information (hardcoded)
  const REPO_OWNER = 'Fantinati-Anthony';
  const REPO_NAME = 'Chrome-Addons';
  const REPO_BRANCH = 'main';
  const ADDON_PATH = 'blazing-toolkit';

  const DB_NAME = 'BlazingToolkitDB';
  const DB_STORE = 'dirHandles';
  const DB_KEY = 'extensionFolder';

  let updateModal = null;
  let savedDirHandle = null;

  // ========== IndexedDB for Directory Handle ==========
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE);
        }
      };
    });
  }

  async function saveDirHandle(handle) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(handle, DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function loadDirHandle() {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const request = tx.objectStore(DB_STORE).get(DB_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.log('No saved directory handle:', e);
      return null;
    }
  }

  async function verifyDirHandle(handle) {
    if (!handle) return false;
    try {
      // Check if we still have permission
      const permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        // Verify manifest.json exists
        await handle.getFileHandle('manifest.json');
        return true;
      }
      // Try to request permission
      const newPermission = await handle.requestPermission({ mode: 'readwrite' });
      if (newPermission === 'granted') {
        await handle.getFileHandle('manifest.json');
        return true;
      }
      return false;
    } catch (e) {
      console.log('Directory handle verification failed:', e);
      return false;
    }
  }

  // Create and show the update modal
  function showUpdateModal() {
    if (updateModal) {
      updateModal.style.display = 'flex';
      return;
    }

    updateModal = document.createElement('div');
    updateModal.id = 'update-modal';
    updateModal.innerHTML = `
      <div class="update-modal-overlay"></div>
      <div class="update-modal-content">
        <h2>Mise a jour automatique</h2>
        <div id="update-step-0" class="update-step">
          <p><strong>Verification du dossier...</strong></p>
          <p class="update-hint">Verification des permissions...</p>
        </div>
        <div id="update-step-1" class="update-step">
          <p><strong>Etape 1:</strong> Selectionnez le dossier de l'extension</p>
          <p class="update-hint">Naviguez vers le dossier <code>blazing-toolkit</code> sur votre disque.</p>
          <button id="btn-select-folder" class="update-modal-btn">Selectionner le dossier</button>
        </div>
        <div id="update-step-1-saved" class="update-step">
          <p><strong>Dossier detecte:</strong></p>
          <p id="saved-folder-name" class="update-hint" style="background:#f0f0f0;padding:8px;border-radius:4px;font-family:monospace;"></p>
          <button id="btn-use-saved-folder" class="update-modal-btn">Mettre a jour</button>
          <button id="btn-force-update" class="update-modal-btn" style="background:#e67e22;margin-top:8px;">Forcer la MAJ complete</button>
          <button id="btn-change-folder" class="update-modal-btn" style="background:#95a5a6;margin-top:8px;">Changer de dossier</button>
        </div>
        <div id="update-step-2" class="update-step">
          <p><strong>Etape 2:</strong> Telechargement en cours...</p>
          <div class="update-progress">
            <div class="update-progress-bar" id="update-progress-bar"></div>
          </div>
          <p id="update-progress-text">Preparation...</p>
          <p id="update-file-count" class="update-hint"></p>
        </div>
        <div id="update-step-3" class="update-step">
          <p><strong>Etape 3:</strong> Mise a jour terminee!</p>
          <p class="update-hint">L'extension va se recharger automatiquement.</p>
          <p id="update-summary" class="update-hint"></p>
          <button id="btn-reload-extension" class="update-modal-btn success">Recharger maintenant</button>
        </div>
        <div id="update-error" class="update-step error">
          <p><strong>Erreur:</strong></p>
          <p id="update-error-text"></p>
          <button id="btn-close-modal" class="update-modal-btn">Fermer</button>
        </div>
        <button id="btn-cancel-update" class="update-modal-close">✕</button>
      </div>
    `;

    document.body.appendChild(updateModal);
    addModalStyles();
    attachModalEvents();
  }

  // Add CSS styles for the modal
  function addModalStyles() {
    if (document.getElementById('update-modal-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'update-modal-styles';
    styles.textContent = `
      #update-modal {
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        align-items: center;
        justify-content: center;
      }
      .update-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
      }
      .update-modal-content {
        position: relative;
        background: white;
        border-radius: 12px;
        padding: 24px;
        width: 340px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      }
      .update-modal-content h2 {
        margin: 0 0 20px;
        font-size: 18px;
        color: #2c3e50;
      }
      .update-step {
        display: none;
      }
      .update-step.active {
        display: block;
      }
      .update-step p {
        margin: 10px 0;
        font-size: 13px;
        color: #333;
      }
      .update-hint {
        color: #666 !important;
        font-size: 12px !important;
      }
      .update-hint code {
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
      }
      .update-modal-btn {
        width: 100%;
        padding: 12px;
        border: none;
        background: #3498db;
        color: white;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        margin-top: 15px;
        transition: all 0.2s;
      }
      .update-modal-btn:hover {
        background: #2980b9;
      }
      .update-modal-btn.success {
        background: #27ae60;
      }
      .update-modal-btn.success:hover {
        background: #219a52;
      }
      .update-modal-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 28px;
        height: 28px;
        border: none;
        background: #f0f0f0;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        color: #666;
      }
      .update-modal-close:hover {
        background: #e0e0e0;
      }
      .update-progress {
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        margin: 15px 0;
      }
      .update-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #3498db, #2ecc71);
        border-radius: 4px;
        width: 0%;
        transition: width 0.3s;
      }
      #update-progress-text {
        text-align: center;
        font-size: 12px !important;
        color: #666 !important;
      }
      #update-file-count {
        text-align: center;
        margin-top: 5px !important;
      }
      #update-summary {
        text-align: center;
        color: #27ae60 !important;
      }
      .update-step.error p {
        color: #e74c3c;
      }
      #update-error-text {
        background: #fdf2f2;
        padding: 10px;
        border-radius: 4px;
        font-size: 12px !important;
        word-break: break-word;
      }
    `;
    document.head.appendChild(styles);
  }

  // Attach event listeners to modal buttons
  function attachModalEvents() {
    document.getElementById('btn-select-folder').addEventListener('click', () => selectFolderAndUpdate(false));
    document.getElementById('btn-use-saved-folder').addEventListener('click', () => runUpdateWithHandle(savedDirHandle, false));
    document.getElementById('btn-force-update').addEventListener('click', () => runUpdateWithHandle(savedDirHandle, true));
    document.getElementById('btn-change-folder').addEventListener('click', () => selectFolderAndUpdate(false));
    document.getElementById('btn-reload-extension').addEventListener('click', () => {
      chrome.runtime.reload();
    });
    document.getElementById('btn-cancel-update').addEventListener('click', hideModal);
    document.getElementById('btn-close-modal').addEventListener('click', hideModal);
  }

  // Hide the modal
  function hideModal() {
    if (updateModal) {
      updateModal.style.display = 'none';
    }
  }

  // Show a specific step
  function showStep(stepId) {
    document.querySelectorAll('.update-step').forEach(step => {
      step.classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
  }

  // Show error
  function showError(message) {
    document.getElementById('update-error-text').textContent = message;
    showStep('update-error');
  }

  // Update progress
  function updateProgress(percent, text, fileCount = '') {
    document.getElementById('update-progress-bar').style.width = percent + '%';
    document.getElementById('update-progress-text').textContent = text;
    document.getElementById('update-file-count').textContent = fileCount;
  }

  // Build raw file URL
  function buildRawUrl(filePath) {
    return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${filePath}`;
  }

  // Get the latest commit SHA for the branch
  async function getLatestCommitSha() {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${REPO_BRANCH}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data.sha;
  }

  // Get changed files between two commits using Compare API
  async function getChangedFiles(baseSha, headSha) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/compare/${baseSha}...${headSha}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!response.ok) {
      // If compare fails, return null to trigger full update
      console.warn('Compare API failed, will do full update');
      return null;
    }

    const data = await response.json();
    const extensionPath = ADDON_PATH + '/';

    // Filter only files in our addon folder
    const changedFiles = data.files
      .filter(file => file.filename.startsWith(extensionPath))
      .filter(file => file.status !== 'removed') // Don't include deleted files
      .map(file => ({
        path: file.filename.replace(extensionPath, ''),
        fullPath: file.filename,
        status: file.status // added, modified, renamed
      }));

    return changedFiles;
  }

  // Get ALL files (for first install or when compare fails)
  async function getAllFiles() {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${REPO_BRANCH}?recursive=1`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const extensionPath = ADDON_PATH + '/';

    const files = data.tree
      .filter(item => {
        if (item.type !== 'blob') return false;
        if (!item.path.startsWith(extensionPath)) return false;
        return true;
      })
      .map(item => ({
        path: item.path.replace(extensionPath, ''),
        fullPath: item.path,
        status: 'added'
      }));

    return files;
  }

  // Select folder and start update
  async function selectFolderAndUpdate(skipSavedCheck = false) {
    try {
      // Check if File System Access API is available
      if (!window.showDirectoryPicker) {
        showError('Votre navigateur ne supporte pas l\'API File System Access. Utilisez Chrome 86+.');
        return;
      }

      // Ask user to select the extension folder
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      // Verify it's the right folder by checking for manifest.json
      try {
        await dirHandle.getFileHandle('manifest.json');
      } catch (e) {
        showError('Ce dossier ne semble pas etre le dossier de l\'extension. Verifiez que manifest.json existe.');
        return;
      }

      // Save the handle for future use
      await saveDirHandle(dirHandle);
      savedDirHandle = dirHandle;

      // Run the update
      await runUpdateWithHandle(dirHandle, false);

    } catch (e) {
      if (e.name === 'AbortError') {
        hideModal();
      } else {
        console.error('Update error:', e);
        showError(e.message || 'Une erreur est survenue');
      }
    }
  }

  // Run update with a given directory handle
  async function runUpdateWithHandle(dirHandle, forceFullUpdate = false) {
    try {
      // Start download
      showStep('update-step-2');
      updateProgress(0, 'Analyse des modifications...');

      // Get the latest commit SHA
      const latestSha = await getLatestCommitSha();

      // Get stored commit SHA from last update
      const storage = await chrome.storage.local.get(['lastUpdateCommitSha']);
      const lastSha = storage.lastUpdateCommitSha;

      let files;
      let isFullUpdate = false;

      // Force full update - clear stored SHA and download everything
      if (forceFullUpdate) {
        isFullUpdate = true;
        await chrome.storage.local.remove(['lastUpdateCommitSha']);
        updateProgress(10, 'MAJ forcee - tous les fichiers...');
        files = await getAllFiles();
      } else if (lastSha && lastSha !== latestSha) {
        // Try to get only changed files
        updateProgress(10, 'Recuperation des fichiers modifies...');
        files = await getChangedFiles(lastSha, latestSha);

        if (!files) {
          // Compare failed, do full update
          isFullUpdate = true;
          updateProgress(10, 'Recuperation de tous les fichiers...');
          files = await getAllFiles();
        }
      } else if (!lastSha) {
        // First update - get all files
        isFullUpdate = true;
        updateProgress(10, 'Premiere mise a jour - tous les fichiers...');
        files = await getAllFiles();
      } else {
        // Same SHA - nothing to update
        updateProgress(100, 'Deja a jour!');
        document.getElementById('update-summary').textContent = 'Aucun fichier a mettre a jour.';
        setTimeout(() => showStep('update-step-3'), 500);
        return;
      }

      if (!files || files.length === 0) {
        updateProgress(100, 'Aucun fichier a mettre a jour!');
        document.getElementById('update-summary').textContent = 'Aucun fichier modifie.';
        setTimeout(() => showStep('update-step-3'), 500);
        return;
      }

      // Show file count
      const fileCountText = isFullUpdate
        ? `${files.length} fichiers (mise a jour complete)`
        : `${files.length} fichier(s) modifie(s)`;

      updateProgress(15, 'Telechargement...', fileCountText);

      // Download and write each file
      const totalFiles = files.length;
      let processedFiles = 0;
      let errors = 0;

      for (const file of files) {
        const percent = 15 + Math.round((processedFiles / totalFiles) * 80);
        updateProgress(
          percent,
          `${file.path}`,
          `${processedFiles + 1}/${totalFiles} fichiers`
        );

        try {
          const content = await downloadFile(file.fullPath);
          await writeFile(dirHandle, file.path, content);
          processedFiles++;
        } catch (e) {
          console.error(`Error processing ${file.path}:`, e);
          errors++;
        }
      }

      // Save the new commit SHA
      await chrome.storage.local.set({ lastUpdateCommitSha: latestSha });

      updateProgress(100, 'Mise a jour terminee!');

      // Show summary
      const summary = errors > 0
        ? `${processedFiles} fichiers mis a jour, ${errors} erreurs`
        : `${processedFiles} fichiers mis a jour`;
      document.getElementById('update-summary').textContent = summary;

      setTimeout(() => {
        showStep('update-step-3');
      }, 500);

    } catch (e) {
      if (e.name === 'AbortError') {
        hideModal();
      } else {
        console.error('Update error:', e);
        showError(e.message || 'Une erreur est survenue');
      }
    }
  }

  // Download a file from raw.githubusercontent.com
  async function downloadFile(fullPath) {
    const url = buildRawUrl(fullPath);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download: ${fullPath} (${response.status})`);
    }

    return await response.blob();
  }

  // Write file to directory (handles nested paths)
  async function writeFile(dirHandle, filePath, content) {
    const parts = filePath.split('/');
    const fileName = parts.pop();

    let currentDir = dirHandle;
    for (const part of parts) {
      currentDir = await currentDir.getDirectoryHandle(part, { create: true });
    }

    const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  return {
    startUpdate: async function() {
      showUpdateModal();
      showStep('update-step-0');

      // Try to load saved directory handle
      const handle = await loadDirHandle();

      if (handle) {
        const isValid = await verifyDirHandle(handle);
        if (isValid) {
          savedDirHandle = handle;
          document.getElementById('saved-folder-name').textContent = handle.name;
          showStep('update-step-1-saved');
          return;
        }
      }

      // No valid saved handle, show folder selection
      showStep('update-step-1');
    }
  };
})();
