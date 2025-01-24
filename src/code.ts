import Utils from './utils';
import Github from './github';

// At the top of the file, add a variable to store the generated SCSS
let generatedScss: string = '';

// Show the UI with resizable window
figma.showUI(__html__, {
  width: 600,
  height: 1200,
  themeColors: true,
  title: "Eggstractor"
});

interface VariableBindings {
  fills?: VariableAlias | VariableAlias[];
  strokes?: VariableAlias | VariableAlias[];
  strokeWeight?: VariableAlias | VariableAlias[];
  fontSize?: VariableAlias | VariableAlias[];
  fontWeight?: VariableAlias | VariableAlias[];
  lineHeight?: VariableAlias | VariableAlias[];
  letterSpacing?: VariableAlias | VariableAlias[];
  fontFamily?: VariableAlias | VariableAlias[];
  cornerRadius?: VariableAlias | VariableAlias[];
  itemSpacing?: VariableAlias | VariableAlias[];
  gap?: VariableAlias | VariableAlias[];
  paddingTop?: VariableAlias | VariableAlias[];
  paddingRight?: VariableAlias | VariableAlias[];
  paddingBottom?: VariableAlias | VariableAlias[];
  paddingLeft?: VariableAlias | VariableAlias[];
}

interface StyleProcessor {
  property: string;
  bindingKey: keyof VariableBindings | undefined;
  process: (variables: VariableToken[], node?: SceneNode) => Promise<ProcessedValue | null>;
}

// Token Types
interface DesignToken {
  name: string;
  value: any;
  originalValue?: any;
  metadata?: {
    figmaId?: string;
    variableId?: string;
    variableName?: string;
  };
}

interface BaseToken {
  type: 'variable' | 'style';
  name: string;
  property: string;
  path: string[];
  metadata?: {
    figmaId?: string;
    variableId?: string;
    variableName?: string;
  };
}

interface VariableToken extends BaseToken {
  type: 'variable';
  value: string; // SASS variable reference e.g. $color-primary
  rawValue: string; // Actual value e.g. #FF0000
}

interface StyleToken extends BaseToken {
  type: 'style';
  value: string; // CSS with variable references e.g. background: $color-primary
  rawValue: string; // CSS with actual values e.g. background: #FF0000
  variables?: VariableToken[]; // Associated variable tokens
}

interface TokenCollection {
  tokens: (StyleToken | VariableToken)[];
}

interface GradientStop {
  color: {
    variable: string;
    value: RGBA;
  };
  position: number;
}

interface GradientValue {
  type: string;
  stops: GradientStop[];
  transform: Transform;
}

interface GradientToken {
  type: 'gradient';
  value: GradientValue;
}

// First add the ProcessedValue interface
interface ProcessedValue {
  value: string;   // Value with variable references
  rawValue: string; // Value with actual values
}

