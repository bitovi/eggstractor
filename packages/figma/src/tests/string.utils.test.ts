import { sanitizeName } from '../utils/string.utils';

describe('sanitizeName', () => {
  it('should replace non-alphanumeric characters with hyphens', () => {
    expect(sanitizeName('Field Text')).toBe('field-text');
    expect(sanitizeName('Field_Text!')).toBe('field-text');
  });

  it('should handle embedded image unicode', () => {
    expect(sanitizeName('Field\ufffcText')).toBe('field-img-text');
  });

  it('should handle <img> tags with alt text', () => {
    expect(sanitizeName('Field<img alt="icon"/>Text')).toBe('field-icon-text');
    expect(sanitizeName('Field<img alt=""/>Text')).toBe('field-img-text');
  });

  it('should handle <img> tags without alt text', () => {
    expect(sanitizeName('Field<img/>Text')).toBe('field-img-text');
  });
});
