import { sanitizeName, sanitizeSegment } from '../../utils/string.utils';

describe('sanitizeSegment', () => {
  it('should convert text to lowercase', () => {
    expect(sanitizeSegment('UPPERCASE')).toBe('uppercase');
    expect(sanitizeSegment('MixedCase')).toBe('mixedcase');
  });

  it('should replace non-alphanumeric characters with hyphens', () => {
    expect(sanitizeSegment('hello world')).toBe('hello-world');
    expect(sanitizeSegment('font/weight')).toBe('font-weight');
    expect(sanitizeSegment('color.blue')).toBe('color-blue');
    expect(sanitizeSegment('spacing_large')).toBe('spacing-large');
  });

  it('should collapse multiple consecutive hyphens into single hyphen', () => {
    expect(sanitizeSegment('hello--world')).toBe('hello-world');
    expect(sanitizeSegment('test---value')).toBe('test-value');
    expect(sanitizeSegment('multiple----hyphens')).toBe('multiple-hyphens');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(sanitizeSegment('-leading')).toBe('leading');
    expect(sanitizeSegment('trailing-')).toBe('trailing');
    expect(sanitizeSegment('-both-')).toBe('both');
    expect(sanitizeSegment('--multiple-leading')).toBe('multiple-leading');
    expect(sanitizeSegment('multiple-trailing--')).toBe('multiple-trailing');
  });

  it('should handle complex combinations', () => {
    expect(sanitizeSegment('-Hello World!-')).toBe('hello-world');
    expect(sanitizeSegment('Font/Weight_500')).toBe('font-weight-500');
    expect(sanitizeSegment('Color.Blue.00')).toBe('color-blue-00');
  });

  it('should handle empty strings and edge cases', () => {
    expect(sanitizeSegment('')).toBe('');
    expect(sanitizeSegment('-')).toBe('');
    expect(sanitizeSegment('--')).toBe('');
    expect(sanitizeSegment('a')).toBe('a');
  });
});

describe('sanitizeName', () => {
  it('should sanitize simple names', () => {
    expect(sanitizeName('color-blue')).toBe('color-blue');
    expect(sanitizeName('font-weight')).toBe('font-weight');
  });

  it('should handle names with multiple segments', () => {
    expect(sanitizeName('color/blue/500')).toBe('color-blue-500');
    expect(sanitizeName('spacing.large.xl')).toBe('spacing-large-xl');
  });

  it('should remove trailing hyphens from the final result', () => {
    expect(sanitizeName('color-blue-')).toBe('color-blue');
    expect(sanitizeName('font-weight--')).toBe('font-weight');
  });

  it('should handle complex nested structures', () => {
    expect(sanitizeName('Color/Primary/Blue/500')).toBe('color-primary-blue-500');
    expect(sanitizeName('Font Family/GT America')).toBe('font-family-gt-america');
  });

  it('should handle edge cases', () => {
    expect(sanitizeName('')).toBe('');
    expect(sanitizeName('-')).toBe('');
    expect(sanitizeName('a-b-c-')).toBe('a-b-c');
  });
});
