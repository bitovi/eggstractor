import './ui.css';
import { highlightCode } from './highlighter';

window.onload = () => {
  const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
  const createPRBtn = document.getElementById('createPRBtn') as HTMLButtonElement;
  const repoPathInput = document.getElementById('repoPath') as HTMLInputElement;
  const filePathInput = document.getElementById('filePath') as HTMLInputElement;
  const branchNameInput = document.getElementById('branchName') as HTMLInputElement;
  const githubTokenInput = document.getElementById('githubToken') as HTMLInputElement;
  const devControls = document.getElementById('devControls') as HTMLDivElement;
  const formatSelect = document.getElementById('formatSelect') as HTMLSelectElement;
  let generatedScss = false;

  // Load saved config when UI opens

  parent.postMessage({ pluginMessage: { type: 'load-config' } }, '*');
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    // devControls.style.display = 'block';
    const exportBtn = document.getElementById('exportTestDataBtn');
    if (exportBtn) {
      exportBtn.style.display = 'inline-block';
    }
  }

  // Save config when inputs change
  repoPathInput.onchange = saveConfig;
  filePathInput.onchange = saveConfig;
  branchNameInput.onchange = saveConfig;
  githubTokenInput.onchange = saveConfig;
  function saveConfig() {
    parent.postMessage({
      pluginMessage: {
        type: 'save-config',
        repoPath: repoPathInput.value,
        filePath: filePathInput.value,
        branchName: branchNameInput.value,
        githubToken: githubTokenInput.value
      }
    }, '*');
  }

  generateBtn.onclick = () => {
    const format = formatSelect.value;
    parent.postMessage({
      pluginMessage: {
        type: 'generate-styles',
        format
      }
    }, '*');
  };

  createPRBtn.onclick = () => {
    createPRBtn.disabled = true;
    const statusEl = document.getElementById('status') as HTMLSpanElement;
    statusEl.textContent = 'Creating PR...';

    const githubToken = (document.getElementById('githubToken') as HTMLInputElement).value;
    const repoPath = (document.getElementById('repoPath') as HTMLInputElement).value;
    const filePath = (document.getElementById('filePath') as HTMLInputElement).value;
    const branchName = (document.getElementById('branchName') as HTMLInputElement).value;

    const checks = [
      { value: githubToken, warning: "Please add a github token" },
      { value: repoPath, warning: "Please add path to the repository" },
      { value: filePath, warning: "Please add the path to your generated SCSS file" },
      { value: branchName, warning: "Please specify the name of the branch to create or add the commit to" },
      { value: generatedScss, warning: "Please generate the SCSS first" }
    ];

    const missing = checks.filter(check => !check.value)
    if (missing.length) {
      alert(missing[0].warning);
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
      }
    }, '*');
  };

  // Add this function to handle copying
  function copyToClipboard(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  document.getElementById('exportTestDataBtn')?.addEventListener('click', () => {
    parent.postMessage({ pluginMessage: { type: 'export-test-data' } }, '*');
  });

  // Update the message handler
  window.onmessage = async (event) => {
    const msg = event.data.pluginMessage;
    switch (msg.type) {
      case 'output-styles':
        generatedScss = true;
        const warnings = document.getElementById('warnings') as HTMLDivElement;
        const output = document.getElementById('output') as HTMLDivElement;
        const highlightedCode = highlightCode(msg.styles);

        if (msg.warnings?.length) {
          const warningsHtml = `
          <details open>
            <summary>⚠️ Warnings (${msg.warnings.length}) ⚠️</summary>
            <ul>
              ${msg.warnings.map(warning => {
            const nodeMatch = warning.match(/\(node: ([^)]+)\)/);
            const nodeId = nodeMatch?.[1];
            return nodeId
              ? `<li class="warning-item"><a href="#" data-node-id="${nodeId}">${warning}</a></li>`
              : `<li class="warning-item">${warning}</li>`;
          }).join('')}
            </ul>
          </details>`;
          warnings.innerHTML = warningsHtml;
          warnings.style.display = 'block';
        } else {
          warnings.style.display = 'none';
        }

        // Add click handler for node links
        warnings.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'A') {
            e.preventDefault();
            const nodeId = target.dataset.nodeId;
            if (nodeId) {
              parent.postMessage({
                pluginMessage: {
                  type: 'select-node',
                  nodeId
                }
              }, '*');
            }
          }
        });

        output.innerHTML = `
        <div class="output-header">
          <button id="copyButton" class="copy-button" aria-label="Copy to clipboard" title="Copy to clipboard">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <title>Copy icon</title>
              <path d="M2 4H1V14H11V13H2V4Z" fill="currentColor"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M4 1H14V11H4V1ZM5 2H13V10H5V2Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <pre>${highlightedCode}</pre>
      `;

        const copyButton = document.getElementById('copyButton');
        if (copyButton) {
          copyButton.onclick = () => {
            copyToClipboard(msg.styles);
            copyButton.setAttribute('aria-label', 'Copied!');
            copyButton.setAttribute('title', 'Copied!');
            copyButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <title>Check mark icon</title>
              <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" fill="currentColor"/>
            </svg>
          `;
            setTimeout(() => {
              copyButton.setAttribute('aria-label', 'Copy to clipboard');
              copyButton.setAttribute('title', 'Copy to clipboard');
              copyButton.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <title>Copy icon</title>
                <path d="M2 4H1V14H11V13H2V4Z" fill="currentColor"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4 1H14V11H4V1ZM5 2H13V10H5V2Z" fill="currentColor"/>
              </svg>
            `;
            }, 2000);
          };
        }
        break;
      case 'config-loaded':
        repoPathInput.value = event.data.pluginMessage.config.repoPath || '';
        filePathInput.value = event.data.pluginMessage.config.filePath || '';
        branchNameInput.value = event.data.pluginMessage.config.branchName || '';
        githubTokenInput.value = event.data.pluginMessage.config.githubToken || '';
        break;
      case 'pr-created':
        const statusEl = document.getElementById('status') as HTMLSpanElement;
        statusEl.innerHTML = `PR created! <a href="${event.data.pluginMessage.prUrl}" target="_blank">View PR</a>`;
        createPRBtn.disabled = false;
        break;
      case 'error':
        createPRBtn.disabled = false;
        alert(`Error: ${event.data.pluginMessage.message}`);
        break;
      case 'test-data-exported':
        // Create and trigger download
        const blob = new Blob([msg.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'figma-test-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;
    }
  };
};