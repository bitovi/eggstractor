import { updatePaddingStylesBasedOnBorder } from '../../../transformers/utils/updated-padding-based-on-border.utils';

describe('updatePaddingStylesBasedOnBorder', () => {
  it('should update padding based on border width', () => {
    // Test implementation here
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '16px',
          border: '2px solid black',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: '14px',
        border: '2px solid black',
      },
    });
  });
});
