import { collectTokens } from './services/collection.service';
import { transformToScss, transformToCss } from './transformers';
import Github from './github';

// Store the generated SCSS
let generatedScss: string = '';

// Show the UI with resizable window
figma.showUI(__html__, {
  width: 600,
  height: 1200,
  themeColors: true,
  title: "Eggstractor"
});

// Main generation function
async function generateStyles(format: 'scss' | 'css'): Promise<string> {
  const tokens = await collectTokens();
  switch (format) {
    case 'scss':
      return transformToScss(tokens);
    case 'css':
      return transformToCss(tokens);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-styles') {
    const styles = await generateStyles(msg.format || 'scss');
    generatedScss = styles;
    figma.ui.postMessage({ type: 'output-styles', styles });
  } else if (msg.type === 'save-config') {
    await Github.saveUserSettings(msg.githubToken, msg.branchName);
    await Github.saveGithubConfig({
      repoPath: msg.repoPath,
      filePath: msg.filePath,
    });
    figma.ui.postMessage({ type: 'config-saved' });
  } else if (msg.type === 'load-config') {
    const [config, userSettings] = await Promise.all([
      Github.getGithubConfig(),
      Github.getUserSettings()
    ]);
    if (userSettings) {
      config.githubToken = userSettings.token;
      config.branchName = userSettings.branchName;
    }
    figma.ui.postMessage({ type: 'config-loaded', config });
  } else if (msg.type === 'create-pr') {
    try {
      const result = await Github.createGithubPR(
        msg.githubToken,
        msg.repoPath,
        msg.filePath,
        msg.branchName,
        generatedScss
      );
      figma.ui.postMessage({
        type: 'pr-created',
        prUrl: result.prUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      figma.ui.postMessage({ type: 'error', message });
    }
  }
};
