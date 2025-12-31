import { describe, it, expect } from 'vitest';
import { transformToScss } from '../../transformers/scss.transformer';
import { TokenCollection, VariableToken, StyleToken, ModeVariableToken } from '../../types';

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

describe('SCSS Transformer - Multi-Mode Support', () => {
  it('should generate CSS custom properties with mode overrides for multi-mode tokens', () => {
    const collection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'color-primary',
          property: 'color',
          value: 'color-primary',
          rawValue: '#0080ff',
          valueType: null,
          path: [],
          modeId: 'mode-1',
          modeName: 'Light',
          modes: ['mode-1', 'mode-2'],
          modeValues: {
            'mode-1': '#0080ff',
            'mode-2': '#66b3ff',
          },
          metadata: {
            variableId: 'var-1',
            variableName: 'Primary Color',
            variableTokenType: 'primitive',
          },
        } as ModeVariableToken,
        {
          type: 'variable',
          name: 'spacing-base',
          property: 'spacing',
          value: 'spacing-base',
          rawValue: '16px',
          valueType: 'px',
          path: [],
          metadata: {
            variableId: 'var-2',
            variableName: 'Base Spacing',
            variableTokenType: 'primitive',
          },
        } as VariableToken,
      ],
      components: {},
      componentSets: {},
      instances: {},
      modes: new Map([
        ['mode-1', 'light'],
        ['mode-2', 'dark'],
      ]),
    };

    const result = transformToScss(collection, false, false, 'variables');

    // Should have CSS custom properties in :root
    expect(result.result).toContain(':root {');
    expect(result.result).toContain('--color-primary: #0080ff;');
    expect(result.result).toContain('--spacing-base: 16px;');

    // Should have mode-specific overrides
    expect(result.result).toContain("[data-theme='dark'] {");
    expect(result.result).toContain('--color-primary: #66b3ff;');

    // Should have SCSS variables that reference CSS custom properties
    expect(result.result).toContain('$color-primary: var(--color-primary);');
    expect(result.result).toContain('$spacing-base: var(--spacing-base);');
  });

  it('should handle semantic tokens with multi-mode primitives', () => {
    const collection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'color-blue-500',
          property: 'color',
          value: 'color-blue-500',
          rawValue: '#0080ff',
          valueType: null,
          path: [],
          modeId: 'mode-light',
          modeName: 'Light',
          modes: ['mode-light', 'mode-dark'],
          modeValues: {
            'mode-light': '#0080ff',
            'mode-dark': '#66b3ff',
          },
          metadata: {
            variableId: 'var-1',
            variableName: 'Blue 500',
            variableTokenType: 'primitive',
          },
        } as ModeVariableToken,
        {
          type: 'variable',
          name: 'action-bg-primary',
          property: 'color',
          value: 'action-bg-primary',
          rawValue: '#0080ff',
          valueType: null,
          path: [],
          primitiveRef: 'color-blue-500',
          metadata: {
            variableId: 'var-2',
            variableName: 'Action BG Primary',
            variableTokenType: 'semantic',
          },
        } as VariableToken,
      ],
      components: {},
      componentSets: {},
      instances: {},
      modes: new Map([
        ['mode-light', 'light'],
        ['mode-dark', 'dark'],
      ]),
    };

    const result = transformToScss(collection, false, false, 'variables');

    // CSS custom properties
    expect(result.result).toContain('--color-blue-500: #0080ff;');
    expect(result.result).toContain('--action-bg-primary: var(--color-blue-500);');

    // Mode overrides
    expect(result.result).toContain("[data-theme='dark'] {");
    expect(result.result).toContain('--color-blue-500: #66b3ff;');

    // SCSS variables
    expect(result.result).toContain('$color-blue-500: var(--color-blue-500);');
    expect(result.result).toContain('$action-bg-primary: var(--action-bg-primary);');
  });

  it('should handle 3+ modes correctly', () => {
    const collection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'color-surface',
          property: 'color',
          value: 'color-surface',
          rawValue: '#ffffff',
          valueType: null,
          path: [],
          modeId: 'mode-light',
          modeName: 'Light',
          modes: ['mode-light', 'mode-dark', 'mode-contrast'],
          modeValues: {
            'mode-light': '#ffffff',
            'mode-dark': '#1a1a1a',
            'mode-contrast': '#000000',
          },
          metadata: {
            variableId: 'var-1',
            variableName: 'Surface',
            variableTokenType: 'primitive',
          },
        } as ModeVariableToken,
      ],
      components: {},
      componentSets: {},
      instances: {},
      modes: new Map([
        ['mode-light', 'light'],
        ['mode-dark', 'dark'],
        ['mode-contrast', 'contrast'],
      ]),
    };

    const result = transformToScss(collection, false, false, 'variables');

    // Should have all 3 mode blocks
    expect(result.result).toContain("[data-theme='light'] {");
    expect(result.result).toContain("[data-theme='dark'] {");
    expect(result.result).toContain("[data-theme='contrast'] {");

    // Should have different values per mode
    expect(result.result).toContain('--color-surface: #1a1a1a;'); // dark
    expect(result.result).toContain('--color-surface: #000000;'); // contrast
  });

  it('should maintain backward compatibility for single-mode tokens', () => {
    const collection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'spacing-base',
          property: 'spacing',
          value: 'spacing-base',
          rawValue: '16px',
          valueType: 'px',
          path: [],
          metadata: {
            variableId: 'var-1',
            variableName: 'Base Spacing',
            variableTokenType: 'primitive',
          },
        } as VariableToken,
        {
          type: 'variable',
          name: 'spacing-large',
          property: 'spacing',
          value: 'spacing-large',
          rawValue: '32px',
          valueType: 'px',
          path: [],
          primitiveRef: 'spacing-base',
          metadata: {
            variableId: 'var-2',
            variableName: 'Large Spacing',
            variableTokenType: 'semantic',
          },
        } as VariableToken,
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = transformToScss(collection, false, false, 'variables');

    // Should use traditional SCSS variables (not CSS custom properties)
    expect(result.result).toContain('// Primitive SCSS Variables');
    expect(result.result).toContain('$spacing-base: 1rem;');
    expect(result.result).toContain('// Semantic SCSS Variables');
    expect(result.result).toContain('$spacing-large: $spacing-base;');

    // Should NOT contain CSS custom properties
    expect(result.result).not.toContain(':root {');
    expect(result.result).not.toContain('--spacing-base');
    expect(result.result).not.toContain('var(--');
  });

  it('should generate correct output for all mode with multi-mode tokens', () => {
    const collection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'color-text',
          property: 'color',
          value: 'color-text',
          rawValue: '#000000',
          valueType: null,
          path: [],
          modeId: 'mode-light',
          modeName: 'Light',
          modes: ['mode-light', 'mode-dark'],
          modeValues: {
            'mode-light': '#000000',
            'mode-dark': '#ffffff',
          },
          metadata: {
            variableId: 'var-1',
            variableName: 'Text Color',
            variableTokenType: 'primitive',
          },
        } as ModeVariableToken,
        {
          type: 'style',
          name: 'heading',
          property: 'color',
          value: 'color-text',
          rawValue: '#000000',
          valueType: null,
          path: [],
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
    };

    const result = transformToScss(collection, false, false, 'all');

    // Should have CSS custom properties
    expect(result.result).toContain(':root {');
    expect(result.result).toContain('--color-text');

    // Should have SCSS variables
    expect(result.result).toContain('$color-text: var(--color-text);');

    // Should have mixins
    expect(result.result).toContain('@mixin');
  });
});
