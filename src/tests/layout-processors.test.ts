import { collectTokens } from '../services';
import { transformToScss } from '../transformers';
import { createTestData } from '../utils/test.utils';
import testDataAlignment from './fixtures/figma-test-data_layout-alignment.json';
import testDataDirection from './fixtures/figma-test-data_layout-direction.json';
import testDataWidth from './fixtures/figma-test-data_width.json';
import testDataHeight from './fixtures/figma-test-data_height.json';

describe('Layout Processors', () => {
  it('should process layout alignment correctly', async () => {
    const { setupTest } = createTestData(testDataAlignment);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);
    expect(result).toMatchSnapshot('alignment');
  });

  it('should process layout direction correctly', async () => {
    const { setupTest } = createTestData(testDataDirection);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);
    expect(result).toMatchSnapshot('direction');
  });

  it('should process layout width correctly', async () => {
    const { setupTest } = createTestData(testDataWidth);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);
    expect(result).toMatchSnapshot('width');
  });

  it('should process layout height correctly', async () => {
    const { setupTest } = createTestData(testDataHeight);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);
    expect(result).toMatchSnapshot('height');
  });
});
