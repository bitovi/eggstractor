/**
 * UI-specific types for the Eggstractor plugin
 * Extends base types from @types for UI components
 */

export interface PluginConfig {
  githubToken: string;
  repoPath: string;
  filePath: string;
  branchName: string;
  format: 'scss' | 'css' | 'tailwind-scss' | 'tailwind-v4';
}

export interface PluginState {
  isGenerating: boolean;
  generatedContent: string | null;
  warnings: string[];
  errors: string[];
  progress: ProgressState | null;
}

export interface ProgressState {
  percentage: number;
  message: string;
}

export interface PluginMessage {
  type: string;
  [key: string]: any;
}

export interface PluginInterfaceProps extends PluginState {
  config: PluginConfig;
  onConfigChange: (config: Partial<PluginConfig>) => void;
  onGenerateStyles: () => void;
  onCreatePR: () => void;
  onExportTestData: () => void;
}

export interface FormFieldProps {
  id: string;
  label: string;
  type: 'text' | 'password' | 'select';
  value: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export interface ProgressBarProps {
  progress: ProgressState;
}

export interface StatusDisplayProps {
  warnings: string[];
  errors: string[];
  generatedContent: string | null;
}
