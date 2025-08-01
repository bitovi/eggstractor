import { transformToScssWithInstances } from '../../transformers/scss.transformer';
import { TokenCollection } from '../../types';

describe('SCSS Transformer with Instances', () => {
  it('should generate SCSS output with instance mixins', async () => {
    // Create a minimal token collection
    const tokens: TokenCollection = {
      tokens: [],
      components: {},
      componentSets: {},
      instances: {},
    };

    const result = await transformToScssWithInstances(tokens);
    
    expect(result).toBeDefined();
    expect(result.result).toBeDefined();
    expect(typeof result.result).toBe('string');
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    // Create a token collection that might cause issues
    const tokens: TokenCollection = {
      tokens: [],
      components: {},
      componentSets: {},
      instances: {
        'invalid-instance': {
          type: 'INSTANCE',
          id: 'invalid-instance',
          name: 'Invalid Instance',
          remote: false,
          componentNode: {
            id: 'non-existent-component',
            type: 'COMPONENT',
          } as any,
          variantProperties: {},
        },
      },
    };

    // Mock figma API to return null
    const originalGetNodeById = figma.getNodeByIdAsync;
    figma.getNodeByIdAsync = jest.fn().mockResolvedValue(null);

    try {
      const result = await transformToScssWithInstances(tokens);
      
      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(typeof result.result).toBe('string');
      
      // Should have at least base SCSS output even if instance processing fails
      expect(result.result.length).toBeGreaterThan(0);
    } finally {
      // Restore original function
      figma.getNodeByIdAsync = originalGetNodeById;
    }
  });
});
