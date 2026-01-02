import { collectTokens } from '../../services';
import { transformToScss } from '../../transformers';
import { createTestData } from '../test.utils';
import testData from '../fixtures/figma-test-data_shadow-effects.json';

describe('Shadow Processors', () => {
  it('should process single drop shadow correctly', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('shadow-effects-template');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('shadow-effects-combinatorial');
  });

  it('should process multiple drop shadows correctly', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const shadowTokens = tokens.tokens.filter(
      (t) => t.property === 'box-shadow' && t.name.includes('multiple-drop-shadows'),
    );

    expect(shadowTokens.length).toBeGreaterThan(0);
    expect(shadowTokens[0].rawValue).toContain(','); // Multiple shadows joined
  });

  it('should process inner shadow correctly', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const shadowTokens = tokens.tokens.filter(
      (t) => t.property === 'box-shadow' && t.name.includes('inner-shadow'),
    );

    expect(shadowTokens.length).toBeGreaterThan(0);
    expect(shadowTokens[0].rawValue).toContain('inset'); // Inner shadow
  });

  it('should process combined drop and inner shadows correctly', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const shadowTokens = tokens.tokens.filter(
      (t) => t.property === 'box-shadow' && t.name.includes('combined-shadows'),
    );

    expect(shadowTokens.length).toBeGreaterThan(0);
    expect(shadowTokens[0].rawValue).toContain(','); // Multiple shadows
    expect(shadowTokens[0].rawValue).toContain('inset'); // Has inner shadow
  });

  it('should return null for nodes without effects', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const shadowTokens = tokens.tokens.filter(
      (t) => t.property === 'box-shadow' && t.name.includes('no-effects'),
    );

    // Node has no effects and no INSIDE border, so no box-shadow token
    expect(shadowTokens.length).toBe(0);
  });

  it('should filter out shadows with zero opacity', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const shadowTokens = tokens.tokens.filter(
      (t) => t.property === 'box-shadow' && t.name.includes('zero-opacity-shadow'),
    );

    // Shadow has zero opacity, should be filtered out
    expect(shadowTokens.length).toBe(0);
  });

  it('should filter out invisible shadows', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const shadowTokens = tokens.tokens.filter(
      (t) => t.property === 'box-shadow' && t.name.includes('invisible-shadow'),
    );

    // Shadow is invisible (visible: false), should be filtered out
    expect(shadowTokens.length).toBe(0);
  });

  it('should combine INSIDE border with shadow effects', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const shadowTokens = tokens.tokens.filter(
      (t) => t.property === 'box-shadow' && t.name.includes('inside-border-with-shadow'),
    );

    expect(shadowTokens.length).toBeGreaterThan(0);
    // Should have both border shadows (inset) and effect shadow
    const value = shadowTokens[0].rawValue;
    expect(value).toBeDefined();
    expect(value).toContain('inset'); // Has border shadows
    if (value) {
      expect(value.split(',').length).toBeGreaterThan(1); // Multiple shadows (border + effect)
    }
  });

  it('should allow border processor to handle INSIDE border when no shadow effects exist', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const borderTokens = tokens.tokens.filter(
      (t) => t.property === 'box-shadow' && t.name.includes('inside-border-only'),
    );

    // Should have box-shadow from border processor (not shadow processor)
    expect(borderTokens.length).toBeGreaterThan(0);
    expect(borderTokens[0].rawValue).toContain('inset'); // INSIDE border as box-shadow
  });

  it('should handle optional spread radius', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());

    // Test shadow with spread (multiple-drop-shadows has spread: 2)
    const withSpread = tokens.tokens.filter(
      (t) => t.property === 'box-shadow' && t.name.includes('multiple-drop-shadows'),
    );
    expect(withSpread.length).toBeGreaterThan(0);
    expect(withSpread[0].rawValue).toContain('2px'); // Contains spread value

    // Test shadow without spread (single-drop-shadow has spread: 0)
    const withoutSpread = tokens.tokens.filter(
      (t) => t.property === 'box-shadow' && t.name.includes('single-drop-shadow'),
    );
    expect(withoutSpread.length).toBeGreaterThan(0);
    // Should not have extra spread value in output
  });

  it('should generate correct snapshot output for template mode', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: template } = transformToScss(tokens, false);

    // Verify template mode output includes box-shadow mixins
    expect(template).toContain('box-shadow');
    expect(template).toMatchSnapshot('shadow-template-mode');
  });

  it('should generate correct snapshot output for combinatorial mode', async () => {
    const { setupTest } = createTestData(testData);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: combinatorial } = transformToScss(tokens, true);

    // Verify combinatorial mode output includes box-shadow properties
    expect(combinatorial).toContain('box-shadow');
    expect(combinatorial).toMatchSnapshot('shadow-combinatorial-mode');
  });
});
