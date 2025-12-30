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
   * Variable name reference (transformer-agnostic) e.g. color-primary.
   * Transformers add their own syntax: CSS → var(--color-primary), SCSS → $color-primary
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
   * Variable name reference (transformer-agnostic) e.g. color-primary.
   * Transformers add their own syntax: CSS → var(--color-primary), SCSS → $color-primary
   */
  value: string;
  /**
   * Actual value e.g. #FF0000.
   */
  rawValue: string;
  /**
   * For semantic tokens: the primitive variable name it references (e.g., color-blue-500).
   * Used for category detection when generating CSS variable references.
   * This represents the default mode's primitive reference.
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
  /**
   * For semantic tokens: mode-specific primitive references. Key is modeId, value is the primitive variable name.
   * Enables generating correct var() references for each mode (e.g., Light mode → color-red-800, Dark mode → color-red-600).
   */
  modePrimitiveRefs?: Record<string, string>;
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
  /**
   * CSS-like value with variable references (e.g., background: color-primary or padding: 0.5rem spacing-2).
   *
   * @deprecated TECHNICAL DEBT: String concatenation loses type information. See:
   * https://wiki.at.bitovi.com/wiki/spaces/Eggstractor/pages/1847820398/Technical+Debt+EGG-132+Border+Token+Pipeline
   * This field mixes variable references and CSS values in a single string, requiring transformers
   * to parse and guess intent. The proper solution involves restructuring the token pipeline to use
   * structured value types (TokenValuePart union types) throughout. Estimated effort: 3-4 weeks.
   */
  value: string | null;
  /** CSS with actual values (e.g., background: #FF0000). */
  rawValue: string | null;
  /**
   * Pre-formatted CSS value (optional). When provided by processors, transformers can use this directly
   * instead of parsing `value`. For compound values like borders, this eliminates the need to guess
   * which parts are variables vs CSS keywords.
   * Example: "0.0625rem solid var(--icon-text-default)"
   *
   * @deprecated TEMPORARY WORKAROUND: This is a band-aid solution to fix immediate bugs (EGG-132).
   * Only border processor currently uses this. This field should be removed once the token pipeline
   * is restructured to use TokenValuePart types. See:
   * https://wiki.at.bitovi.com/wiki/spaces/Eggstractor/pages/1847820398/Technical+Debt+EGG-132+Border+Token+Pipeline
   */
  cssValue?: string;
  /**
   * Pre-formatted SCSS value (optional). When provided by processors, transformers can use this directly
   * instead of parsing `value`. For compound values like borders, this eliminates the need to guess
   * which parts are variables vs CSS keywords.
   * Example: "$spacing-1 solid $color-primary"
   *
   * @deprecated TEMPORARY WORKAROUND: This is a band-aid solution to fix immediate bugs (EGG-132).
   * Only border processor currently uses this. This field should be removed once the token pipeline
   * is restructured to use TokenValuePart types. See:
   * https://wiki.at.bitovi.com/wiki/spaces/Eggstractor/pages/1847820398/Technical+Debt+EGG-132+Border+Token+Pipeline
   */
  scssValue?: string;
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

// px, %, ref, rbg etc
export interface ProcessedValue {
  value: string | null; // Value with variable references
  rawValue: string | null; // Value with actual values
  valueType?: string | null;
  /**
   * Pre-formatted CSS value (optional) - avoids parsing in transformers.
   * @deprecated TEMPORARY WORKAROUND - see StyleToken.cssValue deprecation note
   */
  cssValue?: string;
  /**
   * Pre-formatted SCSS value (optional) - avoids parsing in transformers.
   * @deprecated TEMPORARY WORKAROUND - see StyleToken.scssValue deprecation note
   */
  scssValue?: string;
  warnings?: string[];
  errors?: string[];
}
