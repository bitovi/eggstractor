import { detectInstanceOverrides } from '../../services/instance.service';
import { TokenCollection, StyleToken, InstanceToken, ComponentToken } from '../../types';

describe('Instance Override Detection', () => {
  it('should detect instance overrides correctly', async () => {
    // Mock a basic token collection with instances and components
    const mockCollection: TokenCollection = {
      tokens: [],
      components: {
        'comp1': {
          type: 'COMPONENT',
          id: 'comp1',
          componentSetId: null,
          variantProperties: {},
        } as ComponentToken,
      },
      componentSets: {},
      instances: {
        'inst1': {
          type: 'INSTANCE',
          id: 'inst1',
          name: 'Button Instance',
          remote: false,
          componentNode: {
            id: 'comp1',
            type: 'COMPONENT',
          } as any,
          variantProperties: {},
        } as InstanceToken,
      },
    };

    // Mock figma API calls
    const mockInstanceNode = {
      id: 'inst1',
      type: 'INSTANCE',
      name: 'Button Instance',
    } as any;

    const mockComponentNode = {
      id: 'comp1',
      type: 'COMPONENT',
      name: 'Button Component',
    } as any;

    // Mock figma.getNodeByIdAsync
    const originalGetNodeById = figma.getNodeByIdAsync;
    figma.getNodeByIdAsync = jest.fn().mockImplementation((id: string) => {
      if (id === 'inst1') return Promise.resolve(mockInstanceNode);
      if (id === 'comp1') return Promise.resolve(mockComponentNode);
      return Promise.resolve(null);
    });

    try {
      const overrides = await detectInstanceOverrides(mockCollection);
      
      expect(overrides).toHaveLength(1);
      expect(overrides[0].instanceName).toBe('Button Instance');
      expect(overrides[0].instanceId).toBe('inst1');
      expect(overrides[0].componentId).toBe('comp1');
    } finally {
      // Restore original function
      figma.getNodeByIdAsync = originalGetNodeById;
    }
  });

  it('should skip remote instances', async () => {
    const mockCollection: TokenCollection = {
      tokens: [],
      components: {},
      componentSets: {},
      instances: {
        'inst1': {
          type: 'INSTANCE',
          id: 'inst1',
          name: 'Remote Button',
          remote: true,
          componentNode: null,
          variantProperties: {},
        } as InstanceToken,
      },
    };

    const overrides = await detectInstanceOverrides(mockCollection);
    expect(overrides).toHaveLength(0);
  });

  it('should handle instances without component nodes', async () => {
    const mockCollection: TokenCollection = {
      tokens: [],
      components: {},
      componentSets: {},
      instances: {
        'inst1': {
          type: 'INSTANCE',
          id: 'inst1',
          name: 'Orphaned Instance',
          remote: false,
          componentNode: null,
          variantProperties: {},
        } as InstanceToken,
      },
    };

    const overrides = await detectInstanceOverrides(mockCollection);
    expect(overrides).toHaveLength(0);
  });
});
