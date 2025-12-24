/**
 * Utility functions for handling Figma layout sizing properties.
 *
 * Figma has two sets of sizing properties:
 * 1. NEW API: layoutSizingHorizontal/layoutSizingVertical (FIXED | HUG | FILL)
 *    - Works for all node types
 *    - More explicit and clear
 * 2. LEGACY API: primaryAxisSizingMode/counterAxisSizingMode (FIXED | AUTO)
 *    - Only for auto layout frames
 *    - AUTO doesn't distinguish between HUG and FILL
 *
 * These utilities prefer the new API and fall back to legacy when needed.
 */

type SizingMode = 'FIXED' | 'HUG' | 'FILL';

interface NodeWithSizing {
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  // New API (preferred)
  layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
  layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';
  // Legacy API (fallback)
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  absoluteBoundingBox?: { width: number; height: number };
}

/**
 * Get the horizontal sizing mode for a node.
 * Prefers layoutSizingHorizontal, falls back to axis-based logic.
 *
 * @param node - The Figma node to check
 * @returns The sizing mode or null if not determinable
 */
export function getHorizontalSizing(node: NodeWithSizing): SizingMode | null {
  // Prefer new API: layoutSizingHorizontal
  if (node.layoutSizingHorizontal) {
    return node.layoutSizingHorizontal;
  }

  // Fallback: Use legacy primaryAxisSizingMode/counterAxisSizingMode
  // based on layout direction
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    if (node.layoutMode === 'HORIZONTAL') {
      // Horizontal layout: width is on primary axis
      if (node.primaryAxisSizingMode === 'FIXED') {
        return 'FIXED';
      }
      // Note: AUTO could be HUG or FILL, we can't determine which
      // Return null to avoid incorrect assumptions
    } else if (node.layoutMode === 'VERTICAL') {
      // Vertical layout: width is on counter axis
      if (node.counterAxisSizingMode === 'FIXED') {
        return 'FIXED';
      }
    }
  }

  return null;
}

/**
 * Get the vertical sizing mode for a node.
 * Prefers layoutSizingVertical, falls back to axis-based logic.
 *
 * @param node - The Figma node to check
 * @returns The sizing mode or null if not determinable
 */
export function getVerticalSizing(node: NodeWithSizing): SizingMode | null {
  // Prefer new API: layoutSizingVertical
  if (node.layoutSizingVertical) {
    return node.layoutSizingVertical;
  }

  // Fallback: Use legacy primaryAxisSizingMode/counterAxisSizingMode
  // based on layout direction
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    if (node.layoutMode === 'VERTICAL') {
      // Vertical layout: height is on primary axis
      if (node.primaryAxisSizingMode === 'FIXED') {
        return 'FIXED';
      }
    } else if (node.layoutMode === 'HORIZONTAL') {
      // Horizontal layout: height is on counter axis
      if (node.counterAxisSizingMode === 'FIXED') {
        return 'FIXED';
      }
    }
  }

  return null;
}

/**
 * Determine if width should be output based on sizing mode.
 *
 * @param node - The Figma node to check
 * @returns True if width should be output
 */
export function shouldOutputWidth(node: NodeWithSizing): boolean {
  const sizing = getHorizontalSizing(node);
  // Output width for FIXED, FILL, and HUG
  // Only skip if sizing is explicitly null/undefined
  return sizing !== null;
}

/**
 * Determine if height should be output based on sizing mode.
 *
 * @param node - The Figma node to check
 * @returns True if height should be output
 */
export function shouldOutputHeight(node: NodeWithSizing): boolean {
  const sizing = getVerticalSizing(node);
  // Output height for FIXED, FILL, and HUG
  // Only skip if sizing is explicitly null/undefined
  return sizing !== null;
}

/**
 * Get the CSS value for a given width and sizing mode.
 *
 * @param width - The width value from absoluteBoundingBox
 * @param sizing - The sizing mode (FIXED | HUG | FILL)
 * @returns The CSS value string
 */
export function getWidthValue(width: number, sizing: SizingMode): string {
  switch (sizing) {
    case 'FIXED':
      return `${width}px`;
    case 'FILL':
      return '100%';
    case 'HUG':
      return 'fit-content';
    default:
      return `${width}px`;
  }
}

/**
 * Get the CSS value for a given height and sizing mode.
 *
 * @param height - The height value from absoluteBoundingBox
 * @param sizing - The sizing mode (FIXED | HUG | FILL)
 * @returns The CSS value string
 */
export function getHeightValue(height: number, sizing: SizingMode): string {
  switch (sizing) {
    case 'FIXED':
      return `${height}px`;
    case 'FILL':
      return '100%';
    case 'HUG':
      return 'fit-content';
    default:
      return `${height}px`;
  }
}
