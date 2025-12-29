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
        value: 'color-base-blue-500',
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
        value: 'color-base-white',
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
        value: 'color-action-bg',
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
        value: 'color-action-text',
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
        value: 'color-border-default',
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
        value: 'color-primary',
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
    const result = transformToTailwindLayerUtilityClassV4(mockCollection, false, true);

    // Should include semantic color utility section
    expect(result.result).toContain('/* Custom Semantic Color Utilities */');

    // Should generate utility for action-bg
    expect(result.result).toContain('@utility action-bg {');
    expect(result.result).toContain('background-color: var(--action-bg);');

    // Should generate utility for action-text
    expect(result.result).toContain('@utility action-text {');
    expect(result.result).toContain('color: var(--action-text);');

    // Should generate utility for border-default
    expect(result.result).toContain('@utility border-default {');
    expect(result.result).toContain('border-color: var(--border-default);');

    // Should NOT generate utility for 'primary' (no bg/text/border in name)
    expect(result.result).not.toContain('@utility primary {');
  });

  it('should not generate semantic color utilities when feature is disabled', () => {
    const result = transformToTailwindLayerUtilityClassV4(mockCollection, false, false);

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
    const result = transformToTailwindLayerUtilityClassV4(mockCollection, false, true);

    // Semantic colors should be in :root (they define the CSS variables)
    expect(result.result).toContain(':root {');
    expect(result.result).toContain('--action-bg:');
    expect(result.result).toContain('--action-text:');
    expect(result.result).toContain('--border-default:');

    // And primitives should also be there
    expect(result.result).toContain('--color-base-blue-500:');
    expect(result.result).toContain('--color-base-white:');
  });

  it('should NOT include semantic colors in :root when feature is disabled', () => {
    const result = transformToTailwindLayerUtilityClassV4(mockCollection, false, false);

    // When feature is disabled, semantic colors are not collected for :root
    // They should appear in @theme instead (normal behavior)
    // Semantic colors should NOT be in :root
    const rootSection = result.result.split('@theme')[0];
    expect(rootSection).not.toContain('--action-bg:');
    expect(rootSection).not.toContain('--action-text:');

    // But they SHOULD appear in @theme WITH --color- prefix
    const themeSection = result.result.split('@theme')[1];
    expect(themeSection).toContain('--color-action-bg:');
    expect(themeSection).toContain('--color-action-text:');

    // But primitives should still be there
    expect(result.result).toContain('--color-base-blue-500:');
    expect(result.result).toContain('--color-base-white:');
  });

  it('should only include semantic colors in :root when feature is enabled', () => {
    const resultEnabled = transformToTailwindLayerUtilityClassV4(mockCollection, false, true);
    const resultDisabled = transformToTailwindLayerUtilityClassV4(mockCollection, false, false);

    // Enabled should have semantic colors in :root
    const rootEnabled = resultEnabled.result.split('@theme')[0];
    expect(rootEnabled).toContain('--action-bg:');
    expect(rootEnabled).toContain('--action-text:');

    // Disabled should have semantic colors in @theme (not :root) WITH --color- prefix
    const rootDisabled = resultDisabled.result.split('@theme')[0];
    const themeDisabled = resultDisabled.result.split('@theme')[1];
    expect(rootDisabled).not.toContain('--action-bg:');
    expect(rootDisabled).not.toContain('--action-text:');
    expect(themeDisabled).toContain('--color-action-bg:');
    expect(themeDisabled).toContain('--color-action-text:');

    // Both should have primitives in :root
    expect(resultEnabled.result).toContain('--color-base-blue-500:');
    expect(resultDisabled.result).toContain('--color-base-blue-500:');
  });
});
