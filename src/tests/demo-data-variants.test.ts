import { collectTokens } from '../services';
import { transformToScss } from '../transformers';
import { createTestData } from '../utils';
import testDataDemo from './fixtures/figma-test-data_demo.json';

describe('Demo Data (real world-ish example for variant combinations)', () => {
  it('should process all demo data correctly with variant combinations', async () => {
    const { setupTest } = createTestData(testDataDemo);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens, true);

    expect(result).toMatchSnapshot('demo-data-variants');
  });
});
