import { collectTokens } from '../../services';
import { transformToCss, transformToScss } from '../../transformers';
import testData from '../fixtures/figma-test-data_background.json';
import testDataOpacity from '../fixtures/figma-test-data_opacity.json';
import { createTestData } from '../../utils/test.utils';

// Add this helper function at the top of the test file
function parseCssClass(css: string, className: string): string | null {
  const regex = new RegExp(`\\.${className}\\s*{([^}]*)}`, 'g');
  const match = regex.exec(css);
  if (!match) return null;
  return match[1].trim();
}

describe('Background Processors', () => {
  it('should process background solid correctly', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result: css } = transformToCss(tokens);

    const styles = {
      solid: parseCssClass(css, 'background-solid-variable'),
      alpha: parseCssClass(css, 'background-solid-alpha-variable'),
    };

    expect(styles).toMatchSnapshot('solid styles');
    expect(styles.solid).toBe('background: #00464a;');
    expect(styles.alpha).toBe('background: rgba(0, 70, 74, 0.5);');
  });

  it('should process background solid correctly - sass', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);

    expect(result).toMatchSnapshot('solid styles');
  });

  it('should process opacity correctly', async () => {
    const { setupTest } = createTestData(testDataOpacity);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result } = transformToScss(tokens);

    expect(result).toMatchSnapshot('opacity styles');
  });

  it('should process background gradient correctly', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(jest.fn());
    const { result: css, warnings } = transformToCss(tokens);

    // Test specific styles with snapshots
    const styles = {
      linear: parseCssClass(css, 'background-gradient-linear-style'),
      linearAlpha: parseCssClass(css, 'background-gradient-linear-alpha-style'),
    };

    // Snapshot all styles
    expect(warnings).toMatchSnapshot('gradient warnings');
    expect(styles).toMatchSnapshot('gradient styles');

    expect(warnings).toHaveLength(12);

    // Keep direct assertions for critical values
    expect(styles.linear).toBe('background: linear-gradient(224deg, #00464A 0%, #04646A 100%);');
    expect(styles.linearAlpha).toBe(
      'background: linear-gradient(224deg, rgba(0, 70, 74, 0.5) 0%, #04646A 100%);',
    );
  });
});
