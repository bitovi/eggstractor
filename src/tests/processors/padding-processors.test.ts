import { collectTokens } from '../../services';
import { transformToScss } from '../../transformers';
import testData from '../fixtures/figma-test-data_padding.json';
import { createTestData } from '../../utils';

describe('Padding Processors', () => {
  it('should process padding correctly', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('padding');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('padding');
  });
});
