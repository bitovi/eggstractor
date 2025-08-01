# Utility Services Domain

## Overview
Supporting services and utilities for common operations like string manipulation, color processing, and error handling. This domain provides the foundational utilities that support all other domains in the system.

## Core Utility Categories

### 1. String Utilities (`src/utils/string.utils.ts`)

#### Name Sanitization
```typescript
export const sanitizeName = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '-')  // Replace invalid CSS chars with dashes
    .replace(/^-+|-+$/g, '')          // Remove leading/trailing dashes
    .replace(/-+/g, '-')              // Collapse multiple dashes
    .toLowerCase();                    // Ensure lowercase for consistency
};

// Examples:
// "Primary Button (Large)" → "primary-button-large"
// "Card/Default/Hover" → "card-default-hover"
// "Button_State=Pressed" → "button-state-pressed"

// Advanced sanitization for CSS class names
export const sanitizeClassName = (className: string): string => {
  // Handle special CSS naming rules
  const sanitized = sanitizeName(className);
  
  // Ensure doesn't start with number (invalid CSS)
  if (/^\d/.test(sanitized)) {
    return `class-${sanitized}`;
  }
  
  // Handle reserved CSS keywords
  const reservedKeywords = ['auto', 'inherit', 'initial', 'unset', 'none'];
  if (reservedKeywords.includes(sanitized)) {
    return `${sanitized}-class`;
  }
  
  return sanitized;
};
```

#### String Formatting
```typescript
export const camelCase = (str: string): string => {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^[A-Z]/, c => c.toLowerCase());
};

export const pascalCase = (str: string): string => {
  const camelCased = camelCase(str);
  return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
};

export const kebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

// Usage examples:
// camelCase("background-color") → "backgroundColor"
// pascalCase("font-weight") → "FontWeight"  
// kebabCase("fontSize") → "font-size"
```

### 2. Color Utilities (`src/utils/color.utils.ts`)

#### Color Format Conversion
```typescript
export interface RGBAColor {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a?: number; // 0-1
}

export const rgbaToString = (r: number, g: number, b: number, a: number = 1): string => {
  const red = Math.round(r * 255);
  const green = Math.round(g * 255);
  const blue = Math.round(b * 255);
  
  if (a < 1) {
    return `rgba(${red}, ${green}, ${blue}, ${a})`;
  }
  
  return `rgb(${red}, ${green}, ${blue})`;
};

export const rgbaToHex = (r: number, g: number, b: number, a: number = 1): string => {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  
  if (a < 1) {
    return `${hex}${toHex(a)}`;
  }
  
  return hex;
};

export const hexToRgba = (hex: string): RGBAColor => {
  const cleanHex = hex.replace('#', '');
  
  if (cleanHex.length === 3) {
    // Short form: #RGB → #RRGGBB
    const [r, g, b] = cleanHex.split('').map(c => c + c);
    return {
      r: parseInt(r, 16) / 255,
      g: parseInt(g, 16) / 255,
      b: parseInt(b, 16) / 255,
      a: 1
    };
  }
  
  if (cleanHex.length === 6) {
    // Standard form: #RRGGBB
    return {
      r: parseInt(cleanHex.substr(0, 2), 16) / 255,
      g: parseInt(cleanHex.substr(2, 2), 16) / 255,
      b: parseInt(cleanHex.substr(4, 2), 16) / 255,
      a: 1
    };
  }
  
  if (cleanHex.length === 8) {
    // With alpha: #RRGGBBAA
    return {
      r: parseInt(cleanHex.substr(0, 2), 16) / 255,
      g: parseInt(cleanHex.substr(2, 2), 16) / 255,
      b: parseInt(cleanHex.substr(4, 2), 16) / 255,
      a: parseInt(cleanHex.substr(6, 2), 16) / 255
    };
  }
  
  throw new Error(`Invalid hex color format: ${hex}`);
};
```

