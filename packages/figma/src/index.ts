import { collectTokens } from './services';
import {
  transformToScss,
  transformToCss,
  transformToTailwindLayerUtilityClassV4,
  transformToTailwindSassClass,
} from './transformers';
import Github from './github';
import {
  MessageToUIPayload,
  getValidStylesheetFormat,
  StylesheetFormat,
  MessageToMainThreadPayload,
  GithubConfig,
  OutputMode,
} from '@eggstractor/common';
import { TokenCollection, TransformerResult } from './types';
import { MAX_PROGRESS_PERCENTAGE, serializeFigmaData } from './utils';

const main = async () => {
  const postMessageToUI = (message: MessageToUIPayload) => {
    figma.ui.postMessage(message);
  };

  // Store the generated SCSS
  let generatedScss = '';

  const route: string = (await figma.clientStorage.getAsync('route')) || '/';

  // This is a placeholder found in the index.html file of the UI build
  // that we replace with the initial route to load.
  // This is done to avoid async loading of the initial route in the UI.
  const html = __html__.replace('null; /* __INITIAL_ROUTE_PLACEHOLDER__ */', JSON.stringify(route));

  // Show the UI with resizable window
  figma.showUI(html, {
    width: 600,
    height: 900,
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
    let resolve: () => void;
    const progressUpdated = new Promise<void>((res) => {
      resolve = res;
    });
    progressUpdateTasks[id] = () => {
      resolve();
    };

    postMessageToUI({
      type: 'progress-update',
      progress,
      message,
      id,
    });

    return progressUpdated;
  }

  function transformTokensToStylesheet(
    tokens: Readonly<TokenCollection>,
    format: StylesheetFormat,
    useCombinatorialParsing: boolean,
    generateSemanticColorUtilities: boolean,
    outputMode: OutputMode = 'all',
  ): TransformerResult {
    switch (format) {
      case 'scss':
        return transformToScss(
          tokens,
          useCombinatorialParsing,
          generateSemanticColorUtilities,
          outputMode,
        );
      case 'css':
        return transformToCss(
          tokens,
          useCombinatorialParsing,
          generateSemanticColorUtilities,
          outputMode,
        );
      case 'tailwind-scss':
        return transformToTailwindSassClass(
          tokens,
          useCombinatorialParsing,
          generateSemanticColorUtilities,
          outputMode,
        );
      case 'tailwind-v4':
        return transformToTailwindLayerUtilityClassV4(
          tokens,
          useCombinatorialParsing,
          generateSemanticColorUtilities,
          outputMode,
        );
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /* Main generation function */
  async function generateStyles(
    format: StylesheetFormat,
    useCombinatorialParsing: boolean,
    generateSemanticColorUtilities: boolean,
    outputMode: OutputMode = 'all',
  ): Promise<TransformerResult> {
    postMessageToUI({
      type: 'progress-start',
    });

    let lastProgressTime = 0;
    const tokens = await collectTokens((progress, message) => {
      const now = Date.now();

      if (now - lastProgressTime > 500) {
        lastProgressTime = now;
        void updateProgress(progress, message);
      }
    }, outputMode);

    await updateProgress(MAX_PROGRESS_PERCENTAGE, 'Transforming…');

    const stylesheet = await transformTokensToStylesheet(
      tokens,
      format,
      useCombinatorialParsing,
      generateSemanticColorUtilities,
      outputMode,
    );

    postMessageToUI({
      type: 'progress-end',
    });

    return stylesheet;
  }

  // Listen for messages from the UI
  figma.ui.onmessage = async (msg: MessageToMainThreadPayload) => {
    if (msg.type === 'generate-styles') {
      const result = await generateStyles(
        getValidStylesheetFormat(msg.format),
        msg.useCombinatorialParsing,
        msg.generateSemanticColorUtilities,
        msg.outputMode ?? 'all',
      );
      generatedScss = result.result; // Store just the generated code
      postMessageToUI({
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
          format: getValidStylesheetFormat(msg.format),
          useCombinatorialParsing: msg.useCombinatorialParsing,
          generateSemanticColorUtilities: msg.generateSemanticColorUtilities,
          outputMode: msg.outputMode,
        }),
      ]);
      postMessageToUI({ type: 'config-saved' });
    } else if (msg.type === 'load-config') {
      const [githubToken, branchName, config] = await Promise.all([
        Github.getToken(),
        Github.getBranchName(),
        Github.getGithubConfig(),
      ]);

      const modifiedConfig: Partial<GithubConfig> = config || {};

      // If there are any changes to the config, add them and remove any missing ones
      if (githubToken || branchName) {
        modifiedConfig.githubToken = githubToken;
        modifiedConfig.branchName = branchName;
      }

      postMessageToUI({ type: 'config-loaded', config: modifiedConfig });
    } else if (msg.type === 'create-pr') {
      try {
        const result = await Github.createGithubPR(
          msg.githubToken,
          msg.repoPath,
          msg.filePath,
          msg.branchName,
          generatedScss,
        );
        postMessageToUI({
          type: 'pr-created',
          prUrl: result.prUrl,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        postMessageToUI({ type: 'error', message });
      }
    } else if (msg.type === 'export-test-data') {
      const testData = await serializeFigmaData(figma.currentPage);
      postMessageToUI({
        type: 'test-data-exported',
        data: JSON.stringify(testData, null, 2),
      });
    } else if (msg.type === 'select-node') {
      const node = await figma.getNodeByIdAsync(msg.nodeId);
      if (node && 'type' in node) {
        // This checks if it's a SceneNode
        // TODO This doesn't properly verify that it's a SceneNode
        // we should stick to BaseNode | (BaseNode & ChildrenMixin)
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
    } else if (msg.type === 'set-route') {
      void figma.clientStorage.setAsync('route', msg.path);
    } else {
      throw new Error(
        `Unknown message type: ${'type' in msg ? (msg as { type: unknown }).type : msg}`,
      );
    }
  };
};

main();
