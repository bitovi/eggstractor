import { TokenCollection, TransformerResult } from '../../types';

export type Transformer = (
  tokens: TokenCollection,
  useCombinatorialParsing: boolean,
) => TransformerResult;
