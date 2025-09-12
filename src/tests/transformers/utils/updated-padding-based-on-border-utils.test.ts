import { updatePaddingStylesBasedOnBorder } from '../../../transformers/patches/update-size-and-position-based-on-border';

describe('updatePaddingStylesBasedOnBorder', () => {
  it('updates uniform padding px with uniform border px (keep shorthand)', () => {
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

  it('keeps styles unchanged when no border is present (keep shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: { padding: '12px' },
      }),
    ).toStrictEqual({
      styles: { padding: '12px' },
    });
  });

  it('updates per-side paddings with uniform border px (all four -> convert to shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          'padding-top': '10px',
          'padding-right': '12px',
          'padding-bottom': '14px',
          'padding-left': '16px',
          border: '3px solid #000',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: '7px 9px 11px 13px',
        border: '3px solid #000',
      },
    });
  });

  it('updates only the sides that are defined (padding-left only + uniform border) (missing sides -> no shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          'padding-left': '20px',
          border: '4px solid #000',
        },
      }),
    ).toStrictEqual({
      styles: {
        'padding-left': '16px',
        border: '4px solid #000',
      },
    });
  });

  it('updates padding shorthand with four values against uniform border (keep 4-value shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '20px 18px 16px 14px',
          border: '2px solid red',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: '18px 16px 14px 12px',
        border: '2px solid red',
      },
    });
  });

  it('updates uniform padding rem with uniform border px using calc() (keep shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '1rem',
          border: '2px solid #333',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: 'calc(1rem - 2px)',
        border: '2px solid #333',
      },
    });
  });

  it('updates per-side rem paddings with uniform border px using calc() (all four -> convert to shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          'padding-top': '1rem',
          'padding-right': '1.25rem',
          'padding-bottom': '2rem',
          'padding-left': '0.5rem',
          border: '3px solid #333',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: 'calc(1rem - 3px) calc(1.25rem - 3px) calc(2rem - 3px) calc(0.5rem - 3px)',
        border: '3px solid #333',
      },
    });
  });

  it('updates uniform padding rem with uniform border rem (keep shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '2rem',
          'border-width': '0.25rem',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: '1.75rem',
        'border-width': '0.25rem',
      },
    });
  });

  it('handles padding shorthand + per-side border-width (keep shorthand result with 4 values)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '20px',
          'border-top-width': '1px',
          'border-right-width': '2px',
          'border-bottom-width': '3px',
          'border-left-width': '4px',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: '19px 18px 17px 16px',
        'border-top-width': '1px',
        'border-right-width': '2px',
        'border-bottom-width': '3px',
        'border-left-width': '4px',
      },
    });
  });

  it('handles per-side paddings + border-width shorthand (all four -> convert to shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          'padding-top': '10px',
          'padding-right': '12px',
          'padding-bottom': '14px',
          'padding-left': '16px',
          'border-width': '1px 2px 3px 4px',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: '9px 10px 11px 12px',
        'border-width': '1px 2px 3px 4px',
      },
    });
  });

  it('handles 2-value border-width shorthand (vertical horizontal) and keeps padding shorthand', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '10px 20px', // top/bottom | right/left
          'border-width': '1px 3px',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: '9px 17px',
        'border-width': '1px 3px',
      },
    });
  });

  it('handles 3-value padding shorthand with uniform border (keep 3-value shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '12px 16px 20px', // top | left/right | bottom
          border: '2px solid blue',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: '10px 14px 18px',
        border: '2px solid blue',
      },
    });
  });

  it('only adjusts sides that exist; when all four exist, convert to shorthand; otherwise do not', () => {
    // Case A: all four sides exist -> shorthand
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          'padding-top': '10px',
          'padding-right': '10px',
          'padding-bottom': '10px',
          'padding-left': '10px',
          'border-top-width': '2px',
          'border-left-width': '4px',
        },
      }),
    ).toStrictEqual({
      styles: {
        // top: 8, right: 10, bottom: 10, left: 6
        padding: '8px 10px 10px 6px',
        'border-top-width': '2px',
        'border-left-width': '4px',
      },
    });

    // Case B: missing sides -> no shorthand
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          'padding-top': '10px',
          'padding-right': '10px',
          'padding-left': '10px',
          'border-top-width': '2px',
        },
      }),
    ).toStrictEqual({
      styles: {
        'padding-top': '8px',
        'padding-right': '10px',
        'padding-left': '10px',
        'border-top-width': '2px',
      },
    });
  });

  it('handles SCSS variable padding with px border via calc() (keep shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '$space-4',
          border: '2px solid #111',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: 'calc(#{$space-4} - 2px)',
        border: '2px solid #111',
      },
    });
  });

  it('handles SCSS variable padding with SCSS variable border via calc() (keep shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '$space-3',
          'border-width': '$border-sm',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: 'calc(#{$space-3} - #{$border-sm})',
        'border-width': '$border-sm',
      },
    });
  });

  it('handles mixed: padding shorthand + padding-right override + uniform border (keep shorthand with 4 values)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '12px',
          'padding-right': '20px',
          border: '3px solid #000',
        },
      }),
    ).toStrictEqual({
      styles: {
        // top, right, bottom, left
        padding: '9px 17px 9px 9px',
        border: '3px solid #000',
      },
    });
  });

  it('handles border per-side declarations overriding border shorthand (keep padding shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '20px',
          border: '2px solid #000',
          'border-right': '4px solid #000', // right width = 4px
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: '18px 16px 18px 18px',
        border: '2px solid #000',
        'border-right': '4px solid #000',
      },
    });
  });

  it('ignores zero/none borders (keep shorthand when used)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '16px',
          border: 'none',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: '16px',
        border: 'none',
      },
    });

    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '16px',
          'border-width': '0',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: '16px',
        'border-width': '0',
      },
    });
  });

  it('handles per-side rem paddings + mixed unit border sides using calc() (all four -> convert to shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          'padding-top': '2rem',
          'padding-right': '2rem',
          'padding-bottom': '2rem',
          'padding-left': '2rem',
          'border-top-width': '2px',
          'border-right-width': '0.25rem',
          'border-bottom-width': '2px',
          'border-left-width': '0.25rem',
        },
      }),
    ).toStrictEqual({
      styles: {
        padding: 'calc(2rem - 2px) 1.75rem',
        'border-top-width': '2px',
        'border-right-width': '0.25rem',
        'border-bottom-width': '2px',
        'border-left-width': '0.25rem',
      },
    });
  });

  it('handles padding shorthand (2-value) with 4-value border-width (keep shorthand as 4-value)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          padding: '10px 20px', // top/bottom | right/left
          'border-width': '1px 2px 3px 4px',
        },
      }),
    ).toStrictEqual({
      styles: {
        // top, right, bottom, left
        padding: '9px 18px 7px 16px',
        'border-width': '1px 2px 3px 4px',
      },
    });
  });

  it('does not reduce padding below a calc when units mismatch (missing sides -> no shorthand)', () => {
    expect(
      updatePaddingStylesBasedOnBorder({
        styles: {
          'padding-left': '1rem',
          'border-left-width': '24px',
        },
      }),
    ).toStrictEqual({
      styles: {
        'padding-left': 'calc(1rem - 24px)',
        'border-left-width': '24px',
      },
    });
  });
});