#### Color Analysis
```typescript
export const getLuminance = (r: number, g: number, b: number): number => {
  // Convert to sRGB
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  // Calculate relative luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const getContrastRatio = (color1: RGBAColor, color2: RGBAColor): number => {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export const isAccessible = (foreground: RGBAColor, background: RGBAColor): {
  AA: boolean;
  AAA: boolean;
  ratio: number;
} => {
  const ratio = getContrastRatio(foreground, background);
  
  return {
    AA: ratio >= 4.5,
    AAA: ratio >= 7,
    ratio
  };
};
```

### 3. Unit Utilities (`src/utils/units.utils.ts`)

#### Unit Conversion
```typescript
export const rem = (value: string | null, baseSize: number = 16): string => {
  if (!value) return '0';
  
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return value;
  
  // Convert px to rem
  if (value.includes('px')) {
    const remValue = numericValue / baseSize;
    return `${remValue}rem`;
  }
  
  return value;
};

export const px = (value: string | null): string => {
  if (!value) return '0px';
  
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return value;
  
  // Add px unit if not present
  if (!value.includes('px') && !value.includes('rem') && !value.includes('%')) {
    return `${numericValue}px`;
  }
  
  return value;
};

export const normalizeUnit = (value: string | number, preferredUnit: 'px' | 'rem' | '%' = 'px'): string => {
  if (typeof value === 'number') {
    return `${value}${preferredUnit}`;
  }
  
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return value;
  
  switch (preferredUnit) {
    case 'rem':
      return rem(value);
    case 'px':
      return px(value);
    case '%':
      return `${numericValue}%`;
    default:
      return value;
  }
};
```

#### Value Validation
```typescript
export const isValidCSSValue = (property: string, value: string): boolean => {
  // Basic validation rules for common CSS properties
  const validationRules: Record<string, RegExp> = {
    'color': /^(#[0-9a-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|\w+)$/i,
    'font-size': /^(\d+(\.\d+)?(px|rem|em|%|vw|vh)|smaller|larger|xx-small|x-small|small|medium|large|x-large|xx-large)$/i,
    'width': /^(\d+(\.\d+)?(px|rem|em|%|vw|vh)|auto|fit-content|max-content|min-content)$/i,
    'height': /^(\d+(\.\d+)?(px|rem|em|%|vw|vh)|auto|fit-content|max-content|min-content)$/i,
    'margin': /^(\d+(\.\d+)?(px|rem|em|%)|auto)(\s+(\d+(\.\d+)?(px|rem|em|%)|auto)){0,3}$/i,
    'padding': /^(\d+(\.\d+)?(px|rem|em|%))(\s+(\d+(\.\d+)?(px|rem|em|%))){0,3}$/i,
  };
  
  const rule = validationRules[property];
  return rule ? rule.test(value) : true; // Allow unknown properties
};

export const sanitizeCSSValue = (property: string, value: string): string => {
  if (!isValidCSSValue(property, value)) {
    console.warn(`Invalid CSS value for ${property}: ${value}`);
    return ''; // Return empty string for invalid values
  }
  
  return value.trim();
};
```

### 4. Array Utilities (`src/utils/array.utils.ts`)

#### Array Manipulation
```typescript
export const groupBy = <T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const unique = <T>(array: T[], keyFn?: (item: T) => any): T[] => {
  if (!keyFn) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const flatten = <T>(array: (T | T[])[]): T[] => {
  return array.reduce<T[]>((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
};
```

#### Array Analysis
```typescript
export const findDuplicates = <T>(
  array: T[],
  keyFn: (item: T) => any = item => item
): T[] => {
  const seen = new Set();
  const duplicates = new Set<T>();
  
  array.forEach(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      duplicates.add(item);
    } else {
      seen.add(key);
    }
  });
  
  return Array.from(duplicates);
};

export const intersection = <T>(array1: T[], array2: T[]): T[] => {
  const set2 = new Set(array2);
  return array1.filter(item => set2.has(item));
};

export const difference = <T>(array1: T[], array2: T[]): T[] => {
  const set2 = new Set(array2);
  return array1.filter(item => !set2.has(item));
};
```

### 5. Error Utilities (`src/utils/error.utils.ts`)

