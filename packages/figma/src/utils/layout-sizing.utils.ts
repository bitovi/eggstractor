/**
 * Utility functions for handling Figma layout sizing properties.
 *
 * Figma has two sets of sizing properties:
 * 1. NEW API (Recommended): layoutSizingHorizontal/layoutSizingVertical (FIXED | HUG | FILL)
 *    - Available on all node types (frames, rectangles, text, vectors, etc.)
 *    - More explicit: distinguishes between HUG (fit content) and FILL (fill container)
 *    - Maps directly to "Horizontal sizing" and "Vertical sizing" dropdowns in Figma UI
 *
 * 2. LEGACY API (Deprecated): primaryAxisSizingMode/counterAxisSizingMode (FIXED | AUTO)
 *    - Only available on auto-layout frames
 *    - Less expressive: AUTO doesn't distinguish between HUG and FILL
 *    - Used in older Figma files exported before the new API was introduced
 *
 * These utilities prefer the new API and fall back to legacy when needed for backwards compatibility.
 * When legacy API is used, a warning is logged to encourage updating the design file.
 */

import type { LayoutNode, SizingMode } from '../processors/layout.processor';

// Track if we've already warned about legacy API usage via console to avoid spam
let hasWarnedAboutLegacyApiToConsole = false;

/**
 * Generate a warning message when legacy API is used.
 *
 * @param node - The node using legacy API
 * @param axis - Which axis is affected
 * @returns The warning message
 * @internal
 */
function createLegacyApiWarningMessage(node: LayoutNode, axis: 'horizontal' | 'vertical'): string {
  const nodeInfo = node.name ? `"${node.name}"` : node.id ? `(${node.id})` : 'unknown node';
  return (
    `Using deprecated layout sizing API for ${axis} sizing on ${nodeInfo}. ` +
    `This design file was exported with older Figma layout properties (primaryAxisSizingMode/counterAxisSizingMode). ` +
    `For more accurate layout output (including FILL and HUG sizing modes), please: ` +
    `1) Open your design file in Figma, ` +
    `2) Re-export it (Figma will automatically include the new layoutSizingHorizontal/layoutSizingVertical properties), ` +
    `3) Run Eggstractor again.`
  );
}

/**
 * Log a warning to console when legacy API is used.
 * Only logs once per session to avoid cluttering the console.
 *
 * @param node - The node using legacy API
 * @param axis - Which axis is affected
 * @internal
 */
function warnAboutLegacyApiToConsole(node: LayoutNode, axis: 'horizontal' | 'vertical'): void {
  if (hasWarnedAboutLegacyApiToConsole) return;

  const nodeInfo = node.name ? `"${node.name}"` : node.id ? `(${node.id})` : 'unknown node';
  console.warn(
    `⚠️  Eggstractor: Using deprecated layout sizing API for ${axis} sizing on ${nodeInfo}.\n` +
      `   This design file was exported with older Figma layout properties (primaryAxisSizingMode/counterAxisSizingMode).\n` +
      `   For more accurate layout output (including FILL and HUG sizing modes), please:\n` +
      `   1. Open your design file in Figma\n` +
      `   2. Re-export it (Figma will automatically include the new layoutSizingHorizontal/layoutSizingVertical properties)\n` +
      `   3. Run Eggstractor again\n` +
      `   This warning will only be shown once per session.`,
  );

  hasWarnedAboutLegacyApiToConsole = true;
}

/**
 * Add a warning about legacy API usage.
 * Can optionally push to a warnings array for collection in processors.
 *
 * @param node - The node using legacy API
 * @param axis - Which axis is affected
 * @param warnings - Optional array to push warnings to (for processors)
 * @internal
 */
function warnAboutLegacyApi(
  node: LayoutNode,
  axis: 'horizontal' | 'vertical',
  warnings?: string[],
): void {
  const message = createLegacyApiWarningMessage(node, axis);

  // If warnings array provided, push to it (for processor collection)
  if (warnings) {
    warnings.push(message);
  }

  // Also log to console (once per session)
  warnAboutLegacyApiToConsole(node, axis);
}

/**
 * Get the horizontal sizing mode for a node.
 * Prefers the new layoutSizingHorizontal API, falls back to legacy axis-based logic.
 *
 * @param node - The Figma node to check
 * @param warnings - Optional array to collect warnings (for processors)
 * @returns The sizing mode or null if not determinable
 *
 * @remarks
 * When falling back to legacy API (primaryAxisSizingMode/counterAxisSizingMode),
 * a warning is logged to console and optionally added to the warnings array if provided.
 */
