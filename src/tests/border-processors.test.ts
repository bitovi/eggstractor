import { collectTokens } from '../services';
import { transformToScss } from '../transformers';
import { createTestData } from '../utils/test.utils';
import testData from './fixtures/figma-test-data_border-position.json';
import testDataSides from './fixtures/figma-test-data_border-sides.json';


describe('Border Processors', () => {
  it('should process border correctly', async () => {    
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();
    
    global.figma = testSetup.figma;

    const tokens = await collectTokens();     
    const { result} = transformToScss(tokens);

    expect(result).toMatchSnapshot('border');
  });

  it('should process border sides correctly', async () => {    
    const { setupTest } = createTestData(testDataSides);
    const testSetup = await setupTest();
    
    global.figma = testSetup.figma;

    const tokens = await collectTokens();     
    const { result} = transformToScss(tokens);

    expect(result).toMatchSnapshot('border-sides');
  });
}); 