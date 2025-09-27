type ValueType = 'opacity' | 'lineHeight' | 'dimension' | 'other';

interface NormalizeOptions {
  propertyName: string;
  value: number;
}

export function normalizeValue({ propertyName, value }: NormalizeOptions): string {
  const type = getValueType(propertyName);

  switch (type) {
    case 'opacity':
      return normalizeOpacity(value);
    case 'lineHeight':
      return normalizeLineHeight(value);
    case 'dimension':
      return normalizeDimension(value);
    default:
      return value.toString();
  }
}

function getValueType(propertyName: string): ValueType {
  const prop = propertyName.toLowerCase();
  if (prop === 'opacity') return 'opacity';
  if (prop.includes('line-height')) return 'lineHeight';
  if (shouldHaveDimension(prop)) return 'dimension';
  return 'other';
}

function normalizeOpacity(value: number): string {
  return (value > 1 ? value / 100 : value).toString();
}

function normalizeLineHeight(value: number): string {
  return value > 4 ? `${value}px` : value.toString();
}

function normalizeDimension(value: number): string {
  return `${value}px`;
}

function shouldHaveDimension(propertyName: string): boolean {
  const unitlessProperties = ['font-weight', 'opacity', 'line-height'];
  return !unitlessProperties.some((prop) => propertyName.includes(prop));
}
