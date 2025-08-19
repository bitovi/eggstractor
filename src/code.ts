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
import { MAX_PROGRESS_PERCENTAGE } from './services/utilities';
import { TokenCollection } from './types';

// Store the generated SCSS
let generatedScss: string = '';

// Show the UI with resizable window
figma.showUI(__html__, {
  width: 600,
  height: 1200,
  themeColors: true,
  title: 'Eggstractor',
});

/**
 * Used to track each update to the ui
 */
let progressUpdateIdCount = 0;

/**
 * Collection of updates to the UI. Needed for continuing commutations after the
 * UI has finished updating.
 */
const progressUpdateTasks: Record<number, null | (() => void)> = {};

/**
 * Communicate to the UI that progress has been made. When promise resolves, the
 * UI has received the update.
 */
function updateProgress(progress: number, message: string): Promise<void> {
  const id = ++progressUpdateIdCount;

  // Allow promise to resolve once UI has received the update
  let resolve: () => void, reject: () => void;
  const progressUpdated = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  progressUpdateTasks[id] = () => {
    resolve();
  };

  figma.ui.postMessage({
    type: 'progress-update',
    progress,
    message,
    id,
  });

  return progressUpdated;
}

function transformTokensToStylesheet(
  tokens: Readonly<TokenCollection>,
  format: 'scss' | 'css' | 'tailwind-scss' | 'tailwind-v4',
): TransformerResult {
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

/* Main generation function */
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
      void updateProgress(progress, message);
    }
  });

  await updateProgress(MAX_PROGRESS_PERCENTAGE, 'Transforming…');

  const stylesheet = await transformTokensToStylesheet(tokens, format);

  figma.ui.postMessage({
    type: 'progress-end',
  });

  return stylesheet;
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
  } else if (msg.type === 'progress-updated') {
    const resolve = progressUpdateTasks[msg.id];
    if (!resolve) {
      throw new Error(`No progress update handler found for ID: ${msg.id}`);
    }
    resolve();
    // Clear the reference to task after resolving
    progressUpdateTasks[msg.id] = null;
  } else {
    throw new Error(`Unknown message type: ${msg.type}`);
  }
};
