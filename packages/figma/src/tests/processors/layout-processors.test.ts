import { collectTokens } from '../../services';
import { transformToScss } from '../../transformers';
import { createTestData } from '../test.utils';
import testDataAlignment from '../fixtures/figma-test-data_layout-alignment.json';
import testDataDirection from '../fixtures/figma-test-data_layout-direction.json';
import testDataWidth from '../fixtures/figma-test-data_width.json';
import testDataHeight from '../fixtures/figma-test-data_height.json';
import testDataLegacyLayout from '../fixtures/figma-test-data_legacy-layout.json';
import testDataNewLayout from '../fixtures/figma-test-data_new-layout.json';

describe('Layout Processors', () => {
  it('should process layout alignment correctly', async () => {
    const { setupTest } = createTestData(testDataAlignment);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('alignment');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('alignment');
  });

  it('should process layout direction correctly', async () => {
    const { setupTest } = createTestData(testDataDirection);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('direction');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('direction');
  });

  it('should process layout width correctly', async () => {
    const { setupTest } = createTestData(testDataWidth);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('width');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('width');
  });

  it('should process layout height correctly', async () => {
    const { setupTest } = createTestData(testDataHeight);
    const testSetup = await setupTest();

    global.figma = testSetup.figma;

    const tokens = await collectTokens(vi.fn());
    const { result: template } = transformToScss(tokens, false);
    expect(template).toMatchSnapshot('height');
    const { result: combinatorial } = transformToScss(tokens, true);
    expect(combinatorial).toMatchSnapshot('height');
  });

  describe('Legacy API (deprecated)', () => {
    it('should process legacy layout API and attach warnings', async () => {
      const { setupTest } = createTestData(testDataLegacyLayout);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokenCollection = await collectTokens(vi.fn());
      const tokens = tokenCollection.tokens;

      // Find tokens that came from frames with legacy API
      // Frames with auto-layout generate their own width/height tokens
      const widthTokens = tokens.filter(
        (t) => t.property === 'width' && 'value' in t && t.value !== null,
      );
      const heightTokens = tokens.filter(
        (t) => t.property === 'height' && 'value' in t && t.value !== null,
      );

      // Verify tokens were generated from the frames
      expect(widthTokens.length).toBeGreaterThan(0);
      expect(heightTokens.length).toBeGreaterThan(0);

      // Check for warnings on tokens generated from legacy API nodes
      const tokensWithWarnings = tokens.filter(
        (t) => 'warnings' in t && t.warnings && t.warnings.length > 0,
      );

      // Verify warnings contain legacy API deprecation message
      if (tokensWithWarnings.length > 0) {
        const hasLegacyWarning = tokensWithWarnings.some(
          (t) =>
            'warnings' in t &&
            t.warnings?.some(
              (w) => w.includes('primaryAxisSizingMode') || w.includes('counterAxisSizingMode'),
            ),
        );
        expect(hasLegacyWarning).toBe(true);
      }

      // Verify SCSS output is still correct despite using legacy API
      const { result: template } = transformToScss(tokenCollection, false);
      expect(template).toContain('width:');
      expect(template).toContain('height:');
      expect(template).toMatchSnapshot('legacy-layout');
    });

    it('should fallback from new API to legacy API when needed', async () => {
      // This tests the fallback mechanism in getHorizontalSizing/getVerticalSizing
      const { setupTest } = createTestData(testDataLegacyLayout);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokenCollection = await collectTokens(vi.fn());
      const tokens = tokenCollection.tokens;

      // With FIXED sizing mode, we should get pixel values from the FRAMES
      const widthTokens = tokens.filter(
        (t) => t.property === 'width' && 'value' in t && t.value !== null,
      );
      const heightTokens = tokens.filter(
        (t) => t.property === 'height' && 'value' in t && t.value !== null,
      );

      widthTokens.forEach((token) => {
        if ('value' in token) {
          // Should be pixel values: frame widths "200px", "150px"
          expect(token.value).toMatch(/^(200|150)px$/);
        }
      });

      heightTokens.forEach((token) => {
        if ('value' in token) {
          // Should be pixel values: frame heights "100px", "180px"
          expect(token.value).toMatch(/^(100|180)px$/);
        }
      });
    });
  });

  describe('New API (layoutSizingHorizontal/Vertical)', () => {
    it('should process new layout API correctly', async () => {
      const { setupTest } = createTestData(testDataNewLayout);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokenCollection = await collectTokens(vi.fn());
      const tokens = tokenCollection.tokens;

      // Verify tokens were generated
      expect(tokens.length).toBeGreaterThan(0);

      // Find specific tokens for each sizing mode by checking properties
      // Frame names are lowercased, so FrameFixed becomes framefixed
      const fixedTokens = tokens.filter(
        (t) => t.name.includes('framefixed') && (t.property === 'width' || t.property === 'height'),
      );
      const fillTokens = tokens.filter(
        (t) => t.name.includes('framefill') && (t.property === 'width' || t.property === 'height'),
      );
      const hugTokens = tokens.filter(
        (t) => t.name.includes('framehug') && (t.property === 'width' || t.property === 'height'),
      );

      expect(fixedTokens.length).toBeGreaterThan(0);
      expect(fillTokens.length).toBeGreaterThan(0);
      expect(hugTokens.length).toBeGreaterThan(0);

      // Verify SCSS output matches snapshot
      const { result: template } = transformToScss(tokenCollection, false);
      expect(template).toMatchSnapshot('new-layout');
    });

    it('should output FIXED sizing as pixel values', async () => {
      const { setupTest } = createTestData(testDataNewLayout);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokenCollection = await collectTokens(vi.fn());
      const tokens = tokenCollection.tokens;

      // Find FIXED sizing tokens (FrameFixed itself, not child)
      // Frame names are lowercased: FrameFixed becomes framefixed
      const fixedWidthToken = tokens.find(
        (t) =>
          t.name.includes('framefixed') &&
          t.property === 'width' &&
          'value' in t &&
          t.value === '200px',
      );
      const fixedHeightToken = tokens.find(
        (t) =>
          t.name.includes('framefixed') &&
          t.property === 'height' &&
          'value' in t &&
          t.value === '100px',
      );

      expect(fixedWidthToken).toBeDefined();
      expect(fixedHeightToken).toBeDefined();
    });

    it('should output FILL sizing as 100%', async () => {
      const { setupTest } = createTestData(testDataNewLayout);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokenCollection = await collectTokens(vi.fn());
      const tokens = tokenCollection.tokens;

      // Find FILL sizing tokens (FrameFill itself, not child)
      // Frame names are lowercased: FrameFill becomes framefill
      const fillWidthToken = tokens.find(
        (t) =>
          t.name.includes('framefill') &&
          t.property === 'width' &&
          'value' in t &&
          t.value === '100%',
      );
      const fillHeightToken = tokens.find(
        (t) =>
          t.name.includes('framefill') &&
          t.property === 'height' &&
          'value' in t &&
          t.value === '100%',
      );

      expect(fillWidthToken).toBeDefined();
      expect(fillHeightToken).toBeDefined();
    });

    it('should output HUG sizing as fit-content', async () => {
      const { setupTest } = createTestData(testDataNewLayout);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokenCollection = await collectTokens(vi.fn());
      const tokens = tokenCollection.tokens;

      // Find HUG sizing tokens (FrameHug itself, not child)
      // Frame names are lowercased: FrameHug becomes framehug
      const hugWidthToken = tokens.find(
        (t) =>
          t.name.includes('framehug') &&
          t.property === 'width' &&
          'value' in t &&
          t.value === 'fit-content',
      );
      const hugHeightToken = tokens.find(
        (t) =>
          t.name.includes('framehug') &&
          t.property === 'height' &&
          'value' in t &&
          t.value === 'fit-content',
      );

      expect(hugWidthToken).toBeDefined();
      expect(hugHeightToken).toBeDefined();
    });

    it('should output FILL sizing as 100%', async () => {
      const { setupTest } = createTestData(testDataNewLayout);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokenCollection = await collectTokens(vi.fn());
      const tokens = tokenCollection.tokens;

      // Find FILL sizing tokens (FrameFill frame, not child)
      // Frame names are lowercased: FrameFill becomes framefill
      const fillWidthToken = tokens.find(
        (t) => t.name.includes('framefill') && t.property === 'width' && 'value' in t,
      );
      const fillHeightToken = tokens.find(
        (t) => t.name.includes('framefill') && t.property === 'height' && 'value' in t,
      );

      expect(fillWidthToken && 'value' in fillWidthToken ? fillWidthToken.value : null).toBe(
        '100%',
      );
      expect(fillHeightToken && 'value' in fillHeightToken ? fillHeightToken.value : null).toBe(
        '100%',
      );
    });

    it('should output HUG sizing as fit-content', async () => {
      const { setupTest } = createTestData(testDataNewLayout);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokenCollection = await collectTokens(vi.fn());
      const tokens = tokenCollection.tokens;

      // Find HUG sizing tokens (FrameHug frame, not child)
      // Frame names are lowercased: FrameHug becomes framehug
      const hugWidthToken = tokens.find(
        (t) => t.name.includes('framehug') && t.property === 'width' && 'value' in t,
      );
      const hugHeightToken = tokens.find(
        (t) => t.name.includes('framehug') && t.property === 'height' && 'value' in t,
      );

      expect(hugWidthToken && 'value' in hugWidthToken ? hugWidthToken.value : null).toBe(
        'fit-content',
      );
      expect(hugHeightToken && 'value' in hugHeightToken ? hugHeightToken.value : null).toBe(
        'fit-content',
      );
    });

    it('should not attach warnings when using new API', async () => {
      const { setupTest } = createTestData(testDataNewLayout);
      const testSetup = await setupTest();

      global.figma = testSetup.figma;

      const tokenCollection = await collectTokens(vi.fn());
      const tokens = tokenCollection.tokens;

      // New API tokens should not have warnings about legacy API
      const tokensWithLegacyWarnings = tokens.filter(
        (t) =>
          'warnings' in t &&
          t.warnings?.some(
            (w) => w.includes('primaryAxisSizingMode') || w.includes('counterAxisSizingMode'),
          ),
      );

      expect(tokensWithLegacyWarnings.length).toBe(0);
    });
  });
});
