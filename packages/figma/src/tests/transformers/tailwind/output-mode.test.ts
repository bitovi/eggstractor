import { describe, it, expect } from 'vitest';
import {
  transformToTailwindSassClass,
  transformToTailwindLayerUtilityClassV4,
} from '../../../transformers/tailwind';
import { TokenCollection, VariableToken, StyleToken } from '../../../types';

describe('Tailwind SCSS Transformer - OutputMode behavior', () => {
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

  it('should output only CSS variables when outputMode is "variables"', () => {
    const collection = createMockCollection();
    const result = transformToTailwindSassClass(collection, false, false, 'variables');

    // Should contain CSS variables
    expect(result.result).toContain(':root');
    expect(result.result).toContain('--color-primary');

    // Should NOT contain mixins
    expect(result.result).not.toContain('@mixin');
    expect(result.result).not.toContain('@apply');

    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('should output only mixins when outputMode is "components"', () => {
    const collection = createMockCollection();
    const result = transformToTailwindSassClass(collection, false, false, 'components');

    // Should contain mixins with @apply
    expect(result.result).toContain('@mixin');
    expect(result.result).toContain('@apply');

    // Should NOT contain :root variables
    expect(result.result).not.toContain(':root');
  });

  it('should output mixins when outputMode is "all"', () => {
    const collection = createMockCollection();
    const result = transformToTailwindSassClass(collection, false, false, 'all');

    // Should contain mixins
    expect(result.result).toContain('@mixin');
    expect(result.result).toContain('@apply');
  });
});

describe('Tailwind v4 Transformer - OutputMode behavior', () => {
  const createMockCollection = (): TokenCollection => ({
    tokens: [
      {
        type: 'variable',
        name: 'color-primary',
        property: 'color',
        value: '#007bff',
        rawValue: '#007bff',
        valueType: 'color',
        path: [],
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
        path: [],
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

  it('should output only @theme directive when outputMode is "variables"', () => {
    const collection = createMockCollection();
    const result = transformToTailwindLayerUtilityClassV4(collection, false, true, 'variables');

    // Should contain @theme directive
    expect(result.result).toContain('@theme');

    // Should NOT contain @utility
    expect(result.result).not.toContain('@utility');

    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('should output utilities without @theme when outputMode is "components"', () => {
    const collection = createMockCollection();
    const result = transformToTailwindLayerUtilityClassV4(collection, false, true, 'components');

    // Should NOT contain @theme directive
    expect(result.result).not.toContain('@theme');

    // Should contain utilities
    expect(result.result).toContain('@utility');
  });

  it('should output both @theme and @utility when outputMode is "all"', () => {
    const collection = createMockCollection();
    const result = transformToTailwindLayerUtilityClassV4(collection, false, true, 'all');

    // Should contain @theme directive
    expect(result.result).toContain('@theme');

    // Should contain utilities
    expect(result.result).toContain('@utility');
  });

  it('should include semantic color utilities in components and all modes', () => {
    const collection = createMockCollection();

    // Components mode - should include semantic utilities
    const componentsResult = transformToTailwindLayerUtilityClassV4(
      collection,
      false,
      true,
      'components',
    );
    expect(componentsResult.result).toContain('Generated Tailwind Utilities');

    // All mode - should include semantic utilities
    const allResult = transformToTailwindLayerUtilityClassV4(collection, false, true, 'all');
    expect(allResult.result).toContain('Generated Tailwind Utilities');

    // Variables mode - should NOT include semantic utilities
    const variablesResult = transformToTailwindLayerUtilityClassV4(
      collection,
      false,
      true,
      'variables',
    );
    expect(variablesResult.result).not.toContain('Generated Tailwind Utilities');
  });

  it('should default to "all" mode when no outputMode is provided', () => {
    const collection = createMockCollection();
    const result = transformToTailwindLayerUtilityClassV4(collection, false, true);

    // Should contain both @theme and @utility
    expect(result.result).toContain('@theme');
    expect(result.result).toContain('@utility');
  });
});
