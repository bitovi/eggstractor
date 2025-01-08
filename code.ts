// Show the UI with resizable window
figma.showUI(__html__, { 
  width: 600,
  height: 800,
  themeColors: true,
  title: "SCSS Generator",
});

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function traverseNodes(node: BaseNode, callback: (node: SceneNode) => void) {
  if ('type' in node) {
    callback(node as SceneNode);
  }
  if ('children' in node) {
    for (const child of node.children) {
      traverseNodes(child, callback);
    }
  }
}

async function generateSCSS() {
  const state = createState();

  // Iterate over each selected node on the current page
  traverseNodes(figma.currentPage, (node) => {
    const baseName = sanitizeName(node.name);
    processBackgroundColor(node, baseName, state);
    processFontColor(node, baseName, state);
  });

  // Format mixins with proper indentation
  let styleRules = "// Generated SCSS style rules\n";
  for (const baseName in state.styleRulesByNode) {
    const styles = state.styleRulesByNode[baseName]
      .split('\n')
      .filter(line => line.trim())
      .map(line => `  ${line.trim()}`)
      .join('\n');
    
    if (styles) {
      styleRules += `@mixin ${baseName} {\n${styles}\n}\n\n`;
    }
  }
  
  return state.variableDeclarations + "\n" + styleRules;
}

// Add this function to handle config
async function getGithubConfig() {
  try {
    const savedConfig = figma.root.getPluginData('githubConfig');
    return savedConfig ? JSON.parse(savedConfig) : null;
  } catch (error) {
    console.error('Error reading config:', error);
    return null;
  }
}

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-scss') {
    const scss = await generateSCSS();
    figma.ui.postMessage({ type: 'output-scss', scss });
  } else if (msg.type === 'save-config') {
    await figma.root.setPluginData('githubConfig', JSON.stringify({
      repoPath: msg.repoPath,
      filePath: msg.filePath,
      branchName: msg.branchName
    }));
    figma.ui.postMessage({ type: 'config-saved' });
  } else if (msg.type === 'load-config') {
    const config = await getGithubConfig();
    figma.ui.postMessage({ type: 'config-loaded', config });
  } else if (msg.type === 'create-pr') {
    try {
      const prUrl = await createGithubPR(
        msg.githubToken,
        msg.repoPath,
        msg.filePath,
        msg.branchName,
        msg.content
      );
      figma.ui.postMessage({ type: 'pr-created', prUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      figma.ui.postMessage({ type: 'error', message });
    }
  }
};

interface PluginState {
  generatedVariables: Set<string>;
  styleRulesByNode: { [key: string]: string };
  variableDeclarations: string;
}

function createState(): PluginState {
  return {
    generatedVariables: new Set(),
    styleRulesByNode: {},
    variableDeclarations: "// Generated SCSS variables\n",
  };
}

function sanitizeName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') 
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function processBackgroundColor(node: SceneNode, baseName: string, state: PluginState) {
  if (!('fills' in node) || !node.fills || !Array.isArray(node.fills) || node.fills.length === 0) return;
  
  if (!state.styleRulesByNode[baseName]) {
    state.styleRulesByNode[baseName] = '';
  }
  
  for (const fill of node.fills) {
    if (fill.type === 'SOLID' && fill.visible !== false) {
      const hexColor = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
      const varName = `${baseName}-background-color`;

      if (!state.generatedVariables.has(varName)) {
        state.variableDeclarations += `$${varName}: ${hexColor};\n`;
        state.generatedVariables.add(varName);
      }
  
      const styleLine = `background-color: $${varName};`;
      if (!state.styleRulesByNode[baseName].includes(styleLine)) {
        state.styleRulesByNode[baseName] += styleLine + '\n';
      }
    }
  }
}

function processFontColor(node: SceneNode, baseName: string, state: PluginState) {
  if (node.type !== 'TEXT' || !node.fills || !Array.isArray(node.fills) || node.fills.length === 0) return;
  
  if (!state.styleRulesByNode[baseName]) {
    state.styleRulesByNode[baseName] = '';
  }
  
  const fill = node.fills[0] as Paint;
  if (fill.type === 'SOLID') {
    const hexColor = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
    const varName = `${baseName}-font-color`;
  
    if (!state.generatedVariables.has(varName)) {
      state.variableDeclarations += `$${varName}: ${hexColor};\n`;
      state.generatedVariables.add(varName);
    }
    
    const styleLine = `color: $${varName};`;
    if (!state.styleRulesByNode[baseName].includes(styleLine)) {
      state.styleRulesByNode[baseName] += styleLine + '\n';
    }
  }
}

// Helper function for base64 encoding
function toBase64(str: string): string {
  const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const utf8str = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    function (_, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    }
  );
  let i = 0;
  let result = '';
  while (i < utf8str.length) {
    const char1 = utf8str.charCodeAt(i++);
    const char2 = i < utf8str.length ? utf8str.charCodeAt(i++) : NaN;
    const char3 = i < utf8str.length ? utf8str.charCodeAt(i++) : NaN;

    const enc1 = char1 >> 2;
    const enc2 = ((char1 & 3) << 4) | (char2 >> 4);
    const enc3 = ((char2 & 15) << 2) | (char3 >> 6);
    const enc4 = char3 & 63;

    result += base64chars[enc1] + base64chars[enc2] +
      (isNaN(char2) ? '=' : base64chars[enc3]) +
      (isNaN(char3) ? '=' : base64chars[enc4]);
  }
  return result;
}

