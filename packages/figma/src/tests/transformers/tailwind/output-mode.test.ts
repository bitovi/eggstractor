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

  describe('with multi-mode semantic color tokens', () => {
    const createMultiModeCollection = (): TokenCollection => ({
      tokens: [
        // Primitive token with multiple modes
        {
          type: 'variable',
          name: 'color-blue-500',
          property: 'color',
          value: 'color-blue-500',
          rawValue: '#0080ff',
          valueType: null,
          path: [],
          modeId: 'mode-light',
          modeName: 'light',
          modes: ['mode-light', 'mode-dark'],
          modeValues: {
            'mode-light': '#0080ff',
            'mode-dark': '#66b3ff',
          },
          metadata: {
            variableId: 'var-1',
            variableName: 'color/blue/500',
            variableTokenType: 'primitive',
          },
        } as VariableToken,
        // Semantic color token with background property
        {
          type: 'variable',
          name: 'content-bg-neutral-default',
          property: 'background',
          value: 'content-bg-neutral-default',
          rawValue: '#0080ff',
          valueType: null,
          path: [],
          primitiveRef: 'color-blue-500',
          modeId: 'mode-light',
          modeName: 'light',
          modes: ['mode-light', 'mode-dark'],
          modeValues: {
            'mode-light': '#0080ff',
            'mode-dark': '#66b3ff',
          },
          metadata: {
            variableId: 'var-2',
            variableName: 'content/bg/neutral/default',
            variableTokenType: 'semantic',
          },
        } as VariableToken,
        // Semantic color token with color property
        {
          type: 'variable',
          name: 'content-text-primary',
          property: 'color',
          value: 'content-text-primary',
          rawValue: '#ffffff',
          valueType: null,
          path: [],
          primitiveRef: 'color-white',
          metadata: {
            variableId: 'var-3',
            variableName: 'content/text/primary',
            variableTokenType: 'semantic',
          },
        } as VariableToken,
        // Style token for mixins
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
      modes: new Map([
        ['mode-light', 'light'],
        ['mode-dark', 'dark'],
      ]),
    });

    it('should output CSS variables with mode overrides in "variables" mode', () => {
      const collection = createMultiModeCollection();
      const result = transformToTailwindSassClass(collection, false, false, 'variables');

      // Should contain :root with default mode values
      expect(result.result).toContain(':root {');
      expect(result.result).toContain('--color-blue-500: #0080ff;');
      expect(result.result).toContain('--content-bg-neutral-default: var(--color-blue-500);');

      // Should contain mode-specific overrides
      expect(result.result).toContain("[data-theme='light']");
      expect(result.result).toContain("[data-theme='dark']");
      expect(result.result).toContain('--color-blue-500: #66b3ff;');

      // Should NOT contain mixins
      expect(result.result).not.toContain('@mixin');
    });

    it('should output @layer utilities in "variables" mode', () => {
      const collection = createMultiModeCollection();
      const result = transformToTailwindSassClass(collection, false, false, 'variables');

      // Should contain @layer utilities
      expect(result.result).toContain('@layer utilities {');

      // Should generate utility for background property
      expect(result.result).toContain('.content-bg-neutral-default {');
      expect(result.result).toContain('background-color: var(--content-bg-neutral-default);');

      // Should generate utility for color property
      expect(result.result).toContain('.content-text-primary {');
      expect(result.result).toContain('color: var(--content-text-primary);');
    });

    it('should output CSS variables, @layer utilities, AND mixins in "all" mode', () => {
      const collection = createMultiModeCollection();
      const result = transformToTailwindSassClass(collection, false, false, 'all');

      // Should contain CSS variables with mode overrides
      expect(result.result).toContain(':root {');
      expect(result.result).toContain('--color-blue-500');
      expect(result.result).toContain("[data-theme='light']");
      expect(result.result).toContain("[data-theme='dark']");

      // Should contain @layer utilities
      expect(result.result).toContain('@layer utilities {');
      expect(result.result).toContain('.content-bg-neutral-default {');
      expect(result.result).toContain('background-color: var(--content-bg-neutral-default);');

      // Should contain mixins
      expect(result.result).toContain('@mixin');
      expect(result.result).toContain('@apply');
    });

    it('should NOT generate @layer utilities for primitive tokens', () => {
      const collection = createMultiModeCollection();
      const result = transformToTailwindSassClass(collection, false, false, 'variables');

      // Should NOT generate utilities for primitives
      expect(result.result).not.toContain('.color-blue-500 {');
    });

    it('should NOT generate @layer utilities for semantic tokens bound to components', () => {
      const collectionWithBoundToken: TokenCollection = {
        tokens: [
          {
            type: 'variable',
            name: 'button-primary-bg',
            property: 'background',
            value: 'button-primary-bg',
            rawValue: '#0080ff',
            valueType: null,
            path: [
              { name: 'Button', type: 'COMPONENT_SET' } as SceneNode,
              { name: 'Primary', type: 'COMPONENT' } as SceneNode,
            ],
            metadata: {
              variableId: 'var-1',
              variableName: 'button/primary/bg',
              variableTokenType: 'semantic',
            },
          } as VariableToken,
        ],
        components: {},
        componentSets: {},
        instances: {},
      };

      const result = transformToTailwindSassClass(
        collectionWithBoundToken,
        false,
        false,
        'variables',
      );

      // Should contain CSS variables
      expect(result.result).toContain('--button-primary-bg');

      // Should NOT generate utilities for bound tokens (path.length > 0)
      expect(result.result).not.toContain('.button-primary-bg {');
    });
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
