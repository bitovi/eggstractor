import { collectTokens } from '../services';
import { transformToScss } from '../transformers';
import { createTestData } from '../utils/test.utils';
import testDataDemo from './fixtures/figma-test-data_demo.json';
import * as variants from '../transformers/variants';

describe('Demo Data (real world-ish example)', () => {
  it('should process all demo data correctly', async () => {
    // Force feature flag for variant combinations to false for existing/old behavior
    jest.spyOn(variants, 'USE_VARIANT_COMBINATION_PARSING').mockReturnValueOnce(false);

    const { setupTest } = createTestData(testDataDemo);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);

    expect(result).toMatchSnapshot('demo-data');
  });
});
