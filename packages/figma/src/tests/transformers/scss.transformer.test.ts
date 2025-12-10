import { describe, it, expect } from 'vitest';
import { transformToScss } from '../../transformers/scss.transformer';
import { TokenCollection, VariableToken, StyleToken } from '../../types';

describe('SCSS Transformer - OutputMode behavior', () => {
  const createMockCollection = (): TokenCollection => ({
    tokens: [
      {
        type: 'variable',
        name: 'color-primary',
        property: 'color',
        value: '#007bff',
        rawValue: '#007bff',
        valueType: 'color',
        metadata: {
          variableTokenType: 'primitive',
        },
      } as VariableToken,
      {
        type: 'variable',
        name: 'color-text',
        property: 'color',
        value: '#007bff',
        rawValue: '#007bff',
        valueType: 'color',
        primitiveRef: 'color-primary',
        metadata: {
          variableTokenType: 'semantic',
        },
      } as VariableToken,
      {
        type: 'style',
        name: 'button-primary',
        property: 'background',
        value: '#007bff',
        rawValue: '#007bff',
        valueType: 'color',
        path: [
          { name: 'Button', type: 'COMPONENT_SET' } as SceneNode,
          { name: 'Primary', type: 'COMPONENT' } as SceneNode,
        ],
        warnings: [],
        variableTokenMapByProperty: new Map(),
      } as StyleToken,
    ],
    components: {},
    componentSets: {},
    instances: {},
  });

  it('should output only SCSS variables when outputMode is "variables"', () => {
    const collection = createMockCollection();
    const result = transformToScss(collection, false, false, 'variables');

    // Should contain SCSS variables
    expect(result.result).toContain('$color-primary');
    expect(result.result).toContain('$color-text');

    // Should NOT contain mixins
    expect(result.result).not.toContain('@mixin');

    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('should output SCSS variables and mixins when outputMode is "components"', () => {
    const collection = createMockCollection();
    const result = transformToScss(collection, false, false, 'components');

    // Should contain SCSS variables
    expect(result.result).toContain('$color-primary');
    expect(result.result).toContain('$color-text');

    // Should contain mixins (may not have the exact token name in the mixin name)
    expect(result.result).toContain('@mixin');
    expect(result.result).toContain('background');
  });

  it('should output SCSS variables and mixins when outputMode is "all"', () => {
    const collection = createMockCollection();
    const result = transformToScss(collection, false, false, 'all');

    // Should contain SCSS variables
    expect(result.result).toContain('$color-primary');
    expect(result.result).toContain('$color-text');

    // Should contain mixins
    expect(result.result).toContain('@mixin');
    expect(result.result).toContain('background');
  });

  it('should default to "all" mode when no outputMode is provided', () => {
    const collection = createMockCollection();
    const result = transformToScss(collection, false, false);

    // Should contain both variables and mixins
    expect(result.result).toContain('$color-primary');
    expect(result.result).toContain('@mixin');
  });
});
