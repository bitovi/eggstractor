import { collectTokens } from '../services';
import { ProcessedValue } from '../types';
import { transformToScss } from '../transformers';
import { fontProcessors } from '../processors/font.processor';
import { createTestVariableResolver } from '../utils/test.utils';
import testData from './fixtures/figma-test-data_paragraph.json';
import testDataAlignment from './fixtures/figma-test-data-alignment.json';
import testDataFontStyle from './fixtures/figma-test-data_font-style.json';

describe('Text Processors', () => {
  describe('Text Align Processor', () => {
    const processor = fontProcessors.filter(p => p.property === 'text-align')[0];

    it('returns null for non-text nodes', async () => {
      const node = {
        type: 'RECTANGLE'
      } as SceneNode;

      const result = await processor.process([], node);
      expect(result).toBeNull();
    });

    it('processes text alignment correctly', async () => {
      const testCases = [
        {
          name: 'center alignment',
          input: {
            type: 'TEXT',
            textAlignHorizontal: 'CENTER',
          } as SceneNode,
          expected: {
            value: 'center',
            rawValue: 'center'
          }
        },
        {
          name: 'right alignment',
          input: {
            type: 'TEXT',
            textAlignHorizontal: 'RIGHT',
          } as SceneNode,
          expected: {
            value: 'right',
            rawValue: 'right'
          }
        },
        {
          name: 'justified alignment',
          input: {
            type: 'TEXT',
            textAlignHorizontal: 'JUSTIFIED',
          } as SceneNode,
          expected: {
            value: 'justify',
            rawValue: 'justify'
          }
        }
      ];

      for (const testCase of testCases) {
        const result = await processor.process([], testCase.input);
        expect(result).toEqual(testCase.expected as ProcessedValue);
      }
    });

    it('should process text alignment correctly', async () => {    
      const pageNode = {
        ...testData,
        type: 'PAGE',
        name: 'text-alignment',
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
      const { result } = transformToScss(tokens);
  
      expect(result).toMatchSnapshot('text-alignment');
    });
    
    it('should process paragraph alignment correctly', async () => {    
      const pageNode = {
        ...testDataAlignment,
        type: 'PAGE',
        name: 'paragraph-alignment',
        parent: null,
        width: 100,
        height: 100
      };
  
      const children = testDataAlignment.children.map((child: BaseNode) => ({
        ...child,
        parent: pageNode,
        width: 100,
        height: 100
      }));
      pageNode.children = children;
  
      // Create variable resolver with complete test data
      const getVariableByIdAsync = await createTestVariableResolver(testDataAlignment);
  
      // Mock Figma API
      global.figma = {
        currentPage: pageNode,
        variables: {
          getVariableByIdAsync
        }
      };
  
      const tokens = await collectTokens();    
      const { result } = transformToScss(tokens);
  
      expect(result).toMatchSnapshot('paragraph-alignment');
    });

    it('should process font style correctly', async () => {    
      const pageNode = {
        ...testDataFontStyle,
        type: 'PAGE',
        name: 'font-style',
        parent: null,
        width: 100,
        height: 100
      };

      const children = testDataFontStyle.children.map((child: BaseNode) => ({
        ...child,
        parent: pageNode,
        width: 100,
        height: 100
      }));
      pageNode.children = children;
  
      // Create variable resolver with complete test data
      const getVariableByIdAsync = await createTestVariableResolver(testDataFontStyle);
  
      // Mock Figma API
      global.figma = {
        currentPage: pageNode,
        variables: {
          getVariableByIdAsync
        }
      };
  
      const tokens = await collectTokens();    
      const { result } = transformToScss(tokens);
  
      expect(result).toMatchSnapshot('font-style');
    });
  });
}); 