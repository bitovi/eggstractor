import { useState, useEffect, useCallback } from 'react';
import { PluginConfig, PluginState, PluginMessage, PluginInterfaceProps } from '../types';

/**
 * Custom hook for managing plugin data and communication with main thread
 * Follows Figma plugin message passing patterns
 */
export function usePluginData(): PluginInterfaceProps {
  const [config, setConfig] = useState<PluginConfig>({
    githubToken: '',
    repoPath: '',
    filePath: '',
    branchName: '',
    format: 'scss',
  });

  const [state, setState] = useState<PluginState>({
    isGenerating: false,
    generatedContent: null,
    warnings: [],
    errors: [],
    progress: null,
  });

  // Handle messages from main thread
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { pluginMessage } = event.data;
      if (!pluginMessage) return;

      handlePluginMessage(pluginMessage);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Load saved config on mount
  useEffect(() => {
    sendMessage({ type: 'load-config' });
  }, []);

  const handlePluginMessage = useCallback((message: PluginMessage) => {
    switch (message.type) {
      case 'config-loaded':
        setConfig((prev) => ({ ...prev, ...message.config }));
        break;

      case 'generation-started':
        setState((prev) => ({
          ...prev,
          isGenerating: true,
          generatedContent: null,
          warnings: [],
          errors: [],
        }));
        break;

      case 'generation-progress':
        setState((prev) => ({
          ...prev,
          progress: { percentage: message.percentage, message: message.message },
        }));
        break;

      case 'generation-complete':
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          generatedContent: message.content,
          warnings: message.warnings || [],
          errors: message.errors || [],
          progress: null,
        }));
        break;

      case 'generation-error':
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          errors: [message.error],
          progress: null,
        }));
        break;

      case 'pr-creation-started':
        // Handle PR creation start
        break;

      case 'pr-creation-complete':
        // Handle PR creation completion
        break;

      case 'pr-creation-error':
        setState((prev) => ({
          ...prev,
          errors: [message.error],
        }));
        break;

      case 'test-data-exported':
        // Copy test data to clipboard or show in a text area
        console.log('Test data exported:', message.data);
        // You can add UI to display this data
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }, []);

  const sendMessage = useCallback((message: PluginMessage) => {
    parent.postMessage({ pluginMessage: message }, '*');
  }, []);

  const onConfigChange = useCallback(
    (newConfig: Partial<PluginConfig>) => {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);
      sendMessage({ type: 'save-config', ...updatedConfig });
    },
    [config, sendMessage],
  );

  const onGenerateStyles = useCallback(() => {
    sendMessage({ type: 'generate-styles', format: config.format });
  }, [config.format, sendMessage]);

  const onCreatePR = useCallback(() => {
    // Validate required fields
    const requiredFields = ['githubToken', 'repoPath', 'filePath', 'branchName'];
    const missingFields = requiredFields.filter((field) => !config[field as keyof PluginConfig]);

    if (missingFields.length > 0) {
      setState((prev) => ({
        ...prev,
        errors: [`Missing required fields: ${missingFields.join(', ')}`],
      }));
      return;
    }

    if (!state.generatedContent) {
      setState((prev) => ({
        ...prev,
        errors: ['Please generate styles first'],
      }));
      return;
    }

    sendMessage({ type: 'create-pr' });
  }, [config, state.generatedContent, sendMessage]);

  const onExportTestData = useCallback(() => {
    sendMessage({ type: 'export-test-data' });
  }, [sendMessage]);

  return {
    config,
    ...state,
    onConfigChange,
    onGenerateStyles,
    onCreatePR,
    onExportTestData,
  };
}
