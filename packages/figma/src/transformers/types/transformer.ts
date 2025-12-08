import { TokenCollection, TransformerResult } from '../../types';
import type { OutputMode } from '@eggstractor/common';

export interface TransformerConfig {
  generateSemanticColorUtilities?: boolean;
  outputMode?: OutputMode;
}

export type Transformer = (
  tokens: TokenCollection,
  useCombinatorialParsing: boolean,
  generateSemanticColorUtilities?: boolean,
  outputMode?: OutputMode,
) => TransformerResult;
