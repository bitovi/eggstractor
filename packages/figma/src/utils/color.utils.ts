/**
 * Converts RGBA color components to a hex string or rgba() string.
 */
export function rgbaToString(
  r: number,
  g: number,
  b: number,
  a: number,
): string {
  const rHex = Math.round(r * 255)
    .toString(16)
    .padStart(2, '0');
  const gHex = Math.round(g * 255)
    .toString(16)
    .padStart(2, '0');
  const bHex = Math.round(b * 255)
    .toString(16)
    .padStart(2, '0');

  return a === 1
    ? '#' + rHex + gHex + bHex
    : `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
