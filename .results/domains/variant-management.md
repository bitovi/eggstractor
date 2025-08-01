# Variant Management Domain

## Overview
Specialized system for handling Figma component variants and converting them into CSS class hierarchies. This domain manages the complex logic of component variants, combinations, and generates maintainable CSS class structures.

## Core Architecture

### Variant Processing Pipeline
```typescript
// Primary variant processing flow
export const convertVariantGroupBy = (
  tokens: TokenCollection,
  variantGroups: Record<string, StyleToken[]>,
  getPropertyAndValue: (token: StyleToken) => Record<string, string>
) => {
  const parsedVariantInstances: Array<{
    variantCombinationName: string;
    css: Record<string, string>;
  }> = [];
  
  Object.entries(variantGroups).forEach(([variantPath, tokenGroup]) => {
    const css: Record<string, string> = {};
    
    // Merge all CSS properties for this variant combination
    tokenGroup.forEach(token => {
      const properties = getPropertyAndValue(token);
      Object.assign(css, properties);
    });
    
    // Generate sanitized class name
    const sanitizedClassName = sanitizeName(variantPath);
    
    parsedVariantInstances.push({
      variantCombinationName: sanitizedClassName,
      css
    });
  });
  
  return parsedVariantInstances;
};
```

### Variant Feature Flag System
```typescript
// Controlled rollout of new variant parsing features
export const USE_VARIANT_COMBINATION_PARSING = () => {
  // Feature flag for enabling advanced variant combination logic
  return process.env.NODE_ENV !== 'test' || 
         process.env.ENABLE_VARIANT_COMBINATIONS === 'true';
};
```

## Component Variant Detection

### Component Set Processing
```typescript
// Detect and validate component sets in collection service
export function detectComponentSetDuplicates(componentSetNode: BaseNode): {
  duplicateNames: string[];
  hasDuplicates: boolean;
} {
  const duplicateNames: string[] = [];
  const seenVariants = new Set<string>();

  if (!('children' in componentSetNode)) {
    return { duplicateNames, hasDuplicates: false };
  }

  // Check each component variant for duplicates
  for (const child of componentSetNode.children) {
    if (child.type === 'COMPONENT') {
      const variantName = child.name || 'unnamed';

      if (seenVariants.has(variantName)) {
        console.warn(
          `🚨 DUPLICATE VARIANT in "${componentSetNode.name}" component set:\n` +
          `  Layer: "${variantName}"\n` +
          `  Found duplicate layers in Figma - check the layers panel`
        );
        duplicateNames.push(variantName);
      } else {
        seenVariants.add(variantName);
      }
    }
  }

  return {
    duplicateNames,
    hasDuplicates: duplicateNames.length > 0
  };
}
```

### Component Token Extraction
```typescript
// Extract tokens from component variants
export async function extractComponentSetToken(
  componentSetNode: ComponentSetNode,
  path: BaseToken['path']
): Promise<ComponentSetToken> {
  const variants: ComponentSetToken['variants'] = {};
  
  // Process each component variant
  for (const child of componentSetNode.children) {
    if (child.type === 'COMPONENT') {
      const variantName = child.name || 'unnamed';
      
      // Extract component token for this variant
      const componentToken = await extractComponentToken(child, [
        ...path,
        { name: variantName, type: 'COMPONENT' }
      ]);
      
      variants[variantName] = componentToken;
    }
  }
  
  return {
    id: componentSetNode.id,
    name: componentSetNode.name || 'unnamed',
    type: 'component-set',
    path,
    variants,
    metadata: {
      figmaId: componentSetNode.id
    }
  };
}
```

## Variant Combination Logic

### Path-Based Variant Organization
```typescript
// Organize variants by their hierarchical path
const organizeVariantsByPath = (tokens: StyleToken[]) => {
  return groupBy(tokens, token => {
    // Create hierarchical path: Page_Frame_Component_Variant
    return token.path.map(segment => segment.name).join('_');
  });
};

// Example variant paths:
// "Button_Primary_Large" -> Button component, Primary variant, Large size
// "Card_Default_Hover" -> Card component, Default state, Hover interaction
```

### Variant Name Sanitization
```typescript
export const sanitizeName = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '-')  // Replace invalid chars with dashes
    .replace(/^-+|-+$/g, '')          // Remove leading/trailing dashes
    .replace(/-+/g, '-')              // Collapse multiple dashes
    .toLowerCase();                    // Convert to lowercase for consistency
};

// Examples:
// "Primary Button (Large)" -> "primary-button-large"
// "Card/Default/Hover" -> "card-default-hover"
// "Button_State=Pressed" -> "button-state-pressed"
```

