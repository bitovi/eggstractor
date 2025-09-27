import type { GithubConfig } from './github-config';

export interface BaseMessageToUIPayload {
  type: string;
}

export interface OutputStylesPayload extends BaseMessageToUIPayload {
  type: 'output-styles';
  styles: string;
  warnings: string[];
  errors: string[];
}

export interface ProgressUpdatePayload extends BaseMessageToUIPayload {
  type: 'progress-update';
  progress: number;
  message: string;
  id: number;
}

export interface ProgressStartPayload extends BaseMessageToUIPayload {
  type: 'progress-start';
}

export interface ProgressEndPayload extends BaseMessageToUIPayload {
  type: 'progress-end';
}

export interface ConfigSavedPayload extends BaseMessageToUIPayload {
  type: 'config-saved';
}

export interface ConfigLoadedPayload extends BaseMessageToUIPayload {
  type: 'config-loaded';
  config: Partial<GithubConfig>;
}

export interface PRCreatedPayload extends BaseMessageToUIPayload {
  type: 'pr-created';
  prUrl: string;
}

export interface ErrorPayload extends BaseMessageToUIPayload {
  type: 'error';
  message: string;
}

export interface TestDataExportedPayload extends BaseMessageToUIPayload {
  type: 'test-data-exported';
  /** Stringified json object */
  data: string;
}

export type MessageToUIPayload =
  | OutputStylesPayload
  | ProgressUpdatePayload
  | ProgressStartPayload
  | ProgressEndPayload
  | ConfigSavedPayload
  | ConfigLoadedPayload
  | PRCreatedPayload
  | ErrorPayload
  | TestDataExportedPayload;
