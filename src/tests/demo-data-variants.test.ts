import { collectTokens } from '../services';
import { transformToScss } from '../transformers';
import { createTestData } from '../utils/test.utils';
import testDataDemo from './fixtures/figma-test-data_demo.json';
import * as variants from '../transformers/variants';

describe('Demo Data (real world-ish example for variant combinations)', () => {
  it('should process all demo data correctly with variant combinations', async () => {
    // Force feature flag for variant combinations to true for new behavior
    jest.spyOn(variants, 'USE_VARIANT_COMBINATION_PARSING').mockReturnValueOnce(true);
    
    const { setupTest } = createTestData(testDataDemo);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);

    expect(result).toMatchSnapshot('demo-data-variants');
  });
});
