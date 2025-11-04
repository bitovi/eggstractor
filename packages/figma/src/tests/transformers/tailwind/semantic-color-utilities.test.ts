import { describe, it, expect } from 'vitest';
import { transformToTailwindLayerUtilityClassV4 } from '../../../transformers/tailwind';
import { TokenCollection } from '../../../types';

describe('Tailwind v4 Transformer - Semantic Color Utilities', () => {
  const mockCollection: TokenCollection = {
    tokens: [
      // Primitive colors
      {
        type: 'variable',
        name: 'color-base-blue-500',
        property: 'color',
        value: '$color-base-blue-500',
        rawValue: '#0177cc',
        valueType: null,
        path: [],
        metadata: {
          figmaId: 'var-1',
          variableName: 'base/blue-500',
          variableTokenType: 'primitive',
        },
      },
      {
        type: 'variable',
        name: 'color-base-white',
        property: 'color',
        value: '$color-base-white',
        rawValue: '#ffffff',
        valueType: null,
        path: [],
        metadata: {
          figmaId: 'var-2',
          variableName: 'base/white',
          variableTokenType: 'primitive',
        },
      },
      // Semantic colors with different patterns
      {
        type: 'variable',
        name: 'color-action-bg',
        property: 'color',
        value: '$color-action-bg',
        rawValue: '#0177cc',
        valueType: null,
        path: [],
        primitiveRef: 'color-base-blue-500',
        metadata: {
          figmaId: 'var-3',
          variableName: 'action/bg',
          variableTokenType: 'semantic',
        },
      },
      {
        type: 'variable',
        name: 'color-action-text',
        property: 'color',
        value: '$color-action-text',
        rawValue: '#ffffff',
        valueType: null,
        path: [],
        primitiveRef: 'color-base-white',
        metadata: {
          figmaId: 'var-4',
          variableName: 'action/text',
          variableTokenType: 'semantic',
        },
      },
      {
        type: 'variable',
        name: 'color-border-default',
        property: 'color',
        value: '$color-border-default',
        rawValue: '#d9d9d9',
        valueType: null,
        path: [],
        primitiveRef: 'color-base-white',
        metadata: {
          figmaId: 'var-5',
          variableName: 'border/default',
          variableTokenType: 'semantic',
        },
      },
      // Semantic color without bg/text/border (should be skipped in utilities)
      {
        type: 'variable',
        name: 'color-primary',
        property: 'color',
        value: '$color-primary',
        rawValue: '#0177cc',
        valueType: null,
        path: [],
        primitiveRef: 'color-base-blue-500',
        metadata: {
          figmaId: 'var-6',
          variableName: 'primary',
          variableTokenType: 'semantic',
        },
      },
    ],
    components: {},
    componentSets: {},
    instances: {},
  };

  it('should generate semantic color utilities when feature is enabled', () => {
    const result = transformToTailwindLayerUtilityClassV4(mockCollection, false, {
      generateSemanticColorUtilities: true,
    });

    // Should include semantic color utility section
    expect(result.result).toContain('/* Custom Semantic Color Utilities */');

    // Should generate utility for action-bg
    expect(result.result).toContain('@utility action-bg {');
    expect(result.result).toContain('background-color: var(--color-action-bg);');

    // Should generate utility for action-text
    expect(result.result).toContain('@utility action-text {');
    expect(result.result).toContain('color: var(--color-action-text);');

    // Should generate utility for border-default
    expect(result.result).toContain('@utility border-default {');
    expect(result.result).toContain('border-color: var(--color-border-default);');

    // Should NOT generate utility for 'primary' (no bg/text/border in name)
    expect(result.result).not.toContain('@utility primary {');
  });

  it('should not generate semantic color utilities when feature is disabled', () => {
    const result = transformToTailwindLayerUtilityClassV4(mockCollection, false, {
      generateSemanticColorUtilities: false,
    });

    // Should NOT include semantic color utility section
    expect(result.result).not.toContain('/* Custom Semantic Color Utilities */');
    expect(result.result).not.toContain('@utility action-bg {');
  });

  // NOTE: Feature is temporarily enabled by default for testing without UI changes
  it('should generate semantic color utilities by default (testing mode)', () => {
    const result = transformToTailwindLayerUtilityClassV4(mockCollection, false);

    // Should include semantic color utility section when config is undefined (testing mode)
    expect(result.result).toContain('/* Custom Semantic Color Utilities */');
    expect(result.result).toContain('@utility action-bg {');
  });

  it('should keep semantic colors in :root when feature is enabled', () => {
    const result = transformToTailwindLayerUtilityClassV4(mockCollection, false, {
      generateSemanticColorUtilities: true,
    });

    // Semantic colors should be in :root (they define the CSS variables)
    expect(result.result).toContain(':root {');
    expect(result.result).toContain('--color-action-bg:');
    expect(result.result).toContain('--color-action-text:');
    expect(result.result).toContain('--color-border-default:');

    // And primitives should also be there
    expect(result.result).toContain('--color-base-blue-500:');
    expect(result.result).toContain('--color-base-white:');
  });

  it('should include semantic colors in :root when feature is disabled', () => {
    const result = transformToTailwindLayerUtilityClassV4(mockCollection, false, {
      generateSemanticColorUtilities: false,
    });

    // Semantic colors should be in :root (they're always there)
    expect(result.result).toContain(':root {');
    expect(result.result).toContain('--color-action-bg:');
    expect(result.result).toContain('--color-action-text:');
  });

  it('should include semantic colors in :root regardless of feature flag', () => {
    const resultEnabled = transformToTailwindLayerUtilityClassV4(mockCollection, false, {
      generateSemanticColorUtilities: true,
    });
    const resultDisabled = transformToTailwindLayerUtilityClassV4(mockCollection, false, {
      generateSemanticColorUtilities: false,
    });

    // Both should have semantic colors in :root
    const getRootSection = (output: string) => {
      const rootStart = output.indexOf(':root {');
      const rootEnd = output.indexOf('}', rootStart);
      return output.substring(rootStart, rootEnd);
    };

    const rootEnabled = getRootSection(resultEnabled.result);
    const rootDisabled = getRootSection(resultDisabled.result);

    // :root should contain semantic color variable definitions (not just references)
    expect(rootEnabled).toContain('--color-base-blue-500:');
    expect(rootDisabled).toContain('--color-base-blue-500:');
  });
});
