import { describe, it, expect } from 'vitest';
import { convertToGeneratorTokens } from '../../../transformers/variants/convert-to-generator-tokens';
import { StyleToken, VariableToken } from '../../../types';

/**
 * Helper to build a minimal parsedStyleToken input for convertToGeneratorTokens.
 * Mirrors the shape returned by convertVariantGroupBy.
 */
function createParsedStyleToken({
  property,
  rawValue,
  variableToken,
  variableKey,
  path = [],
}: {
  property: string;
  rawValue: string;
  variableToken?: VariableToken;
  /** The key under which the variable is stored in variableTokenMapByProperty */
  variableKey?: string;
  path?: SceneNode[];
}) {
  const variableTokenMapByProperty = new Map<string, VariableToken>();
  if (variableToken && variableKey) {
    variableTokenMapByProperty.set(variableKey, variableToken);
  }

  const styleToken: StyleToken = {
    type: 'style',
    name: 'test',
    value: rawValue,
    rawValue,
    valueType: 'px',
    property,
    path,
    metadata: { figmaId: 'test-node' },
    variableTokenMapByProperty,
  };

  return [
    {
      key: 'test-variant',
      path,
      componentId: null,
      componentSetId: null,
      variants: {},
      styles: { [property]: rawValue },
      tokens: [styleToken],
    },
  ] as unknown as ReturnType<
    typeof import('../../../transformers/variants/convert-variant-group-by').convertVariantGroupBy
  >;
}

function createVariableToken(
  overrides: Partial<VariableToken> & { name: string; primitiveRef?: string },
): VariableToken {
  return {
    type: 'variable',
    path: [],
    property: 'color',
    value: overrides.name,
    rawValue: '#4f5153',
    valueType: null,
    metadata: {
      figmaId: 'var-node',
      variableId: 'var-1',
      variableName: overrides.name,
      variableTokenType: 'semantic',
    },
    ...overrides,
  } as VariableToken;
}

describe('convertToGeneratorTokens', () => {
  describe('semantic variable name detection', () => {
    it('should set semanticVariableName for a true alias (name !== primitiveRef)', () => {
      const variableToken = createVariableToken({
        name: 'navigation-border-neutral-footer-divider',
        primitiveRef: 'gray-800',
      });

      const input = createParsedStyleToken({
        property: 'border',
        rawValue: '1px solid #4f5153',
        variableToken,
        variableKey: 'border',
      });

      const result = convertToGeneratorTokens(input);
      expect(result[0].tokens[0].semanticVariableName).toBe(
        'navigation-border-neutral-footer-divider',
      );
    });

    it('should NOT set semanticVariableName for a primitive (name === primitiveRef)', () => {
      const variableToken = createVariableToken({
        name: 'blue-500',
        primitiveRef: 'blue-500',
      });

      const input = createParsedStyleToken({
        property: 'background',
        rawValue: '#0028a0',
        variableToken,
        variableKey: 'background',
      });

      const result = convertToGeneratorTokens(input);
      expect(result[0].tokens[0].semanticVariableName).toBeUndefined();
    });

    it('should set semanticVariableName when primitiveRef is undefined (legacy tokens)', () => {
      const variableToken = createVariableToken({
        name: 'action-bg-primary',
        primitiveRef: undefined,
      });

      const input = createParsedStyleToken({
        property: 'background',
        rawValue: '#0028a0',
        variableToken,
        variableKey: 'background',
      });

      const result = convertToGeneratorTokens(input);
      expect(result[0].tokens[0].semanticVariableName).toBe('action-bg-primary');
    });

    it('should NOT set semanticVariableName when variableTokenType is primitive', () => {
      const variableToken = createVariableToken({
        name: 'gray-800',
        primitiveRef: 'gray-800',
        metadata: {
          figmaId: 'var-node',
          variableId: 'var-1',
          variableName: 'gray-800',
          variableTokenType: 'primitive',
        },
      });

      const input = createParsedStyleToken({
        property: 'color',
        rawValue: '#4f5153',
        variableToken,
        variableKey: 'color',
      });

      const result = convertToGeneratorTokens(input);
      expect(result[0].tokens[0].semanticVariableName).toBeUndefined();
    });
  });

  describe('box-shadow strokes fallback', () => {
    it('should use strokes key for box-shadow semantic variable when property key has no variable', () => {
      const strokeToken = createVariableToken({
        name: 'form-border-neutral-disabled',
        primitiveRef: 'gray-800',
      });

      const variableTokenMapByProperty = new Map<string, VariableToken>();
      variableTokenMapByProperty.set('strokes', strokeToken);

      const styleToken: StyleToken = {
        type: 'style',
        name: 'test',
        value: 'inset 0 1px 0 0 #4f5153',
        rawValue: 'inset 0 1px 0 0 #4f5153',
        valueType: 'px',
        property: 'box-shadow',
        path: [],
        metadata: { figmaId: 'test-node' },
        variableTokenMapByProperty,
      };

      const input = [
        {
          key: 'test-variant',
          path: [],
          componentId: null,
          componentSetId: null,
          variants: {},
          styles: { 'box-shadow': 'inset 0 1px 0 0 #4f5153' },
          tokens: [styleToken],
        },
      ] as unknown as ReturnType<
        typeof import('../../../transformers/variants/convert-variant-group-by').convertVariantGroupBy
      >;

      const result = convertToGeneratorTokens(input);
      expect(result[0].tokens[0].semanticVariableName).toBe('form-border-neutral-disabled');
    });

    it('should NOT use strokes key when the stroke variable is a primitive (name === primitiveRef)', () => {
      const strokeToken = createVariableToken({
        name: 'gray-800',
        primitiveRef: 'gray-800',
      });

      const variableTokenMapByProperty = new Map<string, VariableToken>();
      variableTokenMapByProperty.set('strokes', strokeToken);

      const styleToken: StyleToken = {
        type: 'style',
        name: 'test',
        value: 'inset 0 1px 0 0 #4f5153',
        rawValue: 'inset 0 1px 0 0 #4f5153',
        valueType: 'px',
        property: 'box-shadow',
        path: [],
        metadata: { figmaId: 'test-node' },
        variableTokenMapByProperty,
      };

      const input = [
        {
          key: 'test-variant',
          path: [],
          componentId: null,
          componentSetId: null,
          variants: {},
          styles: { 'box-shadow': 'inset 0 1px 0 0 #4f5153' },
          tokens: [styleToken],
        },
      ] as unknown as ReturnType<
        typeof import('../../../transformers/variants/convert-variant-group-by').convertVariantGroupBy
      >;

      const result = convertToGeneratorTokens(input);
      expect(result[0].tokens[0].semanticVariableName).toBeUndefined();
    });
  });
});
