export interface BaseToken {
  type: 'variable' | 'style';
  name: string;
  property: string;
  path: {
    type: SceneNode['type'];
    name: string;
  }[];
  valueType?: string | null;
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
  componentId?: ComponentNode['id'];
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
}

export interface ProcessedValue {
  value: string | null; // Value with variable references
  rawValue: string | null; // Value with actual values
  valueType?: string | null;
  warnings?: string[];
  errors?: string[];
}
