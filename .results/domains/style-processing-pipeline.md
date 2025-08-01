# Style Processing Pipeline Domain

## Overview
Processor-based system that converts Figma node properties into standardized design tokens using specialized processors for different style categories. This domain implements the core logic for translating Figma's design properties into CSS-compatible values.

## Core Architecture

### Processor Interface (`src/types/processors.ts`)
```typescript
export interface StyleProcessor {
  property: string;                    // CSS property name
  bindingKey: keyof VariableBindings | undefined; // Figma variable binding
  process: (variables: VariableToken[], node?: SceneNode) => Promise<ProcessedValue | null>;
}

export interface ProcessedValue {
  value: string | null;      // CSS with variable references
  rawValue: string | null;   // CSS with actual values  
  valueType?: string | null; // Unit type (px, %, etc.)
  warnings?: string[];
  errors?: string[];
}
```

### Processor Factory (`src/processors/index.ts`)
```typescript
export function getProcessorsForNode(node: SceneNode): StyleProcessor[] {
  switch (node.type) {
    case 'TEXT':
      return fontProcessors; // Typography-specific processors
    case 'FRAME':
    case 'RECTANGLE': 
    case 'INSTANCE':
    case 'ELLIPSE':
    case 'COMPONENT':
      return [...backgroundProcessors, ...layoutProcessors, 
              ...borderProcessors, ...spacingProcessors];
    default:
      return [];
  }
}
```

## Processor Categories

### 1. Background Processing (`src/processors/background.processor.ts`)

#### Solid Color Processing
```typescript
{
  property: 'background',
  bindingKey: 'fills',
  process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
    if (node && 'fills' in node && Array.isArray(node.fills)) {
      const visibleFills = node.fills.filter(fill => fill.visible);
      
      const backgrounds = await Promise.all(
        visibleFills.map(async (fill: Paint) => {
          if (fill.type === 'SOLID') {
            // Check for variable binding first
            const fillVariable = variables.find(v => v.property === 'fills');
            if (fillVariable) {
              return { value: fillVariable.value, rawValue: fillVariable.rawValue };
            }
            
            // Process solid color
            const { r, g, b } = fill.color;
            const a = fill.opacity ?? 1;
            const value = rgbaToString(r, g, b, a);
            return { value, rawValue: value };
          }
          
          if (fill.type.startsWith('GRADIENT_')) {
            return processGradient(fill as GradientPaint, node.id);
          }
          
          return null;
        })
      );
      
      // Return first valid background
      const validBackground = backgrounds.find(bg => bg?.value);
      return validBackground || null;
    }
    return null;
  }
}
```

#### Gradient Processing
```typescript
export function processGradient(gradient: GradientPaint, nodeId: string): ProcessedValue {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    // Convert gradient stops to CSS format
    const stops = gradient.gradientStops.map(stop => {
      const { r, g, b } = stop.color;
      const alpha = stop.color.a ?? 1;
      const position = Math.round(stop.position * 100);
      
      if (alpha < 1) {
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha}) ${position}%`;
      }
      return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}) ${position}%`;
    });
    
    // Calculate gradient angle
    const angle = calculateGradientAngle(gradient.gradientTransform);
    const value = `linear-gradient(${angle}deg, ${stops.join(', ')})`;
    
    return { value, rawValue: value, warnings, errors };
  } catch (error) {
    errors.push(`Failed to process gradient: ${error.message}`);
    return { value: null, rawValue: null, warnings, errors };
  }
}
```

### 2. Layout Processing (`src/processors/layout.processor.ts`)

#### Flexbox Mapping
```typescript
// Figma Auto Layout → CSS Flexbox mapping
const layoutProcessors: StyleProcessor[] = [
  {
    property: 'display',
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'layoutMode' in node && node.layoutMode !== 'NONE') {
        return { value: 'flex', rawValue: 'flex' };
      }
      return null;
    }
  },
  {
    property: 'flex-direction', 
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'layoutMode' in node && node.layoutMode !== 'NONE') {
        const value = node.layoutMode === 'VERTICAL' ? 'column' : 'row';
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: 'justify-content',
    bindingKey: undefined, 
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'primaryAxisAlignItems' in node) {
        const alignMap = {
          CENTER: 'center',
          MAX: 'flex-end', 
          SPACE_BETWEEN: 'space-between'
        };
        const value = alignMap[node.primaryAxisAlignItems] || 'flex-start';
        return { value, rawValue: value };
      }
      return null;
    }
  }
];
```

