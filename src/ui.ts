import { highlightCode } from './highlighter';
import github from './github';

const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
const createPRBtn = document.getElementById('createPRBtn') as HTMLButtonElement;
const repoPathInput = document.getElementById('repoPath') as HTMLInputElement;
const filePathInput = document.getElementById('filePath') as HTMLInputElement;
const branchNameInput = document.getElementById('branchName') as HTMLInputElement;
let generatedScss = '';

// Load saved config when UI opens
window.onload = () => {
  parent.postMessage({ pluginMessage: { type: 'load-config' } }, '*');
};

// Save config when inputs change
repoPathInput.onchange = saveConfig;
filePathInput.onchange = saveConfig;
branchNameInput.onchange = saveConfig;
function saveConfig() {
  parent.postMessage({
    pluginMessage: {
      type: 'save-config',
      repoPath: repoPathInput.value,
      filePath: filePathInput.value,
      branchName: branchNameInput.value
    }
  }, '*');
}

generateBtn.onclick = () => {
  parent.postMessage({ pluginMessage: { type: 'generate-styles' } }, '*');
};

createPRBtn.onclick = () => {
  createPRBtn.disabled = true;
  const statusEl = document.getElementById('status') as HTMLSpanElement;
  statusEl.textContent = 'Creating PR...';

  const githubToken = (document.getElementById('githubToken') as HTMLInputElement).value;
  const repoPath = (document.getElementById('repoPath') as HTMLInputElement).value;
  const filePath = (document.getElementById('filePath') as HTMLInputElement).value;
  const branchName = (document.getElementById('branchName') as HTMLInputElement).value;

  if (!githubToken || !repoPath || !filePath || !branchName || !generatedScss) {
    alert('Please fill in all fields and generate SCSS first');
    createPRBtn.disabled = false;
    statusEl.textContent = '';
    return;
  }

  parent.postMessage({
    pluginMessage: {
      type: 'create-pr',
      githubToken,
      repoPath,
      filePath,
      branchName,
      content: generatedScss
    }
  }, '*');
};

// Update the message handler
window.onmessage = async (event) => {
  if (event.data.pluginMessage.type === 'output-styles') {
    const output = document.getElementById('output') as HTMLDivElement;
    const highlightedCode = highlightCode(event.data.pluginMessage.styles);
    output.innerHTML = `<pre><code class="hljs language-scss">${highlightedCode}</code></pre>`;
    generatedScss = event.data.pluginMessage.styles;
  } else if (event.data.pluginMessage.type === 'config-loaded' && event.data.pluginMessage.config) {
    repoPathInput.value = event.data.pluginMessage.config.repoPath || '';
    filePathInput.value = event.data.pluginMessage.config.filePath || '';
    branchNameInput.value = event.data.pluginMessage.config.branchName || '';
  } else if (event.data.pluginMessage.type === 'pr-created') {
    const statusEl = document.getElementById('status') as HTMLSpanElement;
    statusEl.innerHTML = `PR created! <a href="${event.data.pluginMessage.prUrl}" target="_blank">View PR</a>`;
    createPRBtn.disabled = false;
  } else if (event.data.pluginMessage.type === 'error') {
    createPRBtn.disabled = false;
    alert(`Error: ${event.data.pluginMessage.message}`);
  }
};