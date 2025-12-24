import { StyleProcessor, VariableToken, ProcessedValue } from '../types';
import {
  getHorizontalSizing,
  getVerticalSizing,
  getWidthValue,
  getHeightValue,
} from '../utils/layout-sizing.utils';

interface NodeWithLayout {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  layoutAlign?: string;
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  // Legacy auto layout sizing properties (only for auto layout frames)
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  // New sizing properties (available for all node types, more explicit)
  layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
  layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';
  absoluteBoundingBox?: { width: number; height: number };
  textAutoResize?: 'NONE' | 'WIDTH' | 'HEIGHT' | 'WIDTH_AND_HEIGHT';
  type?: string;
  layoutWrap?: 'WRAP' | 'NO_WRAP';
}

function hasLayout(node: SceneNode): node is SceneNode & NodeWithLayout {
  return 'layoutMode' in node || 'absoluteBoundingBox' in node;
}

export const layoutProcessors: StyleProcessor[] = [
  {
    property: 'display',
    bindingKey: undefined,
    process: async (_, node: SceneNode): Promise<ProcessedValue | null> => {
      if ('layoutMode' in node && node.layoutMode !== 'NONE') {
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
      if ('layoutMode' in node && node.layoutMode !== 'NONE') {
        const value = node.layoutMode === 'VERTICAL' ? 'column' : 'row';
        return { value, rawValue: value };
      }
      return null;
    },
  },
  {
    property: 'justify-content',
    bindingKey: undefined,
    process: async (_, node: SceneNode): Promise<ProcessedValue | null> => {
      if (
        'layoutMode' in node &&
        node.layoutMode !== 'NONE' &&
        'primaryAxisAlignItems' in node &&
        node.primaryAxisAlignItems !== 'MIN'
      ) {
        const alignMap = {
          CENTER: 'center',
          MAX: 'flex-end',
          SPACE_BETWEEN: 'space-between',
        };
        const value = alignMap[node.primaryAxisAlignItems] || 'flex-start';
        return { value, rawValue: value };
      }
      return null;
    },
  },
  {
    property: 'align-items',
    bindingKey: undefined,
    process: async (_, node: SceneNode): Promise<ProcessedValue | null> => {
      if ('layoutMode' in node && node.layoutMode !== 'NONE' && 'counterAxisAlignItems' in node) {
        const alignMap = {
          MIN: 'flex-start',
          CENTER: 'center',
          MAX: 'flex-end',
          BASELINE: 'baseline',
        };
        const value = alignMap[node.counterAxisAlignItems];
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

      if ('itemSpacing' in node && node.itemSpacing > 0) {
        const value = `${node.itemSpacing}px`;
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

      if (hasLayout(node) && node.minWidth) {
        return {
          value: `${node.minWidth}px`,
          rawValue: `${node.minWidth}px`,
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

      if (hasLayout(node) && node.maxWidth) {
        return {
          value: `${node.maxWidth}px`,
          rawValue: `${node.maxWidth}px`,
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

      if (hasLayout(node) && node.minHeight) {
        return {
          value: `${node.minHeight}px`,
          rawValue: `${node.minHeight}px`,
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

      if (hasLayout(node) && node.maxHeight) {
        return {
          value: `${node.maxHeight}px`,
          rawValue: `${node.maxHeight}px`,
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
      if (!hasLayout(node)) return null;

      // Handle text nodes - they have special sizing rules
      if (node.type === 'TEXT') {
        // Only output width if text doesn't auto-resize width
        if (node.textAutoResize === 'NONE' || node.textAutoResize === 'HEIGHT') {
          return {
            value: `${node.absoluteBoundingBox?.width}px`,
            rawValue: `${node.absoluteBoundingBox?.width}px`,
            valueType: 'px',
          };
        }
        return null;
      }

      // Get horizontal sizing mode (prefers layoutSizingHorizontal, falls back to legacy API)
      const sizing = getHorizontalSizing(node);

      if (sizing) {
        const width = node.absoluteBoundingBox?.width;
        if (width !== undefined) {
          const value = getWidthValue(width, sizing);
          return {
            value,
            rawValue: value,
            valueType: sizing === 'FIXED' ? 'px' : undefined,
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
      if (!hasLayout(node)) return null;

      // Handle text nodes - they have special sizing rules
      // Height is usually determined by content
      if (node.type === 'TEXT') {
        // Only output height if text doesn't auto-resize height
        if (node.textAutoResize === 'NONE' || node.textAutoResize === 'WIDTH_AND_HEIGHT') {
          return {
            value: `${node.absoluteBoundingBox?.height}px`,
            rawValue: `${node.absoluteBoundingBox?.height}px`,
            valueType: 'px',
          };
        }
        return null;
      }

      // Get vertical sizing mode (prefers layoutSizingVertical, falls back to legacy API)
      const sizing = getVerticalSizing(node);

      if (sizing) {
        const height = node.absoluteBoundingBox?.height;
        if (height !== undefined) {
          const value = getHeightValue(height, sizing);
          return {
            value,
            rawValue: value,
            valueType: sizing === 'FIXED' ? 'px' : undefined,
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
      if ('layoutMode' in node && node.layoutMode !== 'NONE' && 'layoutWrap' in node) {
        const value = node.layoutWrap === 'WRAP' ? 'wrap' : '';
        return { value, rawValue: value };
      }
      return null;
    },
  },
];
