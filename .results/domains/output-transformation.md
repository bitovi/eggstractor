# Output Transformation Domain

## Overview
Transformation layer that converts collected design tokens into various output formats (CSS, SCSS, Tailwind) with variant handling. This domain implements the final stage of the design token pipeline, generating production-ready stylesheets.

## Core Architecture

### Transformer Interface (`src/types/processors.ts`)
```typescript
export interface TransformerResult {
  result: string;      // Generated stylesheet content
  warnings: string[];  // Non-critical issues
  errors: string[];    // Critical issues that need attention
}
```

### Format Strategy Pattern
```typescript
// Each format has its own transformation strategy
const transformers = {
  css: transformToCss,
  scss: transformToScss,
  'tailwind-scss': transformToTailwindSassClass,
  'tailwind-v4': transformToTailwindLayerUtilityClassV4
};
```

## CSS Transformer (`src/transformers/css.transformer.ts`)

### Core Implementation
```typescript
export function transformToCss(tokens: TokenCollection): TransformerResult {
  let output = '';
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Filter and group style tokens
  const styleTokens = tokens.tokens.filter(token => 
    token.type === 'style' && token.value != null
  ) as StyleToken[];
  
  // Group tokens by path/component name
  const tokenGroups = groupBy(styleTokens, token => 
    token.path.map(p => p.name).join('_')
  );
  
  // Convert to variant-aware class structure
  const variantGroups = Object.entries(tokenGroups).reduce((acc, [tokenName, tokens]) => {
    // Remove duplicate properties (keep last occurrence)
    const uniqueTokens = tokens.reduce((acc, token) => {
      // Skip default values that add no value
      if (['gap', 'padding'].includes(token.property) && 
          (token.value === '0' || token.value === '0px')) {
        return acc;
      }
      if (token.property === 'border-width' && token.value === '1px') {
        return acc;
      }
      acc.push(token);
      return acc;
    }, [] as StyleToken[]);
    
    if (uniqueTokens.length) {
      acc[tokenName] = uniqueTokens;
    }
    return acc;
  }, {} as Record<string, StyleToken[]>);
  
  // Generate CSS class definitions
  const classNames = convertVariantGroupBy(tokens, variantGroups, getClassNamePropertyAndValue);
  
  for (const classNameDefinition of classNames) {
    output += `\n.${classNameDefinition.variantCombinationName} {\n`;
    Object.entries(classNameDefinition.css).forEach(([property, value]) => {
      output += `  ${property}: ${value};\n`;
    });
    output += '}\n';
  }
  
  return { result: output, warnings, errors };
}
```

### Property Value Processing
```typescript
const getClassNamePropertyAndValue = (token: StyleToken): Record<string, string> => {
  // Convert px values to rem for better accessibility
  const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue!;
  return { [token.property]: value };
};
```

## SCSS Transformer (`src/transformers/scss.transformer.ts`)

### Variable Generation Strategy
```typescript
export function transformToScss(tokens: TokenCollection): TransformerResult {
  let output = '// Generated Design Tokens\n';
  const colorVariables = new Map<string, string>();
  const gradientVariables = new Map<string, StyleToken>();
  
  // Extract color variables first
  tokens.tokens.forEach(token => {
    if (token.type === 'variable' && token.property === 'fills') {
      const name = sanitizeName(token.name);
      colorVariables.set(name, token.rawValue ?? '');
    }
  });
  
  // Generate color variables section
  if (colorVariables.size > 0) {
    output += '\n// Color Variables\n';
    colorVariables.forEach((value, name) => {
      if (value) output += `$${name}: ${value};\n`;
    });
  }
  
  // Extract and generate gradient variables
  tokens.tokens.forEach(token => {
    if (token.type === 'style' && 
        token.property === 'fills' && 
        token.rawValue?.includes('gradient')) {
      const name = `gradient-${sanitizeName(token.name)}`;
      gradientVariables.set(name, token);
    }
  });
  
  if (gradientVariables.size > 0) {
    output += '\n// Generated Gradient Variables\n';
    gradientVariables.forEach((token, name) => {
      let gradientValue = token.rawValue ?? '';
      // Replace color values with variable references
      colorVariables.forEach((value, colorName) => {
        gradientValue = gradientValue.replace(value, `$${colorName}`);
      });
      if (gradientValue) {
        output += `$${name}: ${gradientValue};\n`;
      }
    });
  }
  
  // Generate mixins section
  output += generateMixins(tokens, colorVariables);
  
  return { result: output, warnings: [], errors: [] };
}
```

### Mixin Generation
```typescript
const getMixinPropertyAndValue = (token: StyleToken): Record<string, string> => {
  if (token.property === 'fills' && token?.rawValue?.includes('gradient')) {
    // Use CSS variables for gradients with fallback
    if (token.variables && token.variables.length > 0) {
      const gradientName = `gradient-${sanitizeName(token.name)}`;
      return { 
        [token.property]: `$var(--${gradientName}, #{$${gradientName}})` 
      };
    }
    
    // Use direct value
    const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue;
    return { [token.property]: value };
  }
  
  // Standard property processing
  const value = token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue!;
  return { [token.property]: value };
};
```

## Tailwind Transformers (`src/transformers/tailwind/index.ts`)

### Tailwind SCSS Classes
```typescript
export function transformToTailwindSassClass(collection: TokenCollection) {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  
  // Group tokens by path for component-based organization
  const tokenGroups = groupBy(styleTokens, token => 
    token.path.map(p => p.name).join('_')
  );
  
  // Process tokens through variant middleware
  const parsedVariantInstances = convertVariantGroupBy(
    collection, tokenGroups, getStylePropertyAndValue
  );
  
  // Convert back to style tokens for Tailwind processing
  const backToTokens = backToStyleTokens(parsedVariantInstances);
  
  let output = '// Generated Tailwind SCSS Classes\n\n';
  
  // Generate SCSS classes with Tailwind-style utilities
  backToTokens.forEach(({ variantPath, tokens }) => {
    output += `.${variantPath} {\n`;
    
    // Create Tailwind utility classes
    const tailwindClasses = createTailwindClasses(tokens);
    tailwindClasses.forEach(className => {
      output += `  @apply ${className};\n`;
    });
    
    output += '}\n\n';
  });
  
  return { result: output, warnings, errors };
}
```

### Tailwind V4 Utility Classes
```typescript
export function transformToTailwindLayerUtilityClassV4(collection: TokenCollection) {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  
  let output = '@layer utilities {\n';
  
  // Group and process tokens
  const tokenGroups = groupBy(styleTokens, token => 
    token.path.map(p => p.name).join('_')
  );
  
  const parsedVariantInstances = convertVariantGroupBy(
    collection, tokenGroups, getStylePropertyAndValue
  );
  
  // Generate utility classes
  parsedVariantInstances.forEach(variant => {
    output += `  .${variant.variantCombinationName} {\n`;
    Object.entries(variant.css).forEach(([property, value]) => {
      output += `    ${property}: ${value};\n`;
    });
    output += '  }\n';
  });
  
  output += '}\n';
  
  return { result: output, warnings, errors };
}
```

## Tailwind Class Generation (`src/transformers/tailwind/generators.ts`)

### Property Mapping Strategy
```typescript
const propertyGenerators: Record<string, (token: NonNullableStyleToken) => string | null> = {
  'background': generateTailwindBackgroundClass,
  'color': generateTailwindColorClass,
  'font-size': generateTailwindFontSizeClass,
  'font-weight': generateTailwindFontWeightClass,
  'padding': generateTailwindPaddingClass,
  'margin': generateTailwindMarginClass,
  'border-radius': generateTailwindBorderRadiusClass,
  'width': generateTailwindWidthClass,
  'height': generateTailwindHeightClass,
  'gap': generateTailwindGapClass,
  'flex-direction': ({ rawValue }) => flexDirection[rawValue],
  'align-items': ({ rawValue }) => alignItems[rawValue]
};

