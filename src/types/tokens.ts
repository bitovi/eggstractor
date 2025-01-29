export interface DesignToken {
  name: string;
  value: any;
  originalValue?: any;
  metadata?: {
    figmaId?: string;
    variableId?: string;
    variableName?: string;
  };
}

export interface BaseToken {
  type: 'variable' | 'style';
  name: string;
  property: string;
  path: string[];
  metadata?: {
    figmaId?: string;
    variableId?: string;
    variableName?: string;
  };
}

export interface VariableToken extends BaseToken {
  type: 'variable';
  value: string; // SASS variable reference e.g. $color-primary
  rawValue: string; // Actual value e.g. #FF0000
}

export interface StyleToken extends BaseToken {
  type: 'style';
  value: string | null; // CSS with variable references e.g. background: $color-primary
  rawValue: string | null; // CSS with actual values e.g. background: #FF0000
  variables?: VariableToken[]; // Associated variable tokens
  warnings?: string[];
  errors?: string[];
}

export interface TokenCollection {
  tokens: (StyleToken | VariableToken)[];
} 

export interface ProcessedValue {
  value: string | null;   // Value with variable references
  rawValue: string | null; // Value with actual values
  warnings?: string[];
  errors?: string[];
}