#### Dimension Processing
```typescript
{
  property: 'width',
  bindingKey: undefined,
  process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
    if (!node || !hasLayout(node)) return null;
    
    // Handle different width scenarios
    if (node.type === 'TEXT') {
      // Text nodes have special width handling
      if (!['WIDTH_AND_HEIGHT', 'WIDTH'].includes(node.textAutoResize)) {
        return { 
          value: `${node.width}px`, 
          rawValue: `${node.width}px`, 
          valueType: 'px' 
        };
      }
    } else if ('width' in node && typeof node.width === 'number') {
      return { 
        value: `${node.width}px`, 
        rawValue: `${node.width}px`, 
        valueType: 'px' 
      };
    }
    
    return null;
  }
}
```

### 3. Typography Processing (`src/processors/font.processor.ts`)

#### Font Family and Weight
```typescript
{
  property: 'font-family',
  bindingKey: 'fontFamily',
  process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
    // Check for variable binding first
    const fontVariable = variables.find(v => v.property === 'fontFamily');
    if (fontVariable) {
      return { value: fontVariable.value, rawValue: fontVariable.rawValue };
    }
    
    // Extract from node properties
    if (node?.type === 'TEXT' && node.fontName && typeof node.fontName === 'object') {
      const value = node.fontName.family;
      return { value, rawValue: value };
    }
    
    return null;
  }
},
{
  property: 'font-weight',
  bindingKey: 'fontWeight',
  process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
    const weightVariable = variables.find(v => v.property === 'fontWeight');
    if (weightVariable) {
      return { value: weightVariable.value, rawValue: weightVariable.rawValue };
    }
    
    if (node.fontName && typeof node.fontName === 'object') {
      const weightMap: Record<string, string> = {
        'Thin': '100', 'Extra Light': '200', 'Light': '300',
        'Regular': '400', 'Medium': '500', 'Semi Bold': '600',
        'Bold': '700', 'Extra Bold': '800', 'Black': '900'
      };
      
      const weight = weightMap[node.fontName.style] || '400';
      return { value: weight, rawValue: weight };
    }
    
    return null;
  }
}
```

#### Text Alignment and Layout
```typescript
{
  property: 'text-align',
  bindingKey: undefined,
  process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
    if (node?.type === 'TEXT' && node.textAlignHorizontal !== 'LEFT') {
      const alignmentMap: Record<string, string> = {
        'LEFT': 'left', 'CENTER': 'center', 
        'RIGHT': 'right', 'JUSTIFIED': 'justify'
      };
      
      const alignment = alignmentMap[node.textAlignHorizontal.toUpperCase()];
      return alignment ? { value: alignment, rawValue: alignment } : null;
    }
    return null;
  }
}
```

### 4. Border Processing (`src/processors/border.processor.ts`)

#### Border Styles and Shadows
```typescript
{
  property: 'box-shadow',
  bindingKey: undefined,
  process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
    if (!node || !('strokes' in node)) return null;
    
    const shadows: string[] = [];
    const rawShadows: string[] = [];
    
    // Process each stroke as a border shadow
    node.strokes?.forEach((stroke, index) => {
      if (stroke.visible && stroke.type === 'SOLID') {
        const strokeWeight = node.strokeWeight || 1;
        const { r, g, b } = stroke.color;
        const alpha = stroke.opacity ?? 1;
        
        // Determine border position
        const strokeAlign = node.strokeAlign || 'INSIDE';
        const isInset = strokeAlign === 'INSIDE';
        
        const color = { value: rgbaToString(r, g, b, alpha), rawValue: rgbaToString(r, g, b, alpha) };
        const width = { value: `${strokeWeight}px`, rawValue: `${strokeWeight}px` };
        
        // Create box-shadow syntax
        const insetPrefix = isInset ? 'inset ' : '';
        shadows.push(`${insetPrefix}0 0 0 ${width.value} ${color.value}`);
        rawShadows.push(`${insetPrefix}0 0 0 ${width.rawValue} ${color.rawValue}`);
      }
    });
    
    if (shadows.length > 0) {
      return {
        value: shadows.join(', '),
        rawValue: rawShadows.join(', '),
        valueType: 'px'
      };
    }
    
    return null;
  }
}
```

