import { StylesheetFormat } from "./stylesheet-format";

export type MessageType =
  | 'load-config'
  | 'create-pr'
  | 'save-config'
  | 'generate-styles'
  | 'export-test-data'
  | 'select-node'
  | 'progress-updated';

export type BaseMessageToMainThreadPayload = {
  type: MessageType;
};

export interface LoadConfigPayload extends BaseMessageToMainThreadPayload {
  type: 'load-config';
}

export interface CreatePRPayload extends BaseMessageToMainThreadPayload {
  type: 'create-pr';
  githubToken: string;
  filePath: string;
  repoPath: string;
  branchName: string;
}

export interface SaveConfigPayload extends Omit<CreatePRPayload, 'type'> {
  type: 'save-config';
  format: StylesheetFormat;
}

export interface GenerateStylesPayload extends BaseMessageToMainThreadPayload {
  type: 'generate-styles';
  format: StylesheetFormat;
}

export interface SelectNodePayload extends BaseMessageToMainThreadPayload {
  type: 'select-node';
  nodeId: string;
}

export interface ProgressUpdatedPayload extends BaseMessageToMainThreadPayload {
  type: 'progress-updated';
  id: number;
}

export interface ExportTestDataPayload extends BaseMessageToMainThreadPayload {
  type: 'export-test-data';
}

export type MessageToMainThreadPayload =
  | LoadConfigPayload
  | CreatePRPayload
  | SaveConfigPayload
  | GenerateStylesPayload
  | SelectNodePayload
  | ProgressUpdatedPayload
  | ExportTestDataPayload;