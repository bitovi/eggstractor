import { collectTokens } from '../services';
import { transformToCss } from '../transformers';
import testData from './fixtures/figma-test-data.json';
import testDataSimple from './fixtures/figma-test-simple.json';

// Add this helper function at the top of the test file
function parseCssClass(css: string, className: string): string | null {
  const regex = new RegExp(`\\.${className}\\s*{([^}]*)}`, 'g');
  const match = regex.exec(css);
  if (!match) return null;
  return match[1].trim();
}

describe.skip('Processors', () => {
  it('should process background gradient correctly', async () => {    
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

    // Mock minimal Figma API with proper variable structure
    global.figma = {
      currentPage: pageNode,
      variables: {
        getVariableByIdAsync: async (id: string) => {
          const variable = testData.variables[id as keyof typeof testData.variables];
          if (!variable) return null;

          return Promise.resolve({
            ...variable,
            description: "",
            hiddenFromPublishing: false,
            resolvedType: "COLOR",
            scopes: ["ALL_SCOPES"],
            codeSyntax: {},
            remote: false,
            documentation: "",
            getPublishStatusAsync: async () => ({ status: "UNPUBLISHED" }),
            setValueForMode: () => {},
            remove: () => {},
            removeValueForMode: () => {},
            exposedToLibrary: false,
            subscribedLibraryId: null,
            subscribedLibraryOriginId: null,
            isCollectionPublished: false,
            boundVariables: [],
            variableCollectionId: "1",
            key: "key",
            resolveForConsumer: () => null,
            setVariableCodeSyntax: () => {},
            setName: () => {},
            setDescription: () => {},
            setExposedToLibrary: () => {},
            setHiddenFromPublishing: () => {},
            setScopes: () => {},
            setResolvedType: () => {},
            removeVariableCodeSyntax: () => {},
            getPluginData: () => "",
            setPluginData: () => {},
            getPluginDataKeys: () => [],
            getSharedPluginData: () => "",
            setSharedPluginData: () => {},
            removed: false
          } as unknown as Variable);
        }
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

  it('should process background gradient simple correctly', async () => {    
    // Create proper node hierarchy in test data
    const pageNode = {
      ...testDataSimple,
      type: 'PAGE',
      name: 'background',
      parent: null,
      width: 100,  // Add default dimensions
      height: 100
    };

    // Update children to have proper parent references
    const children = testDataSimple.children.map((child: BaseNode) => ({
      ...child,
      parent: pageNode,
      width: 100,  // Add dimensions to children
      height: 100
    }));
    pageNode.children = children;

    // Mock minimal Figma API with proper variable structure
    global.figma = {
      currentPage: pageNode,
      variables: {
        getVariableByIdAsync: async (id: string) => {
          const variable = testDataSimple.variables[id as keyof typeof testDataSimple.variables];
          if (!variable) return null;

          return Promise.resolve({
            ...variable,
            description: "",
            hiddenFromPublishing: false,
            resolvedType: "COLOR",
            scopes: ["ALL_SCOPES"],
            codeSyntax: {},
            remote: false,
            documentation: "",
            getPublishStatusAsync: async () => ({ status: "UNPUBLISHED" }),
            setValueForMode: () => {},
            remove: () => {},
            removeValueForMode: () => {},
            exposedToLibrary: false,
            subscribedLibraryId: null,
            subscribedLibraryOriginId: null,
            isCollectionPublished: false,
            boundVariables: [],
            variableCollectionId: "1",
            key: "key",
            resolveForConsumer: () => null,
            setVariableCodeSyntax: () => {},
            setName: () => {},
            setDescription: () => {},
            setExposedToLibrary: () => {},
            setHiddenFromPublishing: () => {},
            setScopes: () => {},
            setResolvedType: () => {},
            removeVariableCodeSyntax: () => {},
            getPluginData: () => "",
            setPluginData: () => {},
            getPluginDataKeys: () => [],
            getSharedPluginData: () => "",
            setSharedPluginData: () => {},
            removed: false
          } as unknown as Variable);
        }
      }
    };

    const tokens = await collectTokens();    
    const css = transformToCss(tokens);

    // Test specific styles with snapshots
    const styles = {
      linear: parseCssClass(css, 'background-gradient-top-bottom'),
    };

    // Keep direct assertions for critical values
    expect(styles.linear).toBe('background: linear-gradient(180deg, #000 -6.5%, #FFF 110%);');
  });
}); 