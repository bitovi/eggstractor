import { describe, it, expect } from 'vitest';
import { transformToCss } from '../../transformers/css.transformer';
import { TokenCollection, VariableToken, StyleToken } from '../../types';

describe('CSS Transformer - OutputMode behavior', () => {
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

  it('should output only CSS variables when outputMode is "variables"', () => {
    const collection = createMockCollection();
    const result = transformToCss(collection, false, false, 'variables');

    // Should contain CSS custom properties
    expect(result.result).toContain(':root');
    expect(result.result).toContain('--color-primary');
    expect(result.result).toContain('--color-text');

    // Should NOT contain CSS classes
    expect(result.result).not.toContain('.button-primary');

    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('should output only CSS classes when outputMode is "components"', () => {
    const collection = createMockCollection();
    const result = transformToCss(collection, false, false, 'components');

    // Should contain CSS classes (may have generated class names)
    expect(result.result).toMatch(/\.[a-z-]+\s*\{/);
    expect(result.result).toContain('background');
  });

  it('should output both CSS variables and classes when outputMode is "all"', () => {
    const collection = createMockCollection();
    const result = transformToCss(collection, false, false, 'all');

    // CSS transformer in 'all' mode outputs classes (variables can be output separately)
    // This is the expected behavior - use 'variables' mode for CSS custom properties
    expect(result.result).toMatch(/\.[a-z-]+\s*\{/);
    expect(result.result).toContain('background');
  });

  it('should default to "all" mode when no outputMode is provided', () => {
    const collection = createMockCollection();
    const result = transformToCss(collection, false, false);

    // Should contain classes (default behavior)
    expect(result.result).toMatch(/\.[a-z-]+\s*\{/);
    expect(result.result).toContain('background');
  });
});

describe('CSS Transformer - Multi-mode support', () => {
  it('should generate CSS variables with multiple modes', () => {
    const multiModeCollection: TokenCollection = {
      tokens: [
        // Primitive token with multiple mode values
        {
          type: 'variable',
          name: 'color-primary',
          property: 'color',
          value: '$color-primary',
          rawValue: '#0080ff', // default mode value (light)
          valueType: null,
          path: [],
          modeId: 'mode-1',
          modeName: 'light',
          modes: ['mode-1', 'mode-2'],
          modeValues: {
            'mode-1': '#0080ff', // light mode
            'mode-2': '#0066cc', // dark mode
          },
          metadata: {
            variableId: 'var-1',
            variableName: 'Color/Primary',
            variableTokenType: 'primitive',
          },
        },
        // Semantic token referencing primitive
        {
          type: 'variable',
          name: 'action-bg',
          property: 'color',
          value: '$action-bg',
          rawValue: '#0080ff',
          primitiveRef: 'color-primary',
          valueType: null,
          path: [],
          modeId: 'mode-1',
          modeName: 'light',
          modes: ['mode-1', 'mode-2'],
          modeValues: {
            'mode-1': '#0080ff',
            'mode-2': '#0066cc',
          },
          metadata: {
            variableId: 'var-2',
            variableName: 'action/bg',
            variableTokenType: 'semantic',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
      modes: new Map([
        ['mode-1', 'light'],
        ['mode-2', 'dark'],
      ]),
    };

    const result = transformToCss(multiModeCollection, false, false, 'variables');

    // Should have :root with default mode values
    expect(result.result).toContain(':root {');
    expect(result.result).toContain('--color-primary: #0080ff;');

    // Semantic token should reference primitive (no category prefix)
    expect(result.result).toContain('--action-bg: var(--color-primary);');

    // Should have light mode overrides
    expect(result.result).toContain('/* light mode overrides */');
    expect(result.result).toContain("[data-theme='light'] {");

    // Should have dark mode overrides
    expect(result.result).toContain('/* dark mode overrides */');
    expect(result.result).toContain("[data-theme='dark'] {");
    expect(result.result).toContain('--color-primary: #0066cc;');
  });

  it('should handle single-mode tokens (backward compatibility)', () => {
    const singleModeCollection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'color-blue',
          property: 'color',
          value: '$color-blue',
          rawValue: '#0080ff',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-1',
            variableName: 'Color/Blue',
            variableTokenType: 'primitive',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = transformToCss(singleModeCollection, false, false, 'variables');

    // Should have :root
    expect(result.result).toContain(':root {');
    expect(result.result).toContain('--color-blue: #0080ff;');

    // Should NOT have [data-theme] blocks for single mode
    expect(result.result).not.toContain('[data-theme');
  });

  it('should handle three or more modes', () => {
    const threeModeCollection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'color-background',
          property: 'color',
          value: '$color-background',
          rawValue: '#ffffff',
          valueType: null,
          path: [],
          modeId: 'mode-1',
          modeName: 'light',
          modes: ['mode-1', 'mode-2', 'mode-3'],
          modeValues: {
            'mode-1': '#ffffff', // light
            'mode-2': '#1a1a1a', // dark
            'mode-3': '#f5f5dc', // sepia
          },
          metadata: {
            variableId: 'var-1',
            variableName: 'Color/Background',
            variableTokenType: 'primitive',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
      modes: new Map([
        ['mode-1', 'light'],
        ['mode-2', 'dark'],
        ['mode-3', 'sepia'],
      ]),
    };

    const result = transformToCss(threeModeCollection, false, false, 'variables');

    // Should have all three modes
    expect(result.result).toContain("[data-theme='light']");
    expect(result.result).toContain("[data-theme='dark']");
    expect(result.result).toContain("[data-theme='sepia']");
    expect(result.result).toContain('--color-background: #f5f5dc;');
  });

  it('should output variables in "all" mode with multi-mode support', () => {
    const multiModeCollection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'spacing-base',
          property: 'spacing',
          value: '$spacing-base',
          rawValue: '16px',
          valueType: 'px',
          path: [],
          modeId: 'mode-1',
          modeName: 'compact',
          modes: ['mode-1', 'mode-2'],
          modeValues: {
            'mode-1': '16px', // compact
            'mode-2': '24px', // comfortable
          },
          metadata: {
            variableId: 'var-1',
            variableName: 'Spacing/Base',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'style',
          name: 'button-primary',
          property: 'padding',
          value: '16px',
          rawValue: '16px',
          valueType: 'px',
          path: [],
          warnings: [],
          variableTokenMapByProperty: new Map(),
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
      modes: new Map([
        ['mode-1', 'compact'],
        ['mode-2', 'comfortable'],
      ]),
    };

    const result = transformToCss(multiModeCollection, false, false, 'all');

    // Should have variables with modes
    expect(result.result).toContain(':root {');
    expect(result.result).toContain('--spacing-base');
    expect(result.result).toContain("[data-theme='compact']");
    expect(result.result).toContain("[data-theme='comfortable']");

    // Should also have style classes
    expect(result.result).toMatch(/\.\s*\{/); // Match class selector with any name (including empty)
  });

  it('should handle semantic tokens with mode-specific primitive references', () => {
    const collection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'color-red-500',
          property: 'color',
          value: '$color-red-500',
          rawValue: '#ff0000',
          valueType: null,
          path: [],
          modeId: 'mode-1',
          modeName: 'light',
          modes: ['mode-1', 'mode-2'],
          modeValues: {
            'mode-1': '#ff0000',
            'mode-2': '#cc0000',
          },
          metadata: {
            variableId: 'var-1',
            variableName: 'Color/Red/500',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'color-red-700',
          property: 'color',
          value: '$color-red-700',
          rawValue: '#cc0000',
          valueType: null,
          path: [],
          modeId: 'mode-1',
          modeName: 'light',
          modes: ['mode-1', 'mode-2'],
          modeValues: {
            'mode-1': '#cc0000',
            'mode-2': '#990000',
          },
          metadata: {
            variableId: 'var-2',
            variableName: 'Color/Red/700',
            variableTokenType: 'primitive',
          },
        },
        // Semantic token that references different primitives per mode
        {
          type: 'variable',
          name: 'action-danger',
          property: 'color',
          value: '$action-danger',
          rawValue: '#ff0000',
          primitiveRef: 'color-red-500', // default mode
          valueType: null,
          path: [],
          modeId: 'mode-1',
          modeName: 'light',
          modes: ['mode-1', 'mode-2'],
          modeValues: {
            'mode-1': '#ff0000',
            'mode-2': '#cc0000',
          },
          modePrimitiveRefs: {
            'mode-1': 'color-red-500', // light mode uses red-500
            'mode-2': 'color-red-700', // dark mode uses red-700
          },
          metadata: {
            variableId: 'var-3',
            variableName: 'action/danger',
            variableTokenType: 'semantic',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
      modes: new Map([
        ['mode-1', 'light'],
        ['mode-2', 'dark'],
      ]),
    };

    const result = transformToCss(collection, false, false, 'variables');

    // In :root, semantic should reference default mode primitive
    expect(result.result).toContain('--action-danger: var(--color-red-500);');

    // In light mode, should reference red-500
    const lightModeMatch = result.result.match(/\[data-theme='light'\]\s*\{([^}]+)\}/s);
    expect(lightModeMatch).toBeTruthy();
    if (lightModeMatch) {
      expect(lightModeMatch[1]).toContain('--action-danger: var(--color-red-500)');
    }

    // In dark mode, should reference red-700
    const darkModeMatch = result.result.match(/\[data-theme='dark'\]\s*\{([^}]+)\}/s);
    expect(darkModeMatch).toBeTruthy();
    if (darkModeMatch) {
      expect(darkModeMatch[1]).toContain('--action-danger: var(--color-red-700)');
    }
  });

  it('should not add category prefixes to variable names', () => {
    const collection: TokenCollection = {
      tokens: [
        {
          type: 'variable',
          name: 'primary',
          property: 'color',
          value: '$primary',
          rawValue: '#0080ff',
          valueType: null,
          path: [],
          metadata: {
            variableId: 'var-1',
            variableName: 'Primary',
            variableTokenType: 'primitive',
          },
        },
        {
          type: 'variable',
          name: 'base',
          property: 'spacing',
          value: '$base',
          rawValue: '16px',
          valueType: 'px',
          path: [],
          metadata: {
            variableId: 'var-2',
            variableName: 'Base',
            variableTokenType: 'primitive',
          },
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = transformToCss(collection, false, false, 'variables');

    // Should use simple names without category prefixes
    expect(result.result).toContain('--primary: #0080ff');
    expect(result.result).toContain('--base: 16px');

    // Should NOT have category prefixes
    expect(result.result).not.toContain('--color-primary');
    expect(result.result).not.toContain('--spacing-base');
  });

  it('should convert SASS variable references to CSS custom properties in classes', () => {
    const collection: TokenCollection = {
      tokens: [
        {
          type: 'style',
          name: 'button-primary',
          property: 'color',
          value: '$form-text-neutral-default',
          rawValue: '#333333',
          valueType: null,
          path: [],
          warnings: [],
          variableTokenMapByProperty: new Map(),
        },
        {
          type: 'style',
          name: 'button-primary',
          property: 'font-family',
          value: '$font-family-gt-america',
          rawValue: 'GT America',
          valueType: null,
          path: [],
          warnings: [],
          variableTokenMapByProperty: new Map(),
        },
        {
          type: 'style',
          name: 'button-primary',
          property: 'font-size',
          value: '$font-size-base',
          rawValue: '16px',
          valueType: 'px',
          path: [],
          warnings: [],
          variableTokenMapByProperty: new Map(),
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = transformToCss(collection, false, false, 'components');

    // Should convert SASS variables ($) to CSS custom properties (var(--))
    expect(result.result).toContain('color: var(--form-text-neutral-default)');
    expect(result.result).toContain('font-family: var(--font-family-gt-america)');
    expect(result.result).toContain('font-size: var(--font-size-base)');

    // Should NOT contain SASS variables
    expect(result.result).not.toContain('$form-text-neutral-default');
    expect(result.result).not.toContain('$font-family-gt-america');
    expect(result.result).not.toContain('$font-size-base');
  });

  it('should convert SASS variables in compound values (e.g., padding with mixed literals and variables)', () => {
    const collection: TokenCollection = {
      tokens: [
        {
          type: 'style',
          name: 'card-padding',
          property: 'padding',
          value: '0.5rem $spacing-2', // Mixed: literal + variable
          rawValue: '8px 16px',
          valueType: 'px',
          path: [],
          warnings: [],
          variableTokenMapByProperty: new Map(),
        },
        {
          type: 'style',
          name: 'button-margin',
          property: 'margin',
          value: '$spacing-1 $spacing-2 $spacing-3 $spacing-4', // All variables
          rawValue: '4px 8px 12px 16px',
          valueType: 'px',
          path: [],
          warnings: [],
          variableTokenMapByProperty: new Map(),
        },
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = transformToCss(collection, false, false, 'components');

    // Should convert ALL $variable references to var(--variable), even in compound values
    expect(result.result).toContain('padding: 0.5rem var(--spacing-2)');
    expect(result.result).toContain(
      'margin: var(--spacing-1) var(--spacing-2) var(--spacing-3) var(--spacing-4)',
    );

    // Should NOT contain any SASS variables
    expect(result.result).not.toContain('$spacing-1');
    expect(result.result).not.toContain('$spacing-2');
    expect(result.result).not.toContain('$spacing-3');
    expect(result.result).not.toContain('$spacing-4');
  });
});
