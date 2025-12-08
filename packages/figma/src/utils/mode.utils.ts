/**
 * Utilities for handling Figma variable modes (themes)
 */

import { sanitizeName } from './string.utils';

/**
 * Information about a Figma variable mode (theme)
 */
export interface ModeInfo {
  /** Mode ID from Figma (e.g., '1:0', '1:1') */
  modeId: string;
  /** Human-readable mode name (e.g., 'Light', 'Dark', 'Mode 1') */
  modeName: string;
  /** Sanitized mode name safe for CSS selectors (e.g., 'light', 'dark') */
  sanitizedName: string;
}

/**
 * Extract mode information from a VariableCollection
 * @param collection - Figma VariableCollection
 * @returns Array of ModeInfo objects
 */
export function getModesFromCollection(collection: VariableCollection): ModeInfo[] {
  // Safety check for test mocks or collections without modes
  if (!collection.modes || collection.modes.length === 0) {
    return [];
  }

  return collection.modes.map((mode) => ({
    modeId: mode.modeId,
    modeName: mode.name,
    sanitizedName: sanitizeName(mode.name).toLowerCase(),
  }));
}

/**
 * Get the default mode (first mode) from a collection
 * @param collection - Figma VariableCollection
 * @returns ModeInfo for the default mode
 */
export function getDefaultMode(collection: VariableCollection): ModeInfo {
  const modes = getModesFromCollection(collection);
  return modes[0];
}

/**
 * Determine if a collection has multiple modes (themes)
 * @param collection - Figma VariableCollection
 * @returns true if the collection has more than one mode
 */
export function hasMultipleModes(collection: VariableCollection): boolean {
  return collection.modes.length > 1;
}

/**
 * Get all mode IDs from a collection
 * @param collection - Figma VariableCollection
 * @returns Array of mode IDs
 */
export function getModeIds(collection: VariableCollection): string[] {
  return collection.modes.map((mode) => mode.modeId);
}

/**
 * Find mode info by mode ID
 * @param collection - Figma VariableCollection
 * @param modeId - Mode ID to find
 * @returns ModeInfo if found, undefined otherwise
 */
export function findModeById(collection: VariableCollection, modeId: string): ModeInfo | undefined {
  const modes = getModesFromCollection(collection);
  return modes.find((mode) => mode.modeId === modeId);
}

/**
 * Normalize mode names for use in CSS selectors
 * Simply sanitizes the name (removes spaces, special chars) and converts to lowercase
 * We don't try to map to standard names like 'light'/'dark' - users can name their modes however they want
 * @param modeName - Original mode name from Figma
 * @returns Normalized theme name safe for CSS selectors
 */
export function normalizeModeName(modeName: string): string {
  // Sanitize and convert to lowercase for CSS selector compatibility
  return sanitizeName(modeName).toLowerCase();
}
