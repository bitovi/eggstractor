export interface PathNode {
  name: string;
  type: (BaseNode | (BaseNode & ChildrenMixin))['type'];
}

export interface BaseToken {
  /** Distinguishes between variable references and style declarations. */
  type: 'variable' | 'style';
  /** Generated token name based on Figma node path. */
  name: string;
  /** CSS property name (e.g., 'background-color', 'font-size'). */
  property: string;
  /** Hierarchical path from root to node with type and name. */
  path: PathNode[];
  /** Data type classification for the value. */
  valueType?: string | null;
  /** Token-specific metadata (structure varies by token type). */
  metadata?: Record<string, unknown>;
}

/**
 * Single-mode variable token (no mode variation).
 * Use when a variable has only one mode or mode information is not relevant.
 */
export interface StandardVariableToken extends BaseToken {
  type: 'variable';
  /**
   * SASS variable reference e.g. $color-primary.
   */
  value: string;
  /**
   * Actual value e.g. #FF0000.
   */
  rawValue: string;
  /**
   * For semantic tokens: the primitive variable name it references (e.g., color-blue-500).
   * Used for category detection when generating CSS variable references.
   * Undefined for primitive tokens.
   */
  primitiveRef?: string;
  metadata?: {
    figmaId?: string;
    variableId?: string;
    variableName?: string;
    /** Type of variable token: 'primitive' (base values) or 'semantic' (references to primitives) */
    variableTokenType?: 'primitive' | 'semantic';
  };
}

/**
 * Multi-mode variable token with explicit mode tracking.
 * Use when a variable has multiple modes (e.g., Light, Dark themes).
 *
 * The modeId field indicates which mode this token's primary value/rawValue represent.
 * The modes field lists all available modes for this variable.
 * All mode values are stored in modeValues for code generation.
 */
export interface ModeVariableToken extends BaseToken {
  type: 'variable';
  /**
   * SASS variable reference e.g. $color-primary.
   */
  value: string;
  /**
   * Actual value e.g. #FF0000.
   */
  rawValue: string;
  /**
   * For semantic tokens: the primitive variable name it references (e.g., color-blue-500).
   * Used for category detection when generating CSS variable references.
   */
  primitiveRef?: string;
  /** Mode ID this token's primary value represents (e.g., '2002:1'). */
  modeId: string;
  /** Human-readable name of the mode (e.g., 'Light', 'Dark'). */
  modeName: string;
  /** All available mode IDs for this variable. */
  modes: string[];
  /**
   * All mode-specific values. Key is modeId, value is the resolved value for that mode.
   * Enables generating theme-specific CSS (e.g., light vs dark mode).
   */
  modeValues: Record<string, string>;
  metadata?: {
    figmaId?: string;
    variableId?: string;
    variableName?: string;
    /** Type of variable token: 'primitive' (base values) or 'semantic' (references to primitives) */
    variableTokenType?: 'primitive' | 'semantic';
  };
}

/** Variable token - either single-mode or multi-mode. */
export type VariableToken = StandardVariableToken | ModeVariableToken;

export interface StyleToken extends BaseToken {
  type: 'style';
  /** CSS with variable references (e.g., background: $color-primary). */
  value: string | null;
  /** CSS with actual values (e.g., background: #FF0000). */
  rawValue: string | null;
  /**
   * Array of associated VariableToken objects.
   *
   * @deprecated use `variableTokenMapByProperty` instead or create a new map for your query
   */
  variables?: VariableToken[]; // Associated variable tokens
  /**
   * Map of VariableTokens by property. Each VariableToken should be unique
   * based on its property to this StyleToken.
   */
  variableTokenMapByProperty: Map<string, VariableToken>;
  /** Processing warnings. */
  warnings?: string[];
  /** Processing errors. */
  errors?: string[];
  /** Associated Figma component ID if applicable. */
  componentId?: ComponentNode['id'];
  /** Associated Figma component set ID if applicable. */
  componentSetId?: ComponentSetNode['id'];
}

export interface ComponentSetToken {
  type: ComponentSetNode['type'];
  id: ComponentSetNode['id'];
  name: ComponentSetNode['name'];
  variantPropertyDefinitions: Record<string, string[]>;
}

export interface ComponentToken {
  type: ComponentNode['type'];
  id: ComponentNode['id'];
  /**
   * ID of the component set this component belongs to.
   * If the component is not part of a set, this will be null.
   */
  componentSetId: ComponentSetToken['id'] | null;
  variantProperties: NonNullable<ComponentNode['variantProperties']>;
}

export interface InstanceToken {
  type: InstanceNode['type'];
  id: InstanceNode['id'];
  name: InstanceNode['name'];
  remote: boolean;
  /**
   * This can be used to reference components -> component sets for non-remote
   * components.
   */
  componentNode: ComponentNode | null;
  variantProperties: NonNullable<InstanceNode['variantProperties']>;
}

export type NonNullableStyleToken = {
  [K in keyof StyleToken]: NonNullable<StyleToken[K]>;
};

export interface TokenCollection {
  tokens: (StyleToken | VariableToken)[];
  components: Record<ComponentToken['id'], ComponentToken>;
  componentSets: Record<ComponentSetToken['id'], ComponentSetToken>;
  instances: Record<InstanceToken['id'], InstanceToken>;
  /** Map of modeId -> modeName for all modes found in variable collections */
  modes?: Map<string, string>;
}

export interface ProcessedValue {
  value: string | null; // Value with variable references
  rawValue: string | null; // Value with actual values
  valueType?: string | null;
  warnings?: string[];
  errors?: string[];
}