export function getHorizontalSizing(node: LayoutNode, warnings?: string[]): SizingMode | null {
  // Prefer new API: layoutSizingHorizontal
  if ('layoutSizingHorizontal' in node && node.layoutSizingHorizontal) {
    return node.layoutSizingHorizontal;
  }

  // Fallback to legacy API with deprecation warning
  return getHorizontalSizingLegacy(node, warnings);
}

/**
 * Get the vertical sizing mode for a node.
 * Prefers the new layoutSizingVertical API, falls back to legacy axis-based logic.
 *
 * @param node - The Figma node to check
 * @param warnings - Optional array to collect warnings (for processors)
 * @returns The sizing mode or null if not determinable
 *
 * @remarks
 * When falling back to legacy API (primaryAxisSizingMode/counterAxisSizingMode),
 * a warning is logged to console and optionally added to the warnings array if provided.
 */
export function getVerticalSizing(node: LayoutNode, warnings?: string[]): SizingMode | null {
  // Prefer new API: layoutSizingVertical
  if ('layoutSizingVertical' in node && node.layoutSizingVertical) {
    return node.layoutSizingVertical;
  }

  // Fallback to legacy API with deprecation warning
  return getVerticalSizingLegacy(node, warnings);
}

/**
 * @deprecated Use layoutSizingHorizontal API instead. This fallback is maintained for
 * backwards compatibility with older Figma exports.
 *
 * Get horizontal sizing from legacy primaryAxisSizingMode/counterAxisSizingMode.
 * Only works for auto-layout frames and cannot distinguish between HUG and FILL.
 *
 * @param node - The Figma node to check
 * @param warnings - Optional array to collect warnings
 * @returns The sizing mode or null if not determinable
 * @internal
 */
function getHorizontalSizingLegacy(node: LayoutNode, warnings?: string[]): SizingMode | null {
  // Legacy API only works on auto-layout frames
  if (!('layoutMode' in node) || !node.layoutMode || node.layoutMode === 'NONE') {
    return null;
  }

  warnAboutLegacyApi(node, 'horizontal', warnings);

  if (node.layoutMode === 'HORIZONTAL') {
    // Horizontal layout: width is on primary axis
    if ('primaryAxisSizingMode' in node && node.primaryAxisSizingMode === 'FIXED') {
      return 'FIXED';
    }
    // Note: AUTO could be HUG or FILL, we can't determine which
    // Return null to use default fixed sizing
  } else if (node.layoutMode === 'VERTICAL') {
    // Vertical layout: width is on counter axis
    if ('counterAxisSizingMode' in node && node.counterAxisSizingMode === 'FIXED') {
      return 'FIXED';
    }
  }

  return null;
}

/**
 * @deprecated Use layoutSizingVertical API instead. This fallback is maintained for
 * backwards compatibility with older Figma exports.
 *
 * Get vertical sizing from legacy primaryAxisSizingMode/counterAxisSizingMode.
 * Only works for auto-layout frames and cannot distinguish between HUG and FILL.
 *
 * @param node - The Figma node to check
 * @param warnings - Optional array to collect warnings
 * @returns The sizing mode or null if not determinable
 * @internal
 */
function getVerticalSizingLegacy(node: LayoutNode, warnings?: string[]): SizingMode | null {
  // Legacy API only works on auto-layout frames
  if (!('layoutMode' in node) || !node.layoutMode || node.layoutMode === 'NONE') {
    return null;
  }

  warnAboutLegacyApi(node, 'vertical', warnings);

  if (node.layoutMode === 'VERTICAL') {
    // Vertical layout: height is on primary axis
    if ('primaryAxisSizingMode' in node && node.primaryAxisSizingMode === 'FIXED') {
      return 'FIXED';
    }
  } else if (node.layoutMode === 'HORIZONTAL') {
    // Horizontal layout: height is on counter axis
    if ('counterAxisSizingMode' in node && node.counterAxisSizingMode === 'FIXED') {
      return 'FIXED';
    }
  }

  return null;
}

/**
 * Determine if width should be output based on sizing mode.
 *
 * @param node - The Figma node to check
 * @param warnings - Optional array to collect warnings
 * @returns True if width should be output
 */
export function shouldOutputWidth(node: LayoutNode, warnings?: string[]): boolean {
  const sizing = getHorizontalSizing(node, warnings);
  // Output width for FIXED, FILL, and HUG
  // Only skip if sizing is explicitly null/undefined
  return sizing !== null;
}

/**
 * Determine if height should be output based on sizing mode.
 *
 * @param node - The Figma node to check
 * @param warnings - Optional array to collect warnings
 * @returns True if height should be output
 */
export function shouldOutputHeight(node: LayoutNode, warnings?: string[]): boolean {
  const sizing = getVerticalSizing(node, warnings);
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
