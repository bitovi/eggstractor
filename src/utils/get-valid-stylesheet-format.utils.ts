import { StylesheetFormat } from "../types";

/**
 * Returns format if valid. Defaults to 'scss' if invalid or not provided.
 */
export const getValidStylesheetFormat = (format: unknown): StylesheetFormat => {
  if (format === 'scss' || format === 'css' || format === 'tailwind-scss' || format === 'tailwind-v4') {
    return format;
  }

  return 'scss'; // Default to SCSS if format is invalid
}