export function createTailwindClasses(tokens: NonNullableStyleToken[]): string[] {
  const classes: string[] = [];
  
  tokens.forEach(token => {
    const generator = propertyGenerators[token.property];
    if (generator) {
      const className = generator(token);
      if (className) {
        classes.push(className);
      }
    }
  });
  
  return classes.filter(Boolean);
}
```

### Specific Class Generators
```typescript
function generateTailwindBackgroundClass(token: NonNullableStyleToken): string | null {
  const { rawValue } = token;
  
  // Handle gradients
  if (rawValue.includes('gradient')) {
    return `bg-gradient-custom`; // Custom gradient class
  }
  
  // Handle solid colors
  const colorMatch = rawValue.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
  if (colorMatch) {
    const colorName = colors[rawValue.toLowerCase()];
    return colorName ? `bg-${colorName}` : `bg-[${rawValue}]`;
  }
  
  return null;
}

function generateTailwindPaddingClass(token: NonNullableStyleToken): string | null {
  const { rawValue } = token;
  
  // Handle four-sided padding
  const sides = normalizeFourSides(rawValue);
  const [top, right, bottom, left] = sides;
  
  // All sides equal
  if (top === right && right === bottom && bottom === left) {
    const spacingKey = spacing[top];
    return spacingKey ? `p-${spacingKey}` : `p-[${top}]`;
  }
  
  // Vertical/horizontal pairs
  if (top === bottom && left === right) {
    const ySpacing = spacing[top];
    const xSpacing = spacing[left];
    if (ySpacing && xSpacing) {
      return `py-${ySpacing} px-${xSpacing}`;
    }
  }
  
  // Individual sides
  const classes: string[] = [];
  if (top !== '0') {
    const spacingKey = spacing[top];
    classes.push(spacingKey ? `pt-${spacingKey}` : `pt-[${top}]`);
  }
  // ... similar for other sides
  
  return classes.join(' ');
}
```

## Variant Processing Middleware (`src/transformers/variants-middleware.ts`)

### Variant Combination Logic
```typescript
export const convertVariantGroupBy = (
  tokens: TokenCollection,
  variantGroups: Record<string, StyleToken[]>,
  getPropertyAndValue: (token: StyleToken) => Record<string, string>
) => {
  const result: Array<{
    variantCombinationName: string;
    css: Record<string, string>;
  }> = [];
  
  Object.entries(variantGroups).forEach(([variantPath, tokens]) => {
    const css: Record<string, string> = {};
    
    // Combine all properties for this variant
    tokens.forEach(token => {
      const properties = getPropertyAndValue(token);
      Object.assign(css, properties);
    });
    
    // Generate sanitized class name
    const className = sanitizeName(variantPath);
    
    result.push({
      variantCombinationName: className,
      css
    });
  });
  
  return result;
};
```

### Style Token Filtering
```typescript
export function filterStyleTokens({ tokens }: TokenCollection): {
  styleTokens: NonNullableStyleToken[];
  warnings: string[];
  errors: string[];
} {
  const warningsSet = new Set<string>();
  const errorsSet = new Set<string>();
  
  const styleTokens = tokens.filter((token): token is NonNullableStyleToken => {
    // Extract warnings/errors from ALL tokens
    if ('warnings' in token && token.warnings) {
      token.warnings.forEach(warning => warningsSet.add(warning));
    }
    if ('errors' in token && token.errors) {
      token.errors.forEach(error => errorsSet.add(error));
    }
    
    // Filter for valid style tokens
    return (
      token.type === 'style' &&
      token.value != null &&
      token.value !== '' &&
      token.rawValue != null &&
      token.rawValue !== ''
    );
  });
  
  return {
    styleTokens,
    warnings: Array.from(warningsSet),
    errors: Array.from(errorsSet)
  };
}
```

## Key Patterns

### 1. Strategy Pattern for Format Selection
Each output format implements its own transformation strategy while sharing common interfaces.

### 2. Template Method for Common Processing
```typescript
// Common transformation pipeline
const transformationTemplate = (tokens: TokenCollection) => {
  // 1. Filter and validate tokens
  const validTokens = filterTokens(tokens);
  
  // 2. Group tokens by logical units
  const tokenGroups = groupTokens(validTokens);
  
  // 3. Process variants and combinations
  const processedVariants = processVariants(tokenGroups);
  
  // 4. Generate format-specific output
  return generateOutput(processedVariants);
};
```

### 3. Builder Pattern for Complex Output
```typescript
class StylesheetBuilder {
  private sections: string[] = [];
  
