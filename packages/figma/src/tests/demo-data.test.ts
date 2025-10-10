import { collectTokens } from '../services';
import { transformToScss } from '../transformers';
import testDataDemo from './fixtures/figma-test-data_demo.json';
import { createTestData } from './test.utils';

describe('Demo Data (real world-ish example)', () => {
  it('should process all demo data correctly', async () => {
    const { setupTest } = createTestData(testDataDemo);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('demo-data-template');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('demo-data-combinatorial');
  });
});
