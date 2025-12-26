import { StyleProcessor, VariableToken, ProcessedValue } from '../types';
import {
  getHorizontalSizing,
  getVerticalSizing,
  getWidthValue,
  getHeightValue,
} from '../utils/layout-sizing.utils';

export type SizingMode = 'FIXED' | 'HUG' | 'FILL';

/**
 * Base properties that exist on nodes with layout capabilities
 */
interface BaseLayoutNode {
  id?: string;
  name?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  absoluteBoundingBox?: { width: number; height: number };
  type?: string;
  textAutoResize?: 'NONE' | 'WIDTH' | 'HEIGHT' | 'WIDTH_AND_HEIGHT';
}

/**
 * Node with auto-layout enabled (layoutMode is HORIZONTAL or VERTICAL)
 */
interface AutoLayoutNode extends BaseLayoutNode {
  layoutMode: 'HORIZONTAL' | 'VERTICAL';
  primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  itemSpacing: number;
  layoutWrap?: 'WRAP' | 'NO_WRAP'; // Optional - not all frames support wrapping
}

/**
 * Node without auto-layout (layoutMode is NONE or doesn't exist)
 */
interface NonAutoLayoutNode extends BaseLayoutNode {
  layoutMode?: 'NONE';
}

/**
 * Node with modern sizing API (layoutSizingHorizontal/Vertical)
 */
interface ModernSizingNode extends BaseLayoutNode {
  layoutSizingHorizontal: SizingMode;
  layoutSizingVertical: SizingMode;
}

/**
 * Node with legacy sizing API (primaryAxisSizingMode/counterAxisSizingMode)
 * @deprecated Use ModernSizingNode instead
 */
interface LegacySizingNode extends BaseLayoutNode {
  layoutMode: 'HORIZONTAL' | 'VERTICAL'; // Required for legacy API
  /**
   * @deprecated Use layoutSizingHorizontal/layoutSizingVertical instead
   */
  primaryAxisSizingMode: 'FIXED' | 'AUTO';
  /**
   * @deprecated Use layoutSizingHorizontal/layoutSizingVertical instead
   */
  counterAxisSizingMode: 'FIXED' | 'AUTO';
}

/**
 * Union type representing all possible layout node configurations
 */
export type LayoutNode = AutoLayoutNode | NonAutoLayoutNode | ModernSizingNode | LegacySizingNode;