#### Border Radius
```typescript
{
  property: 'border-radius',
  bindingKey: undefined,
  process: async (variables, node?: SceneNode): Promise<ProcessedValue | null> => {
    // Handle ELLIPSE nodes (perfect circles)
    if (node?.type === 'ELLIPSE') {
      return { value: '50%', rawValue: '50%', valueType: '%' };
    }
    
    // Handle corner radius
    if (node && 'cornerRadius' in node) {
      const radius = node.cornerRadius;
      
      if (typeof radius === 'number') {
        return { 
          value: `${radius}px`, 
          rawValue: `${radius}px`, 
          valueType: 'px' 
        };
      }
      
      // Handle individual corner radii
      if (typeof radius === 'object') {
        const { topLeft, topRight, bottomRight, bottomLeft } = radius;
        const values = [topLeft, topRight, bottomRight, bottomLeft];
        const uniqueValues = [...new Set(values)];
        
        if (uniqueValues.length === 1) {
          return { 
            value: `${uniqueValues[0]}px`, 
            rawValue: `${uniqueValues[0]}px`, 
            valueType: 'px' 
          };
        } else {
          const value = values.map(v => `${v}px`).join(' ');
          return { value, rawValue: value, valueType: 'px' };
        }
      }
    }
    
    return null;
  }
}
```

## Key Patterns

### 1. Strategy Pattern for Processor Selection
Each node type gets appropriate processors based on its capabilities and properties.

### 2. Template Method for Common Processing Logic
```typescript
// Common pattern: Check variables first, then node properties
const commonProcessingPattern = async (variables, node, property) => {
  // 1. Check for variable binding
  const variable = variables.find(v => v.property === property);
  if (variable) return { value: variable.value, rawValue: variable.rawValue };
  
  // 2. Extract from node properties  
  if (node && property in node) {
    const value = extractValue(node[property]);
    return { value, rawValue: value };
  }
  
  // 3. Return null if not applicable
  return null;
};
```

### 3. Chain of Responsibility for Processing Pipeline
Processors are applied in sequence, with each processor handling its specific properties.

### 4. Adapter Pattern for Figma → CSS Mapping
```typescript
// Figma layoutMode → CSS flex-direction
const layoutModeMap = {
  'HORIZONTAL': 'row',
  'VERTICAL': 'column', 
  'NONE': null
};

// Figma alignItems → CSS justify-content/align-items
const alignmentMap = {
  'MIN': 'flex-start',
  'CENTER': 'center', 
  'MAX': 'flex-end',
  'SPACE_BETWEEN': 'space-between'
};
```

## Variable Resolution Strategy

### 1. Priority Order
1. **Variable Bindings**: Check for Figma variable bindings first
2. **Node Properties**: Fall back to direct node property values
3. **Defaults**: Use sensible defaults if neither is available

### 2. Variable Token Structure
```typescript
interface VariableToken extends BaseToken {
  type: 'variable';
  value: string;    // SASS variable reference e.g. $color-primary  
  rawValue: string; // Actual value e.g. #FF0000
}
```

## Error Handling and Validation

### 1. Graceful Degradation
```typescript
// Continue processing even if individual properties fail
const processedValue = await processor.process(variables, node).catch(error => {
  console.warn(`Processor ${processor.property} failed:`, error);
  return null; // Skip this property but continue
});
```

### 2. Type Safety with Guards
```typescript
function hasLayout(node: SceneNode): node is SceneNode & NodeWithLayout {
  return 'layoutMode' in node && 'width' in node && 'height' in node;
}

function hasFont(node: SceneNode): node is TextNode {
  return node.type === 'TEXT' && 'fontName' in node;
}
```

### 3. Warning and Error Collection
```typescript
const processedValue: ProcessedValue = {
  value: computedValue,
  rawValue: computedRawValue,
  warnings: collectedWarnings.length > 0 ? collectedWarnings : undefined,
  errors: collectedErrors.length > 0 ? collectedErrors : undefined
};
```

## Performance Optimizations

### 1. Lazy Evaluation
Only process properties that are applicable to the current node type.

### 2. Caching
```typescript
// Cache processed values to avoid recomputation
const processedCache = new Map<string, ProcessedValue>();
```

### 3. Early Returns
```typescript
// Exit early if processor not applicable
if (!node || node.type !== 'TEXT') return null;
```

## Integration Points

- **Design Token Extraction**: Receives nodes and variables for processing
- **Variable Management**: Resolves variable bindings and references
- **Output Transformation**: Provides processed tokens for transformation
- **Testing Infrastructure**: Supports isolated processor testing
