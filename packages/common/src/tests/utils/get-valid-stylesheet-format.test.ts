import { describe, it, expect } from 'vitest';
import { getValidStylesheetFormat } from '../../utils';

describe('getValidStylesheetFormat', () => {
  it('returns the same value if format is "scss"', () => {
    const result = getValidStylesheetFormat('scss');
    expect(result).toBe<'scss'>('scss');
  });

  it('returns the same value if format is "css"', () => {
    const result = getValidStylesheetFormat('css');
    expect(result).toBe<'css'>('css');
  });

  it('returns the same value if format is "tailwind-scss"', () => {
    const result = getValidStylesheetFormat('tailwind-scss');
    expect(result).toBe<'tailwind-scss'>('tailwind-scss');
  });

  it('returns the same value if format is "tailwind-v4"', () => {
    const result = getValidStylesheetFormat('tailwind-v4');
    expect(result).toBe<'tailwind-v4'>('tailwind-v4');
  });

  it('defaults to "scss" if format is undefined', () => {
    const result = getValidStylesheetFormat(undefined);
    expect(result).toBe<'scss'>('scss');
  });

  it('defaults to "scss" if format is null', () => {
    const result = getValidStylesheetFormat(null as unknown);
    expect(result).toBe<'scss'>('scss');
  });

  it('defaults to "scss" if format is an invalid string', () => {
    const result = getValidStylesheetFormat('less');
    expect(result).toBe<'scss'>('scss');
  });
});