#### Error Aggregation
```typescript
export const deduplicateMessages = (messages: string[]): string[] => {
  return [...new Set(messages)].sort();
};

export interface ErrorSummary {
  warnings: string[];
  errors: string[];
  total: number;
}

export const aggregateErrors = (
  tokenCollections: Array<{ warnings?: string[]; errors?: string[] }>
): ErrorSummary => {
  const allWarnings: string[] = [];
  const allErrors: string[] = [];
  
  tokenCollections.forEach(collection => {
    if (collection.warnings) {
      allWarnings.push(...collection.warnings);
    }
    if (collection.errors) {
      allErrors.push(...collection.errors);
    }
  });
  
  return {
    warnings: deduplicateMessages(allWarnings),
    errors: deduplicateMessages(allErrors),
    total: allWarnings.length + allErrors.length
  };
};
```

#### Error Formatting
```typescript
export const formatErrorMessage = (
  error: Error,
  context?: string
): string => {
  let message = error.message;
  
  if (context) {
    message = `${context}: ${message}`;
  }
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    message += `\n${error.stack}`;
  }
  
  return message;
};

export const createErrorSummaryReport = (summary: ErrorSummary): string => {
  let report = '';
  
  if (summary.errors.length > 0) {
    report += `Errors (${summary.errors.length}):\n`;
    summary.errors.forEach((error, index) => {
      report += `  ${index + 1}. ${error}\n`;
    });
    report += '\n';
  }
  
  if (summary.warnings.length > 0) {
    report += `Warnings (${summary.warnings.length}):\n`;
    summary.warnings.forEach((warning, index) => {
      report += `  ${index + 1}. ${warning}\n`;
    });
  }
  
  if (summary.total === 0) {
    report = 'No errors or warnings found.';
  }
  
  return report;
};
```

### 6. Value Utilities (`src/utils/value.utils.ts`)

#### Value Processing
```typescript
export const normalizeValue = (value: any): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string') {
    return value.trim();
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value.toString();
  }
  
  // Handle objects (like Figma paint objects)
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
};

export const parseNumericValue = (value: string): {
  number: number;
  unit: string;
} | null => {
  const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
  
  if (!match) return null;
  
  const [, numberPart, unitPart] = match;
  const number = parseFloat(numberPart);
  
  if (isNaN(number)) return null;
  
  return {
    number,
    unit: unitPart.trim()
  };
};

export const compareValues = (value1: string, value2: string): boolean => {
  // Normalize values before comparison
  const normalized1 = normalizeValue(value1);
  const normalized2 = normalizeValue(value2);
  
  if (normalized1 === normalized2) return true;
  
  // Try numeric comparison
  const parsed1 = parseNumericValue(normalized1 || '');
  const parsed2 = parseNumericValue(normalized2 || '');
  
  if (parsed1 && parsed2) {
    return parsed1.number === parsed2.number && parsed1.unit === parsed2.unit;
  }
  
  return false;
};
```

### 7. Node Utilities (`src/utils/node.utils.ts`)

#### Node Path Management
```typescript
export const getNodePathNames = (node: BaseNode): Array<{ name: string; type: string }> => {
  const path: Array<{ name: string; type: string }> = [];
  let current: BaseNode | null = node;
  
  while (current && current.type !== 'DOCUMENT') {
    path.unshift({
      name: ('name' in current ? current.name : 'unnamed') || 'unnamed',
      type: current.type
    });
    current = current.parent;
  }
  
  return path;
};

export const getNodeById = (root: BaseNode, id: string): BaseNode | null => {
  if (root.id === id) return root;
  
  if ('children' in root) {
    for (const child of root.children) {
      const found = getNodeById(child, id);
      if (found) return found;
    }
  }
  
  return null;
};

export const findNodesByType = <T extends BaseNode>(
  root: BaseNode,
  nodeType: string
): T[] => {
  const results: T[] = [];
  
  function traverse(node: BaseNode) {
    if (node.type === nodeType) {
      results.push(node as T);
    }
    
    if ('children' in node) {
      node.children.forEach(traverse);
    }
  }
  
  traverse(root);
  return results;
};
```

### 8. Gradient Utilities (`src/utils/gradient.utils.ts`)

