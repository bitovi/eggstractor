import React from 'react';
import { PluginInterfaceProps, PluginConfig } from '../types';
import FormField from './FormField';
import Button from './Button';
import ProgressBar from './ProgressBar';
import StatusDisplay from './StatusDisplay';

/**
 * Main plugin interface component
 * Renders the complete plugin UI following Figma plugin patterns
 */
export default function PluginInterface({
  config,
  isGenerating,
  generatedContent,
  warnings,
  errors,
  progress,
  onConfigChange,
  onGenerateStyles,
  onCreatePR,
  onExportTestData,
}: PluginInterfaceProps): JSX.Element {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="plugin-interface">
      <div className="form-section">
        <FormField
          id="githubToken"
          label="GitHub Token:"
          type="password"
          value={config.githubToken}
          placeholder="Github PAT token"
          onChange={(value: string) => onConfigChange({ githubToken: value })}
        />

        <FormField
          id="repoPath"
          label="Repository (owner/repo):"
          type="text"
          value={config.repoPath}
          placeholder="e.g., bitovi/design-system"
          onChange={(value: string) => onConfigChange({ repoPath: value })}
        />

        <FormField
          id="filePath"
          label="File Path:"
          type="text"
          value={config.filePath}
          placeholder="e.g., src/styles/variables.scss"
          onChange={(value: string) => onConfigChange({ filePath: value })}
        />

        <FormField
          id="branchName"
          label="New Branch Name:"
          type="text"
          value={config.branchName}
          placeholder="e.g., feature/update-scss-variables"
          onChange={(value: string) => {
            // Apply git branch naming guidelines
            const processedValue = value.replace(/^\.|[^-\/.\w]|\/$/g, '-');
            onConfigChange({ branchName: processedValue });
          }}
        />

        <FormField
          id="formatSelect"
          label="Format:"
          type="select"
          value={config.format}
          options={[
            { value: 'scss', label: 'SCSS' },
            { value: 'css', label: 'CSS' },
            { value: 'tailwind-scss', label: '(v3) Tailwind-SCSS' },
            { value: 'tailwind-v4', label: '(v4) Tailwind Layer Utilities' },
          ]}
          onChange={(value: string) => onConfigChange({ format: value as PluginConfig['format'] })}
        />
      </div>

      <div className="button-section">
        <Button onClick={onGenerateStyles} loading={isGenerating} disabled={isGenerating}>
          Generate Styles
        </Button>

        <Button onClick={onExportTestData} variant="secondary">
          Export Test Data
        </Button>

        <Button onClick={onCreatePR} disabled={!generatedContent || isGenerating}>
          Create PR
        </Button>
      </div>

      {progress && <ProgressBar progress={progress} />}

      <StatusDisplay warnings={warnings} errors={errors} generatedContent={generatedContent} />
    </div>
  );
}