export const layoutProcessors: StyleProcessor[] = [
  {
    property: 'display',
    bindingKey: undefined,
    process: async (_, node: SceneNode): Promise<ProcessedValue | null> => {
      const layoutNode = node as LayoutNode;
      if ('layoutMode' in layoutNode && layoutNode.layoutMode !== 'NONE') {
        const value = 'flex';
        return { value, rawValue: value };
      }

      return null;
    },
  },
  {
    property: 'flex-direction',
    bindingKey: undefined,
    process: async (_, node: SceneNode): Promise<ProcessedValue | null> => {
      const layoutNode = node as LayoutNode;
      if ('layoutMode' in layoutNode && layoutNode.layoutMode !== 'NONE') {
        const value = layoutNode.layoutMode === 'VERTICAL' ? 'column' : 'row';
        return { value, rawValue: value };
      }
      return null;
    },
  },
  {
    property: 'justify-content',
    bindingKey: undefined,
    process: async (_, node: SceneNode): Promise<ProcessedValue | null> => {
      const layoutNode = node as LayoutNode;
      if (
        'layoutMode' in layoutNode &&
        layoutNode.layoutMode !== 'NONE' &&
        'primaryAxisAlignItems' in layoutNode &&
        layoutNode.primaryAxisAlignItems !== 'MIN'
      ) {
        const alignMap = {
          CENTER: 'center',
          MAX: 'flex-end',
          SPACE_BETWEEN: 'space-between',
        } as const;
        const value = alignMap[layoutNode.primaryAxisAlignItems];
        return { value, rawValue: value };
      }
      return null;
    },
  },
  {
    property: 'align-items',
    bindingKey: undefined,
    process: async (_, node: SceneNode): Promise<ProcessedValue | null> => {
      const layoutNode = node as LayoutNode;
      if (
        'layoutMode' in layoutNode &&
        layoutNode.layoutMode !== 'NONE' &&
        'counterAxisAlignItems' in layoutNode
      ) {
        const alignMap = {
          MIN: 'flex-start',
          CENTER: 'center',
          MAX: 'flex-end',
          BASELINE: 'baseline',
        } as const;
        const value = alignMap[layoutNode.counterAxisAlignItems];
        return { value, rawValue: value };
      }
      return null;
    },
  },
  {
    property: 'gap',
    bindingKey: 'itemSpacing',
    process: async (variableTokenMapByProperty, node): Promise<ProcessedValue | null> => {
      const gapVariable = variableTokenMapByProperty.get('gap');
      if (gapVariable) {
        return {
          value: gapVariable.value,
          rawValue: gapVariable.rawValue,
          valueType: gapVariable.valueType,
        };
      }

      const layoutNode = node as LayoutNode;
      if ('itemSpacing' in layoutNode && layoutNode.itemSpacing > 0) {
        const value = `${layoutNode.itemSpacing}px`;
        return { value, rawValue: value, valueType: 'px' };
      }
      return null;
    },
  },
  {
    property: 'min-width',
    bindingKey: 'minWidth',
    process: async (
      variableTokenMapByProperty: Map<string, VariableToken>,
      node: SceneNode,
    ): Promise<ProcessedValue | null> => {
      const minWidthVariable = variableTokenMapByProperty.get('minWidth');
      if (minWidthVariable) {
        return {
          value: `${minWidthVariable.value}`,
          rawValue: `${minWidthVariable.rawValue}`,
          valueType: 'px',
        };
      }

      const layoutNode = node as LayoutNode;
      if ('minWidth' in layoutNode && layoutNode.minWidth) {
        return {
          value: `${layoutNode.minWidth}px`,
          rawValue: `${layoutNode.minWidth}px`,
          valueType: 'px',
        };
      }
      return null;
    },
  },
  {
    property: 'max-width',
    bindingKey: 'maxWidth',
    process: async (
      variableTokenMapByProperty: Map<string, VariableToken>,
      node: SceneNode,
    ): Promise<ProcessedValue | null> => {
      const maxWidthVariable = variableTokenMapByProperty.get('maxWidth');
      if (maxWidthVariable) {
        return {
          value: `${maxWidthVariable.value}`,
          rawValue: `${maxWidthVariable.rawValue}`,
          valueType: 'px',
        };
      }

      const layoutNode = node as LayoutNode;
      if ('maxWidth' in layoutNode && layoutNode.maxWidth) {
        return {
          value: `${layoutNode.maxWidth}px`,
          rawValue: `${layoutNode.maxWidth}px`,
          valueType: 'px',
        };
      }
      return null;
    },
  },
  {
    property: 'min-height',
    bindingKey: 'minHeight',
    process: async (
      variableTokenMapByProperty: Map<string, VariableToken>,
      node: SceneNode,
    ): Promise<ProcessedValue | null> => {
      const minHeightVariable = variableTokenMapByProperty.get('minHeight');
      if (minHeightVariable) {
        return {
          value: `${minHeightVariable.value}`,
          rawValue: `${minHeightVariable.rawValue}`,
          valueType: 'px',
        };
      }

      const layoutNode = node as LayoutNode;
      if ('minHeight' in layoutNode && layoutNode.minHeight) {
        return {
          value: `${layoutNode.minHeight}px`,
          rawValue: `${layoutNode.minHeight}px`,
          valueType: 'px',
        };
      }
      return null;
    },
  },
  {
    property: 'max-height',
    bindingKey: 'maxHeight',
    process: async (
      variableTokenMapByProperty: Map<string, VariableToken>,
      node: SceneNode,
    ): Promise<ProcessedValue | null> => {
      const maxHeightVariable = variableTokenMapByProperty.get('maxHeight');
      if (maxHeightVariable) {
        return {
          value: `${maxHeightVariable.value}`,
          rawValue: `${maxHeightVariable.rawValue}`,
          valueType: 'px',
        };
      }

      const layoutNode = node as LayoutNode;
      if ('maxHeight' in layoutNode && layoutNode.maxHeight) {
        return {
          value: `${layoutNode.maxHeight}px`,
          rawValue: `${layoutNode.maxHeight}px`,
          valueType: 'px',
        };
      }
      return null;
    },
  },
  {
    property: 'width',
    bindingKey: undefined,
    process: async (_, node: SceneNode): Promise<ProcessedValue | null> => {
      if (!('absoluteBoundingBox' in node)) return null;

      const layoutNode = node as LayoutNode;
      const warningsSet = new Set<string>();

      // Handle text nodes - they have special sizing rules
      if ('type' in layoutNode && layoutNode.type === 'TEXT') {
        // Only output width if text doesn't auto-resize width
        if (
          'textAutoResize' in layoutNode &&
          (layoutNode.textAutoResize === 'NONE' || layoutNode.textAutoResize === 'HEIGHT')
        ) {
          return {
            value: `${layoutNode.absoluteBoundingBox?.width}px`,
            rawValue: `${layoutNode.absoluteBoundingBox?.width}px`,
            valueType: 'px',
          };
        }
        return null;
      }

      // Collect warnings in an array, then add to Set for deduplication
      const warningsArray: string[] = [];

      // Get horizontal sizing mode (prefers layoutSizingHorizontal, falls back to legacy API)
      const sizing = getHorizontalSizing(layoutNode, warningsArray);

      // Add any warnings to the set
      warningsArray.forEach((w) => warningsSet.add(w));

      if (sizing) {
        const width = layoutNode.absoluteBoundingBox?.width;
        if (width !== undefined) {
          const value = getWidthValue(width, sizing);
          return {
            value,
            rawValue: value,
            valueType: sizing === 'FIXED' ? 'px' : undefined,
            warnings: warningsSet.size > 0 ? Array.from(warningsSet) : undefined,
          };
        }
      }

      return null;
    },
  },
  {
    property: 'height',
    bindingKey: undefined,
    process: async (_, node: SceneNode): Promise<ProcessedValue | null> => {
      if (!('absoluteBoundingBox' in node)) return null;

      const layoutNode = node as LayoutNode;
      const warningsSet = new Set<string>();

      // Handle text nodes - they have special sizing rules
      // Height is usually determined by content
      if ('type' in layoutNode && layoutNode.type === 'TEXT') {
        // Only output height if text doesn't auto-resize height
        if (
          'textAutoResize' in layoutNode &&
          (layoutNode.textAutoResize === 'NONE' || layoutNode.textAutoResize === 'WIDTH_AND_HEIGHT')
        ) {
          return {
            value: `${layoutNode.absoluteBoundingBox?.height}px`,
            rawValue: `${layoutNode.absoluteBoundingBox?.height}px`,
            valueType: 'px',
          };
        }
        return null;
      }

      // Collect warnings in an array, then add to Set for deduplication
      const warningsArray: string[] = [];

      // Get vertical sizing mode (prefers layoutSizingVertical, falls back to legacy API)
      const sizing = getVerticalSizing(layoutNode, warningsArray);

      // Add any warnings to the set
      warningsArray.forEach((w) => warningsSet.add(w));

      if (sizing) {
        const height = layoutNode.absoluteBoundingBox?.height;
        if (height !== undefined) {
          const value = getHeightValue(height, sizing);
          return {
            value,
            rawValue: value,
            valueType: sizing === 'FIXED' ? 'px' : undefined,
            warnings: warningsSet.size > 0 ? Array.from(warningsSet) : undefined,
          };
        }
      }

      return null;
    },
  },
  {
    property: 'flex-wrap',
    bindingKey: undefined,
    process: async (_, node: SceneNode): Promise<ProcessedValue | null> => {
      const layoutNode = node as LayoutNode;
      if (
        'layoutMode' in layoutNode &&
        layoutNode.layoutMode !== 'NONE' &&
        'layoutWrap' in layoutNode
      ) {
        const value = layoutNode.layoutWrap === 'WRAP' ? 'wrap' : '';
        return { value, rawValue: value };
      }
      return null;
    },
  },
];
