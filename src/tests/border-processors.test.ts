import { collectTokens } from '../services';
import { transformToScss } from '../transformers';
import testData from './fixtures/figma-test-data_border-position.json';
import { createTestData } from '../utils/test.utils';


describe('Border Processors', () => {
  it('should process border correctly', async () => {    
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();
    
    global.figma = testSetup.figma;

    const tokens = await collectTokens();     
    const { result} = transformToScss(tokens);

    expect(result).toMatchSnapshot('border');
  });
}); 