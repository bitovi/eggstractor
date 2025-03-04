import { collectTokens } from '../services';
import { transformToScss } from '../transformers';
import { createTestData } from '../utils/test.utils';
import testDataDemo from './fixtures/figma-test-data_demo.json';

describe('Demo Data (real world-ish exmaple)', () => {

  it('should process all demo data correctly', async () => {    
    const { setupTest } = createTestData(testDataDemo);
    const testSetup = await setupTest();
    
    global.figma = testSetup.figma;

    const tokens = await collectTokens();     
    const { result } = transformToScss(tokens);

    expect(result).toMatchSnapshot('demo-data');
  });
}); 