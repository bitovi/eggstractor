import { collectTokens } from '../../services';
import { transformToScss } from '../../transformers';
import { createTestData } from '../../utils';
import testData from '../fixtures/figma-test-data_border-position.json';
import testDataSides from '../fixtures/figma-test-data_border-sides.json';
import testDataShape from '../fixtures/figma-test-data_border-shape.json';
import testDataRadius from '../fixtures/figma-test-data_border-radius.json';

describe('Border Processors', () => {
  it('should process border correctly', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);

    expect(result).toMatchSnapshot('border');
  });

  it('should process border sides correctly', async () => {
    const { setupTest } = createTestData(testDataSides);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);

    expect(result).toMatchSnapshot('border-sides');
  });

  it('should process border shape correctly', async () => {
    const { setupTest } = createTestData(testDataShape);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);

    expect(result).toMatchSnapshot('border-shape');
  });

  it('should process border radius correctly', async () => {
    const { setupTest } = createTestData(testDataRadius);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);

    expect(result).toMatchSnapshot('border-radius');
  });
});