async function createGithubPR(token: string, repoPath: string, filePath: string, branchName: string, content: string) {
  const baseUrl = 'https://api.github.com';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json'
  };

  try {
    // Get default branch
    const repoResponse = await fetch(`${baseUrl}/repos/${repoPath}`, {
      headers
    });
    if (!repoResponse.ok) {
      throw new Error(`Repository not found: ${repoPath}`);
    }
    const repoData = await repoResponse.json();
    const defaultBranch = repoData.default_branch;

    // Get the SHA of the default branch
    const refResponse = await fetch(`${baseUrl}/repos/${repoPath}/git/ref/heads/${defaultBranch}`, {
      headers
    });
    if (!refResponse.ok) {
      throw new Error(`Default branch "${defaultBranch}" not found`);
    }
    const refData = await refResponse.json();
    const sha = refData.object.sha;

    // Add this check at the start of createGithubPR
    const testResponse = await fetch(`${baseUrl}/repos/${repoPath}`, {
      headers
    });
    const testData = await testResponse.json();
    console.log('Repository access test:', testData);

    console.log('Creating branch with:', {
      branchName: branchName,
      sha: sha,
      repoPath: repoPath,
      shaLength: sha.length // Should be 40
    });

    // Create new branch
    const createBranchResponse = await fetch(`${baseUrl}/repos/${repoPath}/git/refs`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: sha,
        force: true
      })
    });

    // Add more detailed error logging
    if (!createBranchResponse.ok) {
      const error = await createBranchResponse.json();
      console.error('Branch creation failed:', {
        status: createBranchResponse.status,
        statusText: createBranchResponse.statusText,
        error,
        requestData: {
          ref: `refs/heads/${branchName}`,
          sha,
          repoPath
        }
      });
      
      // Try getting the default branch SHA again to ensure it's valid
      const mainBranchResponse = await fetch(`${baseUrl}/repos/${repoPath}/git/refs/heads/${defaultBranch}`, {
        headers
      });
      const mainBranchData = await mainBranchResponse.json();

      if (error.message.includes('Reference already exists')) {
        // If branch exists, try to update it instead
        const updateResponse = await fetch(`${baseUrl}/repos/${repoPath}/git/refs/heads/${branchName}`, {
          method: 'PATCH',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sha, force: true })
        });
        if (!updateResponse.ok) {
          throw new Error(`Failed to update branch: ${error.message}`);
        }
      } else {
        throw new Error(`Failed to create branch: ${error.message}`);
      }
    }

    const createFileResponse = await fetch(`${baseUrl}/repos/${repoPath}/contents/${filePath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: 'Update SCSS variables from Figma',
        content: toBase64(content),
        branch: branchName
      })
    });
    if (!createFileResponse.ok) {
      const error = await createFileResponse.json();
      throw new Error(`Failed to create file: ${error.message}`);
    }

    // Create PR
    const prResponse = await fetch(`${baseUrl}/repos/${repoPath}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Update SCSS variables from Figma',
        body: 'This PR was automatically created by the Figma SCSS plugin.',
        head: branchName,
        base: defaultBranch
      })
    });
    if (!prResponse.ok) {
      const error = await prResponse.json();
      throw new Error(`Failed to create PR: ${error.message}`);
    }

    const prData = await prResponse.json();
    return prData.html_url;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`GitHub API Error: ${error.message}`);
    }
    throw new Error('GitHub API Error: An unknown error occurred');
  }
}
