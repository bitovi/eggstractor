import { transformToScssWithInstances } from '../../transformers/scss.transformer';
import { collectTokens } from '../../services/collection.service';
import { createTestData } from '../../utils/test.utils';
import testData from '../fixtures/figma-test-data_instances.json';

describe('Instance Override SCSS Generation', () => {
  it('should generate instance mixins with overrides', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    // Mock the getNodeByIdAsync to return proper nodes
    const originalGetNodeById = figma.getNodeByIdAsync;
    figma.getNodeByIdAsync = jest.fn().mockImplementation(async (id: string) => {
      // Find the node in our test data
      const findNode = (nodes: any[], targetId: string): any => {
        for (const node of nodes) {
          if (node.id === targetId) {
            return node;
          }
          if (node.children) {
            const found = findNode(node.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };
      
      return findNode([testData], id);
    });

    try {
      const tokens = await collectTokens(jest.fn());
      const result = await transformToScssWithInstances(tokens);

      // Should contain regular SCSS output
      expect(result.result).toContain('// Generated SCSS Variables');
      expect(result.result).toContain('// Generated SCSS Mixins');
      
      // Should contain instance-specific mixins
      expect(result.result).toContain('// Generated Instance Mixins (Override Styles Only)');
      
      // Should contain mixins for our test instances
      expect(result.result).toContain('@mixin primary-button');
      expect(result.result).toContain('@mixin secondary-button');
      
      // Instance mixins should only contain override styles
      const instanceMixinSection = result.result.split('// Generated Instance Mixins (Override Styles Only)')[1];
      
      if (instanceMixinSection) {
        // Primary button should have red background override (different from component's blue)
        expect(instanceMixinSection).toMatch(/@mixin primary-button[\s\S]*background.*#cc3333/);
        
        // Secondary button should have gray background override
        expect(instanceMixinSection).toMatch(/@mixin secondary-button[\s\S]*background.*#e6e6e6/);
      }

      expect(result.warnings).toBeDefined();
      expect(result.errors).toBeDefined();
    } finally {
      figma.getNodeByIdAsync = originalGetNodeById;
    }
  });

  it('should handle instances with no overrides', async () => {
    // Create test data with an instance that has no overrides
    const noOverrideData = {
      ...testData,
      children: [
        {
          ...testData.children[0],
          children: [
            testData.children[0].children[0], // Component set
            {
              "id": "instance-no-override",
              "name": "Unchanged Button",
              "type": "INSTANCE",
              "mainComponent": {
                "id": "component-1",
                "type": "COMPONENT"
              },
              "variantProperties": {
                "State": "Default"
              },
              // Same properties as component - no overrides
              "fills": [
                {
                  "type": "SOLID",
                  "color": {
                    "r": 0.2,
                    "g": 0.4,
                    "b": 0.8
                  },
                  "opacity": 1,
                  "visible": true
                }
              ],
              "strokeWeight": 1,
              "cornerRadius": 8,
              "width": 120,
              "height": 40
            }
          ]
        }
      ]
    };

    const { setupTest } = createTestData(noOverrideData);
    const testSetup = await setupTest();
    global.figma = testSetup.figma;

    const originalGetNodeById = figma.getNodeByIdAsync;
    figma.getNodeByIdAsync = jest.fn().mockImplementation(async (id: string) => {
      const findNode = (nodes: any[], targetId: string): any => {
        for (const node of nodes) {
          if (node.id === targetId) return node;
          if (node.children) {
            const found = findNode(node.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };
      return findNode([noOverrideData], id);
    });

    try {
      const tokens = await collectTokens(jest.fn());
      const result = await transformToScssWithInstances(tokens);

      // Should still contain instance mixin but with comment about no overrides
      expect(result.result).toContain('@mixin unchanged-button');
      expect(result.result).toContain('// No override styles - inherits all styles from component');
    } finally {
      figma.getNodeByIdAsync = originalGetNodeById;
    }
  });

  it('should create snapshot of generated SCSS with instances', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();
    global.figma = testSetup.figma;

    const originalGetNodeById = figma.getNodeByIdAsync;
    figma.getNodeByIdAsync = jest.fn().mockImplementation(async (id: string) => {
      const findNode = (nodes: any[], targetId: string): any => {
        for (const node of nodes) {
          if (node.id === targetId) return node;
          if (node.children) {
            const found = findNode(node.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };
      return findNode([testData], id);
    });

    try {
      const tokens = await collectTokens(jest.fn());
      const result = await transformToScssWithInstances(tokens);

      // Use snapshot testing to ensure consistent output
      expect(result.result).toMatchSnapshot('scss-with-instances');
      expect(result.warnings).toMatchSnapshot('instance-warnings');
    } finally {
      figma.getNodeByIdAsync = originalGetNodeById;
    }
  });
});