### Variant Combination Processing
```typescript
// Handle complex variant combinations
const processVariantCombinations = (
  componentSetTokens: Record<string, ComponentSetToken>
) => {
  const combinations: VariantCombination[] = [];
  
  Object.values(componentSetTokens).forEach(componentSet => {
    const variantKeys = Object.keys(componentSet.variants);
    
    // Generate all possible combinations for multi-variant components
    if (variantKeys.length > 1) {
      const variantCombinations = generateCombinations(variantKeys);
      
      variantCombinations.forEach(combination => {
        const combinedTokens = mergeVariantTokens(
          combination.map(key => componentSet.variants[key])
        );
        
        combinations.push({
          name: combination.join('-'),
          tokens: combinedTokens,
          componentSetId: componentSet.id
        });
      });
    }
  });
  
  return combinations;
};
```

## Tailwind-Specific Variant Processing

### Style Token Conversion for Tailwind
```typescript
// Convert variant groups back to style tokens for Tailwind processing
export const backToStyleTokens = (
  parsedStyleTokens: ReturnType<typeof convertVariantGroupBy>
) => {
  return parsedStyleTokens.map(parsedStyleToken => {
    // Convert CSS properties back to token format
    const tokens = Object.entries(parsedStyleToken.css).map(
      ([property, rawValue]) => ({
        property,
        rawValue,
        // Minimal token structure for Tailwind processing
      }) as NonNullableStyleToken
    );

    return {
      variantPath: parsedStyleToken.variantCombinationName,
      tokens
    };
  });
};
```

