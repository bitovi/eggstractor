import { collectTokens } from '../../services';
import { ProcessedValue } from '../../types';
import { transformToScss } from '../../transformers';
import { fontProcessors } from '../../processors/font.processor';
import { createTestData } from '../../utils';
import testData from '../fixtures/figma-test-data_paragraph.json';
import testDataAlignment from '../fixtures/figma-test-data-alignment.json';
import testDataFontStyle from '../fixtures/figma-test-data_font-style.json';

describe('Text Processors', () => {
  describe('Text Align Processor', () => {
    const processor = fontProcessors.filter(
      (p) => p.property === 'text-align',
    )[0];

    it('returns null for non-text nodes', async () => {
      const node = {
        type: 'RECTANGLE',
      } as SceneNode;

      const result = await processor.process(new Map(), node);
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
            rawValue: 'center',
          },
        },
        {
          name: 'right alignment',
          input: {
            type: 'TEXT',
            textAlignHorizontal: 'RIGHT',
          } as SceneNode,
          expected: {
            value: 'right',
            rawValue: 'right',
          },
        },
        {
          name: 'justified alignment',
          input: {
            type: 'TEXT',
            textAlignHorizontal: 'JUSTIFIED',
          } as SceneNode,
          expected: {
            value: 'justify',
            rawValue: 'justify',
          },
        },
      ];

      for (const testCase of testCases) {
        const result = await processor.process(new Map(), testCase.input);
        expect(result).toEqual(testCase.expected as ProcessedValue);
      }
    });

    it('should process text alignment correctly', async () => {
      const { setupTest } = createTestData(testData);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokens = await collectTokens(vi.fn());
      const { result: template } = transformToScss(tokens, false);
      expect(template).toMatchSnapshot('text-alignment');
      const { result: combinatorial } = transformToScss(tokens, true);
      expect(combinatorial).toMatchSnapshot('text-alignment');
    });

    it('should process paragraph alignment correctly', async () => {
      const { setupTest } = createTestData(testDataAlignment);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokens = await collectTokens(vi.fn());
      const { result: template } = transformToScss(tokens, false);
      expect(template).toMatchSnapshot('paragraph-alignment');
      const { result: combinatorial } = transformToScss(tokens, true);
      expect(combinatorial).toMatchSnapshot('paragraph-alignment');
    });

    it('should process font style correctly', async () => {
      const { setupTest } = createTestData(testDataFontStyle);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokens = await collectTokens(vi.fn());
      const { result: template } = transformToScss(tokens, false);
      expect(template).toMatchSnapshot('font-style');
      const { result: combinatorial } = transformToScss(tokens, true);
      expect(combinatorial).toMatchSnapshot('font-style');
    });
  });
});
