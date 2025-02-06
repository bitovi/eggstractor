import type { VariableToken, ProcessedValue } from './tokens';

export interface VariableBindings {
  fills?: VariableAlias | VariableAlias[];
  strokes?: VariableAlias | VariableAlias[];
  strokeWeight?: VariableAlias | VariableAlias[];
  fontSize?: VariableAlias | VariableAlias[];
  fontWeight?: VariableAlias | VariableAlias[];
  fontStyle?: VariableAlias | VariableAlias[];
  lineHeight?: VariableAlias | VariableAlias[];
  letterSpacing?: VariableAlias | VariableAlias[];
  fontFamily?: VariableAlias | VariableAlias[];
  cornerRadius?: VariableAlias | VariableAlias[];
  itemSpacing?: VariableAlias | VariableAlias[];
  gap?: VariableAlias | VariableAlias[];
  paddingTop?: VariableAlias | VariableAlias[];
  paddingRight?: VariableAlias | VariableAlias[];
  paddingBottom?: VariableAlias | VariableAlias[];
  paddingLeft?: VariableAlias | VariableAlias[];
  minWidth?: VariableAlias | VariableAlias[];
  maxWidth?: VariableAlias | VariableAlias[];
  minHeight?: VariableAlias | VariableAlias[];
  maxHeight?: VariableAlias | VariableAlias[];
  opacity?: VariableAlias | VariableAlias[];
}

export interface StyleProcessor {
  property: string;
  bindingKey: keyof VariableBindings | undefined;
  process: (variables: VariableToken[], node?: SceneNode) => Promise<ProcessedValue | null>;
}

export interface TransformerResult {
  result: string;
  warnings: string[];
  errors: string[];
} 