import { collectTokens } from '../../services';
import { transformToCss, transformToScss } from '../../transformers';
import testData from '../fixtures/figma-test-data_background.json';
import testDataOpacity from '../fixtures/figma-test-data_opacity.json';
import { createTestData } from '../../utils';

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

    const tokens = await collectTokens(vi.fn());
    const { result: template } = transformToCss(tokens, false);

    const templateStyles = {
      solid: parseCssClass(template, 'background-solid-variable'),
      alpha: parseCssClass(template, 'background-solid-alpha-variable'),
    };

    expect(templateStyles).toMatchSnapshot('solid styles');
    expect(templateStyles.solid).toBe('background: #00464a;');
    expect(templateStyles.alpha).toBe('background: rgba(0, 70, 74, 0.5);');

    const { result: combinatorial } = transformToCss(tokens, true);

    const combinatorialStyles = {
      solid: parseCssClass(combinatorial, 'background-solid-variable'),
      alpha: parseCssClass(combinatorial, 'background-solid-alpha-variable'),
    };

    expect(combinatorialStyles).toMatchSnapshot('solid styles');
    expect(combinatorialStyles.solid).toBe('background: #00464a;');
    expect(combinatorialStyles.alpha).toBe('background: rgba(0, 70, 74, 0.5);');
  });

  it('should process background solid correctly - sass', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('solid styles');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('solid styles');
  });

  it('should process opacity correctly', async () => {
    const { setupTest } = createTestData(testDataOpacity);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('opacity styles');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('opacity styles');
  });

  it('should skip background gradient correctly', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: template, warnings: templateWarnings } = transformToCss(tokens, false);

    // Test specific styles with snapshots
    const templateStyles = {
      linear: parseCssClass(template, 'background-gradient-linear-style'),
      linearAlpha: parseCssClass(template, 'background-gradient-linear-alpha-style'),
    };

    // Snapshot all styles
    expect(templateStyles).toMatchSnapshot('gradient styles');

    // We no longer warn on these values since they are skipped in the collection
    expect(templateWarnings).toHaveLength(0);

    // Keep direct assertions for critical values
    expect(templateStyles.linear).toBe(null);
    expect(templateStyles.linearAlpha).toBe(null);

    const { result: combinatorial, warnings: combinatorialWarnings } = transformToCss(tokens, true);

    // Test specific styles with snapshots
    const combinatorialStyles = {
      linear: parseCssClass(combinatorial, 'background-gradient-linear-style'),
      linearAlpha: parseCssClass(combinatorial, 'background-gradient-linear-alpha-style'),
    };

    // Snapshot all styles
    expect(combinatorialStyles).toMatchSnapshot('gradient styles');

    // We no longer warn on these values since they are skipped in the collection
    expect(combinatorialWarnings).toHaveLength(0);

    // Keep direct assertions for critical values
    expect(combinatorialStyles.linear).toBe(null);
    expect(combinatorialStyles.linearAlpha).toBe(null);
  });
});
