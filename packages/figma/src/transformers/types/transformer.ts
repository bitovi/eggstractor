import { TokenCollection, TransformerResult } from '../../types';

export interface TransformerConfig {
  generateSemanticColorUtilities?: boolean;
}

export type Transformer = (
  tokens: TokenCollection,
  useCombinatorialParsing: boolean,
  config?: TransformerConfig,
) => TransformerResult;
