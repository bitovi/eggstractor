import { collectTokens } from './services';
import {
  transformToScss,
  transformToScssWithInstances,
  transformToCss,
  transformToTailwindLayerUtilityClassV4,
  transformToTailwindSassClass,
} from './transformers';
import Github from './github';
import { serializeFigmaData } from './utils/test.utils';
import { TransformerResult } from './types/processors';

// Store the generated SCSS
let generatedScss: string = '';

// Show the UI with resizable window
figma.showUI(__html__, {
  width: 600,
  height: 1200,
  themeColors: true,
  title: 'Eggstractor',
});

// Main generation function
async function generateStyles(
  format: 'scss' | 'css' | 'tailwind-scss' | 'tailwind-v4',
): Promise<TransformerResult> {
  figma.ui.postMessage({
    type: 'progress-start',
  });

  let lastProgressTime = 0;
  const tokens = await collectTokens((progress, message) => {
    const now = Date.now();

    if (now - lastProgressTime > 500) {
      lastProgressTime = now;
      figma.ui.postMessage({
        type: 'progress-update',
        progress,
        message,
      });
    }
  });

  figma.ui.postMessage({
    type: 'progress-update',
    progress: 100,
    message: 'Complete!',
  });

  switch (format) {
    case 'scss':
      return await transformToScssWithInstances(tokens);
    case 'css':
      return transformToCss(tokens);
    case 'tailwind-scss':
      return transformToTailwindSassClass(tokens);
    case 'tailwind-v4':
      return transformToTailwindLayerUtilityClassV4(tokens);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-styles') {
    const result = await generateStyles(msg.format || 'scss');
    generatedScss = result.result; // Store just the generated code
    figma.ui.postMessage({
      type: 'output-styles',
      styles: result.result,
      warnings: result.warnings,
      errors: result.errors,
    });
  } else if (msg.type === 'save-config') {
    await Promise.all([
      Github.saveToken(msg.githubToken),
      Github.saveBranchName(msg.branchName),
      Github.saveGithubConfig({
        repoPath: msg.repoPath,
        filePath: msg.filePath,
        outputFormat: msg.format || 'scss',
      }),
    ]);
    figma.ui.postMessage({ type: 'config-saved' });
  } else if (msg.type === 'load-config') {
    const [githubToken, branchName, config] = await Promise.all([
      Github.getToken(),
      Github.getBranchName(),
      Github.getGithubConfig(),
    ]);

    if (githubToken || branchName) {
      config.githubToken = githubToken;
      config.branchName = branchName;
    }
    figma.ui.postMessage({ type: 'config-loaded', config });
  } else if (msg.type === 'create-pr') {
    try {
      const result = await Github.createGithubPR(
        msg.githubToken,
        msg.repoPath,
        msg.filePath,
        msg.branchName,
        generatedScss,
      );
      figma.ui.postMessage({
        type: 'pr-created',
        prUrl: result.prUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      figma.ui.postMessage({ type: 'error', message });
    }
  } else if (msg.type === 'export-test-data') {
    const testData = await serializeFigmaData(figma.currentPage);
    figma.ui.postMessage({
      type: 'test-data-exported',
      data: JSON.stringify(testData, null, 2),
    });
  } else if (msg.type === 'select-node') {
    const node = await figma.getNodeByIdAsync(msg.nodeId);
    if (node && 'type' in node) {
      // This checks if it's a SceneNode
      figma.currentPage.selection = [node as SceneNode];
      figma.viewport.scrollAndZoomIntoView([node]);
    }
  }
};
