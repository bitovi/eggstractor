import type { StylesheetFormat } from './stylesheet-format';

export type MessageType =
  | 'load-config'
  | 'create-pr'
  | 'save-config'
  | 'generate-styles'
  | 'export-test-data'
  | 'select-node'
  | 'progress-updated'
  | 'set-route';

type BaseMessageToMainThreadPayload = {
  type: MessageType;
};

/**
 * Retrieves saved configuration.
 */
export interface LoadConfigPayload extends BaseMessageToMainThreadPayload {
  type: 'load-config';
}

/**
 * Creates GitHub pull request with generated styles.
 */
export interface CreatePRPayload extends BaseMessageToMainThreadPayload {
  type: 'create-pr';
  githubToken: string;
  filePath: string;
  repoPath: string;
  branchName: string;
}

/**
 * Persists GitHub configuration and tokens.
 */
export interface SaveConfigPayload extends Omit<CreatePRPayload, 'type'> {
  type: 'save-config';
  format: StylesheetFormat;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
}

/**
 * Initiates the complete style generation pipeline.
 */
export interface GenerateStylesPayload extends BaseMessageToMainThreadPayload {
  type: 'generate-styles';
  format: StylesheetFormat;
  useCombinatorialParsing: boolean;
  generateSemanticColorUtilities: boolean;
}

/**
 * Selects and focuses on a specific Figma node.
 */
export interface SelectNodePayload extends BaseMessageToMainThreadPayload {
  type: 'select-node';
  nodeId: string;
}

/**
 * Acknowledges progress update receipt. This is to notify the main thread
 * that the worker has received and is processing the progress update.
 */
export interface ProgressUpdatedPayload extends BaseMessageToMainThreadPayload {
  type: 'progress-updated';
  id: number;
}

/**
 * Exports Figma data as a downloadable JSON file for testing purposes
 */
export interface ExportTestDataPayload extends BaseMessageToMainThreadPayload {
  type: 'export-test-data';
}

/**
 * Acknowledges progress update receipt. This is to notify the main thread
 * that the worker has received and is processing the progress update.
 */
export interface RouteSetPayload extends BaseMessageToMainThreadPayload {
  type: 'set-route';
  path: string;
}

export type MessageToMainThreadPayload =
  | LoadConfigPayload
  | CreatePRPayload
  | SaveConfigPayload
  | GenerateStylesPayload
  | SelectNodePayload
  | ProgressUpdatedPayload
  | ExportTestDataPayload
  | RouteSetPayload;
