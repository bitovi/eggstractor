import { collectTokens } from './services';
import {
  transformToScss,
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
  let lastProgressTime = 0;
  const tokens = await collectTokens((progress, message) => {
    const now = Date.now();

    if (now - lastProgressTime > 500) {
      lastProgressTime = now;
      figma.ui.postMessage({
        type: 'generation-progress',
        percentage: progress,
        message,
      });
    }
  });

  figma.ui.postMessage({
    type: 'generation-progress',
    percentage: 100,
    message: 'Complete!',
  });

  switch (format) {
    case 'scss':
      return transformToScss(tokens);
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
    try {
      figma.ui.postMessage({ type: 'generation-started' });

      const result = await generateStyles(msg.format || 'scss');
      generatedScss = result.result; // Store just the generated code

      figma.ui.postMessage({
        type: 'generation-complete',
        content: result.result,
        warnings: result.warnings,
        errors: result.errors,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      figma.ui.postMessage({
        type: 'generation-error',
        error: message,
      });
    }
  } else if (msg.type === 'save-config') {
    try {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      figma.ui.postMessage({
        type: 'generation-error',
        error: `Failed to save config: ${message}`,
      });
    }
  } else if (msg.type === 'load-config') {
    try {
      const [githubToken, branchName, config] = await Promise.all([
        Github.getToken(),
        Github.getBranchName(),
        Github.getGithubConfig(),
      ]);

      const configToLoad = { ...config };
      if (githubToken) configToLoad.githubToken = githubToken;
      if (branchName) configToLoad.branchName = branchName;

      figma.ui.postMessage({ type: 'config-loaded', config: configToLoad });
    } catch (error) {
      // Silently fail config loading, just send empty config
      figma.ui.postMessage({
        type: 'config-loaded',
        config: {
          githubToken: '',
          repoPath: '',
          filePath: '',
          branchName: '',
          format: 'scss',
        },
      });
    }
  } else if (msg.type === 'create-pr') {
    try {
      figma.ui.postMessage({ type: 'pr-creation-started' });

      const config = await Github.getGithubConfig();
      const token = await Github.getToken();
      const branchName = await Github.getBranchName();

      const result = await Github.createGithubPR(
        token || msg.githubToken,
        config.repoPath || msg.repoPath,
        config.filePath || msg.filePath,
        branchName || msg.branchName,
        generatedScss,
      );

      figma.ui.postMessage({
        type: 'pr-creation-complete',
        prUrl: result.prUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      figma.ui.postMessage({
        type: 'pr-creation-error',
        error: message,
      });
    }
  } else if (msg.type === 'export-test-data') {
    try {
      const testData = await serializeFigmaData(figma.currentPage);
      figma.ui.postMessage({
        type: 'test-data-exported',
        data: JSON.stringify(testData, null, 2),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      figma.ui.postMessage({
        type: 'generation-error',
        error: `Failed to export test data: ${message}`,
      });
    }
  } else if (msg.type === 'select-node') {
    const node = await figma.getNodeByIdAsync(msg.nodeId);
    if (node && 'type' in node) {
      // This checks if it's a SceneNode
      figma.currentPage.selection = [node as SceneNode];
      figma.viewport.scrollAndZoomIntoView([node]);
    }
  }
};