#### Gradient Processing
```typescript
export interface GradientAnalysis {
  type: 'linear' | 'radial' | 'angular';
  angle?: number;
  stops: Array<{
    color: RGBAColor;
    position: number; // 0-1
  }>;
  warnings: string[];
}

export const processGradient = (
  gradient: GradientPaint,
  nodeId: string
): { value: string; rawValue: string; warnings: string[]; errors: string[] } => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    // Process gradient stops
    const stops = gradient.gradientStops.map(stop => {
      const { r, g, b } = stop.color;
      const alpha = stop.color.a ?? 1;
      const position = Math.round(stop.position * 100);
      
      if (alpha < 1) {
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha}) ${position}%`;
      }
      return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}) ${position}%`;
    });
    
    // Calculate gradient angle for linear gradients
    let angle = 0;
    if (gradient.type === 'GRADIENT_LINEAR') {
      angle = calculateGradientAngle(gradient.gradientTransform);
    }
    
    // Generate CSS gradient
    let cssGradient = '';
    switch (gradient.type) {
      case 'GRADIENT_LINEAR':
        cssGradient = `linear-gradient(${angle}deg, ${stops.join(', ')})`;
        break;
      case 'GRADIENT_RADIAL':
        cssGradient = `radial-gradient(circle, ${stops.join(', ')})`;
        break;
      case 'GRADIENT_ANGULAR':
        cssGradient = `conic-gradient(${stops.join(', ')})`;
        break;
      default:
        warnings.push(`Unsupported gradient type: ${gradient.type}`);
        cssGradient = `linear-gradient(0deg, ${stops.join(', ')})`;
    }
    
    return {
      value: cssGradient,
      rawValue: cssGradient,
      warnings,
      errors
    };
  } catch (error) {
    errors.push(`Failed to process gradient: ${error.message}`);
    return {
      value: null,
      rawValue: null,
      warnings,
      errors
    };
  }
};

const calculateGradientAngle = (transform: Transform): number => {
  // Calculate angle from transformation matrix
  const [[a, c], [b, d]] = transform;
  let angle = Math.atan2(b, a) * (180 / Math.PI);
  
  // Normalize angle to 0-360 range
  if (angle < 0) angle += 360;
  
  return Math.round(angle);
};
```

## Key Patterns

### 1. Utility Function Pattern
All utilities are pure functions without side effects, making them predictable and testable.

### 2. Error Handling Strategy
```typescript
// Utilities provide graceful error handling with fallbacks
export const safeParseValue = <T>(
  value: string,
  parser: (value: string) => T,
  fallback: T
): T => {
  try {
    return parser(value);
  } catch (error) {
    console.warn(`Failed to parse value "${value}":`, error);
    return fallback;
  }
};
```

### 3. Type Safety with Validation
```typescript
// Utilities include type guards and validation
export const isValidHexColor = (value: string): value is string => {
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(value);
};

export const assertValidHexColor = (value: string): asserts value is string => {
  if (!isValidHexColor(value)) {
    throw new Error(`Invalid hex color: ${value}`);
  }
};
```

### 4. Performance Optimization
```typescript
// Memoization for expensive operations
const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Memoized expensive color calculations
export const getLuminanceMemoized = memoize(getLuminance);
export const getContrastRatioMemoized = memoize(getContrastRatio);
```

## Integration Points

- **All Domains**: Utilities are used throughout the entire system
- **Style Processing Pipeline**: String sanitization, value normalization
- **Output Transformation**: Unit conversion, array manipulation
- **Variant Management**: String processing, error aggregation
- **Design Token Extraction**: Node traversal, path management
- **Testing Infrastructure**: Array utilities, error formatting

## Key Responsibilities

1. **String Processing**: Sanitization, formatting, and validation of names and values
2. **Color Management**: Conversion between color formats and accessibility analysis
3. **Unit Handling**: Conversion between CSS units (px, rem, %)
4. **Data Manipulation**: Array processing, grouping, and deduplication
5. **Error Management**: Error aggregation, formatting, and reporting
6. **Value Processing**: Normalization, parsing, and comparison of various value types
7. **Node Operations**: Path management and node traversal utilities
