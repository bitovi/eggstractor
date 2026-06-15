import { inferPropertyFromVariableName } from '../../services/variable.service';

describe('inferPropertyFromVariableName', () => {
  it('infers line-height for genuine line-height variants', () => {
    expect(inferPropertyFromVariableName('line-height')).toBe('line-height');
    expect(inferPropertyFromVariableName('lineHeight')).toBe('line-height');
    expect(inferPropertyFromVariableName('line-spacing')).toBe('line-height');
    expect(inferPropertyFromVariableName('linespacing')).toBe('line-height');
    expect(inferPropertyFromVariableName('typography/leading')).toBe('line-height');
  });

  it('does not treat unrelated names containing "line" as line-height', () => {
    // Regression: "hairline" (and similar) was matched by a bare "line" substring,
    // which stripped the px unit so "1px" became "1".
    expect(inferPropertyFromVariableName('hairline')).toBe('spacing');
    expect(inferPropertyFromVariableName('hairline2')).toBe('spacing');
    expect(inferPropertyFromVariableName('border/hairline')).toBe('spacing');
    expect(inferPropertyFromVariableName('line')).toBe('spacing');
  });

  it('still infers other property types', () => {
    expect(inferPropertyFromVariableName('opacity')).toBe('opacity');
    expect(inferPropertyFromVariableName('font-weight')).toBe('font-weight');
    expect(inferPropertyFromVariableName('spacing/md')).toBe('spacing');
  });
});
