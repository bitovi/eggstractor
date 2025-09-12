import { collectTokens } from '../../services';
import { transformToScss } from '../../transformers';
import { createTestData } from '../../utils';
import testDataAlignment from '../fixtures/figma-test-data_layout-alignment.json';
import testDataDirection from '../fixtures/figma-test-data_layout-direction.json';
import testDataWidth from '../fixtures/figma-test-data_width.json';
import testDataHeight from '../fixtures/figma-test-data_height.json';

describe('Layout Processors', () => {
  fit('should process layout alignment correctly', async () => {
    const { setupTest } = createTestData(testDataAlignment);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('alignment');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('alignment');
  });

  it('should process layout direction correctly', async () => {
    const { setupTest } = createTestData(testDataDirection);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('direction');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('direction');
  });

  it('should process layout width correctly', async () => {
    const { setupTest } = createTestData(testDataWidth);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('width');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('width');
  });

  it('should process layout height correctly', async () => {
    const { setupTest } = createTestData(testDataHeight);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('height');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('height');
  });
});
