const defaults = {
  baseline: 16,
  precision: 3,
  unit: true,
};

const rounded = (value: number, precision: number): number => {
  precision = Math.pow(10, precision);
  return Math.floor(value * precision) / precision;
};

interface ConvertOptions {
  baseline?: number;
  precision?: number;
  unit?: boolean;
}

export const convert = (
  value: number | string | object,
  to: string = 'rem',
  options: ConvertOptions = {},
): string => {
  const { baseline, precision, unit } = { ...defaults, ...options };

  if (typeof value === 'number') {
    if (to === 'px') {
      return `${rounded(value * baseline, precision)}${unit ? to : ''}`;
    }
    return `${rounded(value / baseline, precision)}${unit ? to : ''}`;
  }

  if (Array.isArray(value)) {
    return value.map((val) => convert(val, to, options)).join(', ');
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, val]) => `${key}: ${convert(val, to, options)}`)
      .join(', ');
  }

  return value.replace(/(\d*\.?\d+)(rem|px)/g, (match: string, val: string, from: string) => {
    if (from === 'px' && (to === 'rem' || to === 'em')) {
      return String(convert(parseFloat(val), to, options));
    }

    if (from === 'rem' && to === 'px') {
      return String(convert(parseFloat(val), to, options));
    }

    return match;
  });
};

export const rem = (value: number | string | object, options?: any) => convert(value, 'rem', options);

export const em = (value: number | string | object, baseline: number, options?: any) =>
  convert(value, 'em', { baseline, ...options });

export const px = (value: number | string | object, options?: any) => convert(value, 'px', options);
