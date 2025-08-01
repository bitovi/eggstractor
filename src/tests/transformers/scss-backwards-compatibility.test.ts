import { transformToScss, transformToScssWithInstances } from '../../transformers/scss.transformer';
import { TokenCollection } from '../../types';

describe('SCSS Transformer Backwards Compatibility', () => {
  it('should maintain backwards compatibility with existing transformer', () => {
    const tokens: TokenCollection = {
      tokens: [
        {
          type: 'style',
          name: 'test-token',
          property: 'background',
          value: '#ff0000',
          rawValue: '#ff0000',
          path: [{ name: 'test', type: 'FRAME' }],
          metadata: { figmaId: 'test-id' },
        }
      ],
      components: {},
      componentSets: {},
      instances: {},
    };

    const originalResult = transformToScss(tokens);
    
    expect(originalResult).toBeDefined();
    expect(originalResult.result).toContain('@mixin test');
    expect(originalResult.result).toContain('background: #ff0000');
  });

  it('should produce same base output with instances transformer when no instances present', async () => {
    const tokens: TokenCollection = {
      tokens: [
        {
          type: 'style',
          name: 'test-token',
          property: 'color',
          value: '#0000ff',
          rawValue: '#0000ff',
          path: [{ name: 'text', type: 'TEXT' }],
          metadata: { figmaId: 'text-id' },
        }
      ],
      components: {},
      componentSets: {},
      instances: {}, // No instances
    };

    const originalResult = transformToScss(tokens);
    const newResult = await transformToScssWithInstances(tokens);
    
    // Both should have the same base content when no instances are present
    expect(newResult.result).toContain('@mixin text');
    expect(newResult.result).toContain('color: #0000ff');
    
    // New transformer might have additional sections, but core should be same
    expect(newResult.warnings).toEqual(originalResult.warnings);
    expect(newResult.errors).toEqual(originalResult.errors);
  });
});