### Variant-Aware Class Generation
```typescript
// Generate variant-specific utility classes
const generateVariantClasses = (
  variantTokens: { variantPath: string; tokens: NonNullableStyleToken[] }[]
) => {
  let output = '';
  
  variantTokens.forEach(({ variantPath, tokens }) => {
    // Create component variant class
    output += `.${variantPath} {\n`;
    
    // Generate Tailwind utilities for this variant
    const tailwindClasses = createTailwindClasses(tokens);
    if (tailwindClasses.length > 0) {
      output += `  @apply ${tailwindClasses.join(' ')};\n`;
    } else {
      // Fallback to direct CSS properties
      tokens.forEach(token => {
        output += `  ${token.property}: ${token.rawValue};\n`;
      });
    }
    
    output += '}\n\n';
  });
  
  return output;
};
```

## Advanced Variant Patterns

### State-Based Variants
```typescript
// Handle interactive states (hover, focus, active)
const processInteractionStates = (variants: ComponentVariant[]) => {
  const baseVariant = variants.find(v => !v.name.includes('Hover') && !v.name.includes('Focus'));
  const stateVariants = variants.filter(v => v.name.includes('Hover') || v.name.includes('Focus'));
  
  let css = '';
  
  if (baseVariant) {
    css += `.${sanitizeName(baseVariant.name)} {\n`;
    css += generateCSSProperties(baseVariant.tokens);
    css += '}\n';
  }
  
  stateVariants.forEach(stateVariant => {
    const stateName = extractStateName(stateVariant.name); // 'hover', 'focus', etc.
    css += `.${sanitizeName(baseVariant?.name)}:${stateName} {\n`;
    css += generateCSSProperties(stateVariant.tokens);
    css += '}\n';
  });
  
  return css;
};
```

### Responsive Variants
```typescript
// Handle responsive/breakpoint variants
const processResponsiveVariants = (variants: ComponentVariant[]) => {
  const breakpoints = {
    'Mobile': '@media (max-width: 767px)',
    'Tablet': '@media (min-width: 768px) and (max-width: 1023px)',
    'Desktop': '@media (min-width: 1024px)'
  };
  
  let css = '';
  
  variants.forEach(variant => {
    const breakpoint = extractBreakpoint(variant.name);
    
    if (breakpoint && breakpoints[breakpoint]) {
      css += `${breakpoints[breakpoint]} {\n`;
      css += `  .${sanitizeName(variant.name)} {\n`;
      css += `    ${generateCSSProperties(variant.tokens)}`;
      css += '  }\n';
      css += '}\n';
    } else {
      // Default/base variant
      css += `.${sanitizeName(variant.name)} {\n`;
      css += generateCSSProperties(variant.tokens);
      css += '}\n';
    }
  });
  
  return css;
};
```

### Multi-Axis Variants
```typescript
// Handle components with multiple variant axes (size + color + state)
interface VariantAxis {
  name: string;
  values: string[];
}

const processMultiAxisVariants = (
  axes: VariantAxis[],
  tokens: StyleToken[]
) => {
  const combinations = generateAxisCombinations(axes);
  
  return combinations.map(combination => {
    // Create class name from combination
    const className = combination
      .map(({ axis, value }) => `${axis}-${value}`)
      .join('-');
    
    // Filter tokens that apply to this combination
    const applicableTokens = tokens.filter(token =>
      matchesVariantCombination(token, combination)
    );
    
    return {
      className: sanitizeName(className),
      tokens: applicableTokens
    };
  });
};

// Example: Button with Size=(Small, Large) and Color=(Primary, Secondary)
// Generates: button-size-small-color-primary, button-size-large-color-secondary, etc.
```

## Performance Optimizations

### 1. Efficient Variant Detection
```typescript
// Cache variant analysis results
const variantCache = new Map<string, VariantAnalysis>();

const analyzeVariants = (componentSetId: string, variants: ComponentVariant[]) => {
  if (variantCache.has(componentSetId)) {
    return variantCache.get(componentSetId)!;
  }
  
  const analysis = performVariantAnalysis(variants);
  variantCache.set(componentSetId, analysis);
  return analysis;
};
```

### 2. Lazy Combination Generation
```typescript
// Generate combinations only when needed
const getCombinations = (axes: VariantAxis[]): Generator<Combination> => {
  function* generateCombinations(axisIndex = 0, current: Combination = []): Generator<Combination> {
    if (axisIndex >= axes.length) {
      yield current;
      return;
    }
    
    const axis = axes[axisIndex];
    for (const value of axis.values) {
      yield* generateCombinations(axisIndex + 1, [...current, { axis: axis.name, value }]);
    }
  }
  
  return generateCombinations();
};
```

### 3. Deduplication Strategy
```typescript
// Remove duplicate variant combinations
const deduplicateVariants = (variants: ProcessedVariant[]) => {
  const seen = new Set<string>();
  
  return variants.filter(variant => {
    // Create unique key from CSS properties
    const key = Object.entries(variant.css)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([prop, value]) => `${prop}:${value}`)
      .join(';');
    
    if (seen.has(key)) {
      return false; // Duplicate combination
    }
    
    seen.add(key);
    return true;
  });
};
```

## Error Handling and Validation

### 1. Variant Validation
```typescript
const validateVariants = (componentSet: ComponentSetToken): string[] => {
  const warnings: string[] = [];
  const variantNames = Object.keys(componentSet.variants);
  
  // Check for naming conflicts
  const sanitizedNames = variantNames.map(sanitizeName);
  const duplicateSanitized = sanitizedNames.filter(
    (name, index) => sanitizedNames.indexOf(name) !== index
  );
  
  if (duplicateSanitized.length > 0) {
    warnings.push(
      `Variant names will conflict after sanitization: ${duplicateSanitized.join(', ')}`
    );
  }
  
  // Check for missing variants
  if (variantNames.length === 0) {
    warnings.push(`Component set "${componentSet.name}" has no variants`);
  }
  
  return warnings;
};
```

### 2. Combination Complexity Management
```typescript
// Prevent exponential explosion of variant combinations
const MAX_COMBINATIONS = 100;

const limitCombinations = (combinations: Combination[]): Combination[] => {
  if (combinations.length <= MAX_COMBINATIONS) {
    return combinations;
  }
  
  console.warn(
    `Too many variant combinations (${combinations.length}). ` +
    `Limiting to ${MAX_COMBINATIONS} most common combinations.`
  );
  
  // Use heuristics to select most important combinations
  return selectImportantCombinations(combinations, MAX_COMBINATIONS);
};
```

### 3. Graceful Degradation
```typescript
// Handle malformed variant data
const processVariantSafely = (variant: any): ProcessedVariant | null => {
  try {
    if (!variant.name || !variant.tokens) {
      console.warn('Malformed variant data, skipping:', variant);
      return null;
    }
    
    return processVariant(variant);
  } catch (error) {
    console.error(`Failed to process variant ${variant.name}:`, error);
    return null; // Skip this variant but continue processing others
  }
};
```

## Integration Points

- **Design Token Extraction**: Receives component and variant information
- **Style Processing Pipeline**: Gets processed tokens for variant organization
- **Output Transformation**: Provides variant-aware token structures
- **Testing Infrastructure**: Supports variant-specific testing scenarios

## Key Responsibilities

1. **Variant Detection**: Identify and validate component variants in Figma
2. **Combination Logic**: Generate appropriate variant combinations
3. **Class Name Generation**: Create maintainable CSS class hierarchies
4. **Conflict Resolution**: Handle naming conflicts and duplicates
5. **Performance Management**: Optimize for large numbers of variants
6. **Error Handling**: Gracefully handle malformed or complex variant data
