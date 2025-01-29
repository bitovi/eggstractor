import { collectTokens } from '../services';
import { transformToCss, transformToScss } from '../transformers';
import testData from './fixtures/figma-test-data_padding.json';
import { createTestVariableResolver } from '../utils/test.utils';

// Add this helper function at the top of the test file
function parseCssClass(css: string, className: string): string | null {
  const regex = new RegExp(`\\.${className}\\s*{([^}]*)}`, 'g');
  const match = regex.exec(css);
  if (!match) return null;
  return match[1].trim();
}

describe('Padding Processors', () => {
  it('should process padding correctly', async () => {    
    const pageNode = {
      ...testData,
      type: 'PAGE',
      name: 'padding',
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
    const { result} = transformToScss(tokens);

    expect(result).toMatchSnapshot('padding');
  });
}); 