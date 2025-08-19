import { normalizeValue } from '../utils';

describe('normalizeValue', () => {
  it('should normalize opacity values', () => {
    expect(normalizeValue({ propertyName: 'opacity', value: 48 })).toBe('0.48');
    expect(normalizeValue({ propertyName: 'opacity', value: 0.5 })).toBe('0.5');
  });

  it('should handle line height values', () => {
    expect(normalizeValue({ propertyName: 'line-height', value: 1.5 })).toBe('1.5');
    expect(normalizeValue({ propertyName: 'line-height', value: 24 })).toBe('24px');
  });
});