// Main generation function
async function generateStyles(format: 'scss' | 'css'): Promise<string> {
  const tokens = await collectTokens();
  switch (format) {
    case 'scss':
      return transformToScss(tokens);
    case 'css':
      return transformToCss(tokens);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// Token Collection
async function collectTokens(): Promise<TokenCollection> {
  const collection: TokenCollection = { tokens: [] };

  async function processNode(node: BaseNode) {
    if ('type' in node && 'boundVariables' in node) {
      const nodePath = getNodePathName(node as SceneNode).split('_');

      // Process layout properties for variant components
      if (node.type === "COMPONENT") {
        const processors = frameNodeProcessors.filter(p =>
          ['display', 'flex-direction', 'align-items', 'gap',
            'padding-top', 'padding-right', 'padding-bottom', 'padding-left'].includes(p.property)
        );

        for (const processor of processors) {
          // Get the direct value from the component
          const directValue = getDirectNodeValue(node as SceneNode, processor.property);
          if (directValue) {
            collection.tokens.push({
              type: 'style',
              name: nodePath.join('_'),
              value: directValue,
              rawValue: directValue,
              property: processor.property,
              path: nodePath
            });
          }
        }
      } else {
        // Process other nodes with the new token structure
        const processors = getProcessorsForNode(node as SceneNode);
        for (const processor of processors) {
          const tokens = await extractNodeToken(node as SceneNode, processor, nodePath);
          collection.tokens.push(...tokens);
        }
      }
    }

    // Process children
    if ("children" in node) {
      for (const child of node.children) {
        await processNode(child);
      }
    }
  }

  await processNode(figma.currentPage);
  return collection;
}

// Token Extraction
async function extractNodeToken(
  node: SceneNode,
  processor: StyleProcessor,
  path: string[]
): Promise<(StyleToken | VariableToken)[]> {
  const tokens: (StyleToken | VariableToken)[] = [];

  // Step 1: Handle Variable Bindings
  const customBoundVariables = node.boundVariables as unknown as VariableBindings;
  const bindings = processor.bindingKey
    ? (Array.isArray(customBoundVariables[processor.bindingKey])
      ? customBoundVariables[processor.bindingKey] as VariableAlias[]
      : [customBoundVariables[processor.bindingKey]] as VariableAlias[])
    : [];

  // Step 2: Create Variable Tokens
  const variableTokens: VariableToken[] = [];
  for (const binding of bindings) {
    if (!binding?.id) continue;

    const variable = await figma.variables.getVariableByIdAsync(binding.id);
    if (!variable) continue;

    const rawValue = await getVariableFallback(variable, processor.property);
    const variableToken: VariableToken = {
      type: 'variable',
      name: variable.name,
      value: `$${Utils.sanitizeName(variable.name)}`,
      rawValue,
      property: processor.property,
      path,
      metadata: {
        figmaId: node.id,
        variableId: variable.id,
        variableName: variable.name,
      }
    };

    variableTokens.push(variableToken);
    tokens.push(variableToken);
  }

  // Step 3: Process the node and create Style Token
  const processedValue = await processor.process(variableTokens, node);
  if (processedValue) {
    const styleToken: StyleToken = {
      type: 'style',
      name: path.join('_'),
      value: processedValue.value,
      rawValue: processedValue.rawValue,
      property: processor.property,
      path,
      variables: variableTokens.length > 0 ? variableTokens : undefined,
      metadata: {
        figmaId: node.id,
      }
    };

    tokens.push(styleToken);
  }

  return tokens;
}

// SCSS Transform
function transformToScss(tokens: TokenCollection): string {
  let output = "// Generated SCSS Variables\n";

  // Filter for variable tokens and ensure uniqueness by variable name
  const variableTokens = tokens.tokens.filter((token): token is VariableToken => 
    token.type === 'variable'
  );

  const uniqueVariables = new Map<string, VariableToken>();
  variableTokens.forEach(token => {
    if (token.metadata?.variableName) {
      uniqueVariables.set(token.metadata.variableName, token);
    }
  });

  // Output variables
  uniqueVariables.forEach(token => {
    output += `$${Utils.sanitizeName(token.name)}: ${token.rawValue};\n`;
  });

  // Generate mixins section
  output += "\n// Generated SCSS Mixins\n";

  // Filter for style tokens and group by path
  const styleTokens = tokens.tokens.filter((token): token is StyleToken => 
    token.type === 'style'
  );

  const variantGroups = groupBy(styleTokens, t => t.path.join('_'));

  Object.entries(variantGroups).forEach(([variantPath, groupTokens]) => {
    if (!variantPath) return;

    // Sort tokens to put layout properties first
    const layoutProperties = [
      'display',
      'flex-direction',
      'align-items',
      'gap',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left'
    ];

    const sortedTokens = groupTokens.sort((a, b) => {
      const aIndex = layoutProperties.indexOf(a.property);
      const bIndex = layoutProperties.indexOf(b.property);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    // Remove duplicates keeping the last occurrence
    const uniqueTokens = sortedTokens.reduce((acc, token) => {
      const existingIndex = acc.findIndex(t => t.property === token.property);
      if (existingIndex !== -1) {
        acc[existingIndex] = token;
      } else {
        acc.push(token);
      }
      return acc;
    }, [] as StyleToken[]);

    if (uniqueTokens.length > 0) {
      output += `@mixin ${variantPath} {\n`;
      uniqueTokens.forEach(token => {
        output += `  ${token.property}: ${token.value};\n`;
      });
      output += "}\n\n";
    }
  });

  return output;
}

// Add new CSS transform function
function transformToCss(tokens: TokenCollection): string {
  let output = "/* Generated CSS */";

  // Filter for style tokens only
  const styleTokens = tokens.tokens.filter((token): token is StyleToken => 
    token.type === 'style'
  );

  const variantGroups = groupBy(styleTokens, t => t.path.join('_'));
  Object.entries(variantGroups).forEach(([variantPath, groupTokens]) => {
    if (!variantPath) return;
    // Remove properties with zero values and unnecessary defaults
    const uniqueTokens = groupTokens.reduce((acc, token) => {
      const existing = acc.find(t => t.property === token.property);
      if (!existing && token.value !== 'inherit') {
        // Skip zero values for certain properties
        if (['gap', 'padding'].includes(token.property) && 
            (token.value === '0' || token.value === '0px')) {
          return acc;
        }
        // Skip default values
        if (token.property === 'border-width' && token.value === '1px') {
          return acc;
        }
        acc.push(token);
      }
      return acc;
    }, [] as StyleToken[]);

    // Only output class if there are non-inherited properties
    if (uniqueTokens.length > 0) {
      output += `\n.${variantPath} {\n`;
      uniqueTokens.forEach(token => {
        output += `  ${token.property}: ${token.rawValue};\n`;
      });
      output += "}\n";
    }
  });

  return output;
}

// Helper function
function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const k = key(item);
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// Define processors for different node types
const textNodeProcessors: StyleProcessor[] = [
  {
    property: "color",
    bindingKey: "fills",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      // Check for variable first
      const colorVariable = variables.find(v => v.property === 'color');
      if (colorVariable) {
        return {
          value: colorVariable.value,
          rawValue: colorVariable.rawValue
        };
      }

      // Handle direct node value
      if (node?.type === "TEXT" && node.fills && Array.isArray(node.fills)) {
        const fill = node.fills[0] as Paint;
        if (fill?.type === "SOLID") {
          const { r, g, b } = fill.color;
          const a = fill.opacity ?? 1;
          const value = Utils.rgbaToString(r, g, b, a);
          return { value, rawValue: value };
        }
      }
      return null;
    }
  },
  {
    property: "font-family",
    bindingKey: "fontFamily",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const fontVariable = variables.find(v => v.property === 'font-family');
      if (fontVariable) {
        return {
          value: fontVariable.value,
          rawValue: fontVariable.rawValue
        };
      }

      if (node?.type === "TEXT" && node.fontName && typeof node.fontName === 'object') {
        const value = node.fontName.family;
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "font-size",
    bindingKey: "fontSize",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const sizeVariable = variables.find(v => v.property === 'font-size');
      if (sizeVariable) {
        return {
          value: sizeVariable.value,
          rawValue: sizeVariable.rawValue
        };
      }

      if (node?.type === "TEXT") {
        const value = `${String(node.fontSize)}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "font-weight",
    bindingKey: "fontWeight",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const weightVariable = variables.find(v => v.property === 'font-weight');
      if (weightVariable) {
        return {
          value: weightVariable.value,
          rawValue: weightVariable.rawValue
        };
      }

      if (node?.type === "TEXT") {
        const value = String(node.fontWeight);
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "line-height",
    bindingKey: "lineHeight",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const heightVariable = variables.find(v => v.property === 'line-height');
      if (heightVariable) {
        return {
          value: heightVariable.value,
          rawValue: heightVariable.rawValue
        };
      }

      if (node?.type === "TEXT" && 'lineHeight' in node) {
        const lineHeight = node.lineHeight;
        if (typeof lineHeight === 'object') {
          if (lineHeight.unit === "AUTO") {
            return { value: "normal", rawValue: "normal" };
          }
          const value = lineHeight.value;
          const formatted = lineHeight.unit.toLowerCase() === "percent" ? 
            `${value}%` : 
            (value > 4 ? `${value}px` : String(value));
          return { value: formatted, rawValue: formatted };
        }
      }
      return null;
    }
  },
  {
    property: "letter-spacing",
    bindingKey: "letterSpacing",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const spacingVariable = variables.find(v => v.property === 'letter-spacing');
      if (spacingVariable) {
        return {
          value: spacingVariable.value,
          rawValue: spacingVariable.rawValue
        };
      }

      if (node?.type === "TEXT" && 'letterSpacing' in node) {
        const letterSpacing = node.letterSpacing;
        if (typeof letterSpacing === 'object' && letterSpacing.value !== 0) {
          const value = `${letterSpacing.value}${letterSpacing.unit.toLowerCase() === "percent" ? '%' : 'px'}`;
          return { value, rawValue: value };
        }
      }
      return null;
    }
  }
];

const frameNodeProcessors: StyleProcessor[] = [
  {
    property: "background",
    bindingKey: "fills",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      // Handle direct node values if no variables
      if (node && 'fills' in node && Array.isArray(node.fills)) {
        const visibleFills = node.fills.filter(fill => fill.visible);
        if (!visibleFills.length) return null;

        const backgrounds = await Promise.all(visibleFills.map(async (fill: Paint) => {
          if (fill.type === "SOLID") {
            // Check if we have a variable for this fill
            const fillVariable = variables.find(v => v.property === 'background');
            if (fillVariable) {
              console.log('fillVariable', fillVariable);
              return {
                value: fillVariable.value,
                rawValue: fillVariable.rawValue
              };
            }

            // No variable, use direct value
            const { r, g, b } = fill.color;
            const a = fill.opacity ?? 1;
            const value = Utils.rgbaToString(r, g, b, a);
            return { value, rawValue: value };
          }
          
          if (fill.type === "GRADIENT_LINEAR" || fill.type === "GRADIENT_RADIAL") {
            const gradientFill = fill as GradientPaint;
            const stops = await Promise.all(gradientFill.gradientStops.map(async (stop, index) => {
              // Check if we have a variable for this stop
              const stopVariable = variables.find(v => 
                v.metadata?.figmaId === `${node.id}-gradient-stop-${index}`
              );

              let color;
              if (stopVariable) {
                color = {
                  value: stopVariable.value,
                  rawValue: stopVariable.rawValue
                };
              } else {
                const { r, g, b, a } = stop.color;
                // Use exact percentage from stop position
                const directColor = a === 1 ? 
                  Utils.rgbToHex(r, g, b) : 
                  `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Number(a).toFixed(2)})`;
                color = { value: directColor, rawValue: directColor };
              }

              // Use exact percentage from stop position
              return `${color.value} ${(stop.position * 100).toFixed(2)}%`;
            }));

            const rawStops = await Promise.all(gradientFill.gradientStops.map(async (stop, index) => {
              const stopVariable = variables.find(v => 
                v.metadata?.figmaId === `${node.id}-gradient-stop-${index}`
              );

              let color;
              if (stopVariable) {
                color = stopVariable.rawValue;
              } else {
                const { r, g, b, a } = stop.color;
                color = a === 1 ? 
                  Utils.rgbToHex(r, g, b) : 
                  `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Number(a).toFixed(2)})`;
              }

              // Use exact percentage from stop position
              return `${color} ${(stop.position * 100).toFixed(2)}%`;
            }));

            if (fill.type === "GRADIENT_RADIAL") {
              const [[a, b], [c, d]] = gradientFill.gradientTransform;
              // Convert transform matrix to percentage positions
              const centerX = Math.round((c + 1) * 50);
              const centerY = Math.round((d + 1) * 50);
              // Calculate radius based on transform scale
              const radiusX = Math.round(Math.sqrt(a * a + b * b) * 50);
              const radiusY = Math.round(Math.sqrt(c * c + d * d) * 50);
              
              return {
                value: `radial-gradient(ellipse ${radiusX}% ${radiusY}% at ${centerX}% ${centerY}%, ${stops.join(', ')})`,
                rawValue: `radial-gradient(ellipse ${radiusX}% ${radiusY}% at ${centerX}% ${centerY}%, ${rawStops.join(', ')})`
              };
            }

            if (fill.type === "GRADIENT_LINEAR") {
              const angle = 360 - Math.round(getGradientAngle(gradientFill.gradientTransform));
              const stops = await Promise.all(gradientFill.gradientStops.map(async (stop, index) => {
                const stopVariable = variables.find(v => 
                  v.metadata?.figmaId === `${node.id}-gradient-stop-${index}`
                );

                let color;
                if (stopVariable) {
                  color = stopVariable.value;
                } else {
                  const { r, g, b, a } = stop.color;
                  color = a === 1 ? 
                    Utils.rgbToHex(r, g, b) : 
                    `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Number(a).toFixed(2)})`;
                }

                // Use the exact position from Figma without rounding
                return `${color} ${(stop.position * 100).toFixed(2)}%`;
              }));

              const rawStops = await Promise.all(gradientFill.gradientStops.map(async (stop, index) => {
                const stopVariable = variables.find(v => 
                  v.metadata?.figmaId === `${node.id}-gradient-stop-${index}`
                );

                let color;
                if (stopVariable) {
                  color = stopVariable.rawValue;
                } else {
                  const { r, g, b, a } = stop.color;
                  color = a === 1 ? 
                    Utils.rgbToHex(r, g, b) : 
                    `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Number(a).toFixed(2)})`;
                }

                // Use the exact position from Figma without rounding
                return `${color} ${(stop.position * 100).toFixed(2)}%`;
              }));

              return {
                value: `linear-gradient(${angle}deg, ${stops.join(', ')})`,
                rawValue: `linear-gradient(${angle}deg, ${rawStops.join(', ')})`
              };
            }
          }
          return null;
        }));

        const validBackgrounds = backgrounds.filter((b): b is NonNullable<typeof b> => b !== null);
        if (validBackgrounds.length > 0) {
          return {
            value: validBackgrounds.map(b => b.value).join(', '),
            rawValue: validBackgrounds.map(b => b.rawValue).join(', ')
          };
        }
      }
      return null;
    }
  },
  {
    property: "border-color",
    bindingKey: "strokes",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const borderVariable = variables.find(v => v.property === 'border-color');
      if (borderVariable) {
        return {
          value: borderVariable.value,
          rawValue: borderVariable.rawValue
        };
      }

      if (node && 'strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0] as Paint;
        if (stroke?.type === "SOLID") {
          const { r, g, b } = stroke.color;
          const a = stroke.opacity ?? 1;
          const value = a === 1 ? 
            Utils.rgbToHex(r, g, b) : 
            `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Number(a).toFixed(2)})`;
          return { value, rawValue: value };
        }
      }
      return null;
    }
  },
  {
    property: "border-width",
    bindingKey: "strokeWeight",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const widthVariable = variables.find(v => v.property === 'border-width');
      if (widthVariable) {
        return {
          value: widthVariable.value,
          rawValue: widthVariable.rawValue
        };
      }

      if (node && 'strokeWeight' in node && node.strokeWeight) {
        const value = `${String(node.strokeWeight)}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "border-radius",
    bindingKey: "cornerRadius",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const radiusVariable = variables.find(v => v.property === 'border-radius');
      if (radiusVariable) {
        return {
          value: radiusVariable.value,
          rawValue: radiusVariable.rawValue
        };
      }

      if (node && 'cornerRadius' in node && node.cornerRadius) {
        const value = `${String(node.cornerRadius)}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "display",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'layoutMode' in node && node.layoutMode && node.layoutMode !== "NONE") {
        const value = node.layoutAlign !== "STRETCH" ? "inline-flex" : "flex";
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "flex-direction",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'layoutMode' in node && node.layoutMode && node.layoutMode !== "NONE") {
        const value = node.layoutMode === "VERTICAL" ? "column" : "row";
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "align-items",
    bindingKey: undefined,
    process: async (_, node?: SceneNode): Promise<ProcessedValue | null> => {
      if (node && 'layoutMode' in node && node.layoutMode && node.layoutMode !== "NONE" && 'primaryAxisAlignItems' in node) {
        const alignMap = {
          MIN: "flex-start",
          CENTER: "center",
          MAX: "flex-end",
          SPACE_BETWEEN: "space-between"
        };
        const value = alignMap[node.primaryAxisAlignItems] || "flex-start";
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "gap",
    bindingKey: "itemSpacing",
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      const gapVariable = variables.find(v => v.property === 'gap');
      if (gapVariable) {
        return {
          value: gapVariable.value,
          rawValue: gapVariable.rawValue
        };
      }

      if (node && 'itemSpacing' in node) {
        const value = `${node.itemSpacing}px`;
        return { value, rawValue: value };
      }
      return null;
    }
  },
  {
    property: "padding",
    bindingKey: undefined,
    process: async (variables: VariableToken[], node?: SceneNode): Promise<ProcessedValue | null> => {
      // Handle individual padding variables
      const top = variables.find(v => v.property === 'padding-top');
      const right = variables.find(v => v.property === 'padding-right');
      const bottom = variables.find(v => v.property === 'padding-bottom');
      const left = variables.find(v => v.property === 'padding-left');

      if (top || right || bottom || left) {
        const getValue = (v: VariableToken | undefined, fallback: string) => v ? v.value : fallback;
        const getRawValue = (v: VariableToken | undefined, fallback: string) => v ? v.rawValue : fallback;

        return {
          value: `${getValue(top, '0')} ${getValue(right, '0')} ${getValue(bottom, '0')} ${getValue(left, '0')}`,
          rawValue: `${getRawValue(top, '0')} ${getRawValue(right, '0')} ${getRawValue(bottom, '0')} ${getRawValue(left, '0')}`
        };
      }

      // Handle direct node values
      if (node && 'paddingTop' in node) {
        const topVal = `${node.paddingTop}px`;
        const rightVal = `${node.paddingRight}px`;
        const bottomVal = `${node.paddingBottom}px`;
        const leftVal = `${node.paddingLeft}px`;

        // If all sides are equal
        if (topVal === rightVal && rightVal === bottomVal && bottomVal === leftVal) {
          return { value: topVal, rawValue: topVal };
        }
        // If vertical and horizontal padding are different
        if (topVal === bottomVal && leftVal === rightVal) {
          const value = `${topVal} ${leftVal}`;
          return { value, rawValue: value };
        }
        // All sides different
        const value = `${topVal} ${rightVal} ${bottomVal} ${leftVal}`;
        return { value, rawValue: value };
      }
      return null;
    }
  }
];

// Handle direct properties
function getDirectNodeValue(node: SceneNode, property: string): string | null {
  if (node.type === "COMPONENT" || node.type === "FRAME" || node.type === "RECTANGLE" || node.type === "INSTANCE") {
    switch (property) {
      case "border-width":
        return node.strokeWeight ? `${String(node.strokeWeight)}px` : null;
      case "border-radius":
        return node.cornerRadius ? `${String(node.cornerRadius)}px` : null;
      case "gap":
        if ('layoutMode' in node && 'itemSpacing' in node) {
          return node.layoutMode && node.itemSpacing > 0 ? `${node.itemSpacing}px` : null;
        }
        return null;
      case "display":
        if ('layoutMode' in node) {
          if (!node.layoutMode) return "block";
          // Check for auto-layout properties
          const isInline = node.layoutAlign !== "STRETCH";
          return isInline ? "inline-flex" : "flex";
        }
        return null;
      case "flex-direction":
        if ('layoutMode' in node) {
          if (!node.layoutMode) return null;
          // Check for auto-layout properties
          const isInline = node.layoutAlign !== "STRETCH";
          return isInline ? "inline-flex" : "flex";
        }
        return null;
      case "align-items":
        if ('layoutMode' in node && 'primaryAxisAlignItems' in node) {
          if (!node.layoutMode) return null;
          const alignMap = {
            MIN: "flex-start",
            CENTER: "center",
            MAX: "flex-end",
            SPACE_BETWEEN: "space-between"
          };
          return alignMap[node.primaryAxisAlignItems] || "flex-start";
        }
        return null;
      case "padding":
        if ('paddingTop' in node) {
          const top = node.paddingTop;
          const right = node.paddingRight;
          const bottom = node.paddingBottom;
          const left = node.paddingLeft;

          // If all sides are equal
          if (top === right && right === bottom && bottom === left) {
            return `${top}px`;
          }
          // If vertical and horizontal padding are different
          if (top === bottom && left === right) {
            return `${top}px ${left}px`;
          }
          // All sides different
          return `${top}px ${right}px ${bottom}px ${left}px`;
        }
        return null;
      case "padding-top":
        return 'paddingTop' in node ? `${node.paddingTop}px` : null;
      case "padding-right":
        return 'paddingRight' in node ? `${node.paddingRight}px` : null;
      case "padding-bottom":
        return 'paddingBottom' in node ? `${node.paddingBottom}px` : null;
      case "padding-left":
        return 'paddingLeft' in node ? `${node.paddingLeft}px` : null;
      default:
        return null;
    }
  }
  return null;
}

function getProcessorsForNode(node: SceneNode): StyleProcessor[] {
  switch (node.type) {
    case "TEXT":
      return textNodeProcessors;
    case "FRAME":
    case "RECTANGLE":
    case "INSTANCE":
      return frameNodeProcessors;
    default:
      return [];
  }
}

// Add a helper function to determine if a property needs units
// TODO: This needs some improvement to ensure we are capturing the correct values
function shouldHaveUnits(propertyName: string, value: number): boolean {
  const unitlessProperties = ['font-weight', 'opacity'];
  const propertyLower = propertyName.toLowerCase();
  
  // Check if it's a unitless property
  if (unitlessProperties.some(prop => propertyLower.includes(prop))) {
    return false;
  }
  // Line-height special case: if > 4, probably pixels, if <= 4, probably unitless
  if (propertyLower.includes('line-height')) {
    return value > 4;
  }
  
  return true;
}

// Update getVariableFallback to use property context
async function getVariableFallback(variable: Variable | null, propertyName: string = ''): Promise<string> {
  if (!variable) return '';

  const modeId = Object.keys(variable.valuesByMode)[0];
  const value = variable.valuesByMode[modeId];

  // Handle variable aliases first
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    const aliasVariable = await figma.variables.getVariableByIdAsync(value.id);
    if (aliasVariable) {
      return getVariableFallback(aliasVariable, propertyName);
    }
  }

  switch (variable.resolvedType) {
    case "FLOAT": {
      const numValue = value as number;
      return shouldHaveUnits(propertyName, numValue) ? `${numValue}px` : String(numValue);
    }
    case "COLOR": {
      if (typeof value === 'object' && 'r' in value) {
        const color = value as RGB | RGBA;
        const opacity = 'a' in color ? color.a : 1;
        return Utils.rgbaToString(color.r, color.g, color.b, opacity);
      }
      return '#000000';
    }
    case "STRING":
      return value as string;
    default:
      return "inherit";
  }
}

function getNodePathName(node: SceneNode): string {
  const pathParts: string[] = [];
  let current: SceneNode | null = node;

  while (current && current.parent) {
    // Skip if the name is "components"
    if (current.name.toLowerCase() !== "components") {
      pathParts.push(current.name);
    }
    current = current.parent as SceneNode;
  }

  pathParts.reverse();
  const processed = pathParts.map((p) => parseVariantWithoutKey(p));
  return processed.join("_");
}

function parseVariantWithoutKey(variant: string): string {
  const [_, valueRaw] = variant.split("=");
  if (!valueRaw) {
    // if no '=' found, just sanitize as fallback
    return Utils.sanitizeSegment(variant);
  }
  return Utils.sanitizeSegment(valueRaw);
}

// Helper function to calculate gradient angle from transform matrix
function getGradientAngle(transform: Transform): number {
  // Extract the angle from the transform matrix
  const [[a, b], [c, d]] = transform;
  const angle = Math.atan2(b, a) * (180 / Math.PI);
  // Normalize angle to 0-360 range
  return (angle + 360) % 360;
}

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-styles') {
    const styles = await generateStyles(msg.format || 'scss');
    generatedScss = styles; // Store the generated SCSS
    figma.ui.postMessage({ type: 'output-styles', styles });
  } else if (msg.type === 'save-config') {
    await Github.saveUserSettings(msg.githubToken, msg.branchName);
    await Github.saveGithubConfig({
      repoPath: msg.repoPath,
      filePath: msg.filePath,
    });
    figma.ui.postMessage({ type: 'config-saved' });
  } else if (msg.type === 'load-config') {
    const [config, userSettings] = await Promise.all([
      Github.getGithubConfig(),
      Github.getUserSettings()
    ]);
    if (userSettings) {
      config.githubToken = userSettings.token;
      config.branchName = userSettings.branchName;
    }
    figma.ui.postMessage({ type: 'config-loaded', config });
  } else if (msg.type === 'create-pr') {
    try {
      const result = await Github.createGithubPR(
        msg.githubToken,
        msg.repoPath,
        msg.filePath,
        msg.branchName,
        generatedScss  // Use the stored SCSS content instead of msg.content
      );
      figma.ui.postMessage({
        type: 'pr-created',
        prUrl: result.prUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      figma.ui.postMessage({ type: 'error', message });
    }
  }
};
