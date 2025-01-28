import { collectTokens } from '../services';
import { transformToCss } from '../transformers';
import testData from './fixtures/figma-test-data.json';
import { createTestVariableResolver } from '../utils/test.utils';

// Add this helper function at the top of the test file
function parseCssClass(css: string, className: string): string | null {
  const regex = new RegExp(`\\.${className}\\s*{([^}]*)}`, 'g');
  const match = regex.exec(css);
  if (!match) return null;
  return match[1].trim();
}

describe('Background Processors', () => {
  it('should process background solid correctly', async () => {    
    const pageNode = {
      ...testData,
      type: 'PAGE',
      name: 'background',
      parent: null,
      width: 100,
      height: 100
    };

    const children = testData.children.map((child: BaseNode) => ({
      ...child,
      parent: pageNode,
      width: 100,
      height: 100
    }));
    pageNode.children = children;

    // Create variable resolver with complete test data
    const getVariableByIdAsync = await createTestVariableResolver(testData);

    // Mock Figma API
    global.figma = {
      currentPage: pageNode,
      variables: {
        getVariableByIdAsync
      }
    };

    const tokens = await collectTokens();    
    const css = transformToCss(tokens);

    const styles = {
      solid: parseCssClass(css, 'background-solid-variable'),
      alpha: parseCssClass(css, 'background-solid-alpha-variable'),
    };

    expect(styles).toMatchSnapshot('solid styles');
    expect(styles.solid).toBe('background: #00464a;');
    expect(styles.alpha).toBe('background: #00464a80;');
  });

  it.skip('should process background gradient correctly', async () => {    
    // Create proper node hierarchy in test data
    const pageNode = {
      ...testData,
      type: 'PAGE',
      name: 'background',
      parent: null,
      width: 100,  // Add default dimensions
      height: 100
    };

    // Update children to have proper parent references
    const children = testData.children.map((child: BaseNode) => ({
      ...child,
      parent: pageNode,
      width: 100,  // Add dimensions to children
      height: 100
    }));
    pageNode.children = children;

    const getVariableByIdAsync = await createTestVariableResolver(testData);

    // Mock Figma API
    global.figma = {
      currentPage: pageNode,
      variables: {
        getVariableByIdAsync
      }
    };

    const tokens = await collectTokens();    
    const css = transformToCss(tokens);

    // Test specific styles with snapshots
    const styles = {
      linear: parseCssClass(css, 'background-gradient-linear-style'),
      radial: parseCssClass(css, 'background-gradient-radial-style'),
      angular: parseCssClass(css, 'background-gradient-angular-style'),
      linearAlpha: parseCssClass(css, 'background-gradient-linear-alpha-style')
    };

    // Snapshot all styles
    expect(styles).toMatchSnapshot('gradient styles');

    // Keep direct assertions for critical values
    expect(styles.linear).toBe('background: linear-gradient(224deg, #00464A 3.74%, #04646A 98.29%);');
    expect(styles.linearAlpha).toBe('background:  linear-gradient(224deg, rgba(0, 70, 74, 0.50) 3.74%, #04646A 98.29%);');
  });
}); 