  addSection(title: string, content: string) {
    this.sections.push(`// ${title}\n${content}\n`);
    return this;
  }
  
  build(): string {
    return this.sections.join('\n');
  }
}
```

### 4. Middleware Pattern for Variant Processing
Variant processing is handled through middleware that can be composed and reused across different transformers.

## Performance Optimizations

### 1. Efficient Grouping
```typescript
// Group tokens once and reuse across transformations
const tokenGroups = groupBy(styleTokens, token => 
  token.path.map(p => p.name).join('_')
);
```

### 2. Deduplication
```typescript
// Remove duplicate properties, keeping the last occurrence
const uniqueTokens = tokens.reduce((acc, token) => {
  const existing = acc.find(t => t.property === token.property);
  if (existing) {
    acc.splice(acc.indexOf(existing), 1);
  }
  acc.push(token);
  return acc;
}, []);
```

### 3. Lazy Value Processing
```typescript
// Only process values when actually needed
const getValue = () => token.valueType === 'px' ? rem(token.rawValue!) : token.rawValue!;
```

## Error Handling and Quality Assurance

### 1. Warning Collection
```typescript
// Collect warnings without stopping transformation
if (token.property === 'border-width' && token.value === '1px') {
  warnings.push(`Default border-width removed for ${token.name}`);
  return acc; // Skip but continue
}
```

### 2. Error Recovery
```typescript
// Gracefully handle malformed values
try {
  const processedValue = processValue(token.rawValue);
  return processedValue;
} catch (error) {
  errors.push(`Failed to process ${token.property}: ${error.message}`);
  return token.rawValue; // Use raw value as fallback
}
```

### 3. Output Validation
```typescript
// Validate generated CSS/SCSS syntax
const validateOutput = (output: string): string[] => {
  const issues: string[] = [];
  
  // Check for unclosed braces
  const openBraces = (output.match(/{/g) || []).length;
  const closeBraces = (output.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push('Mismatched braces in generated output');
  }
  
  return issues;
};
```

## Integration Points

- **Style Processing Pipeline**: Receives processed tokens for transformation
- **Variant Management**: Integrates variant processing middleware
- **Utility Services**: Uses string sanitization and unit conversion utilities
- **Testing Infrastructure**: Supports snapshot testing of generated output
