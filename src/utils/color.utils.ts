export function rgbToHex(r: number, g: number, b: number): string {
  const rHex = Math.round(r * 255)
    .toString(16)
    .padStart(2, '0');
  const gHex = Math.round(g * 255)
    .toString(16)
    .padStart(2, '0');
  const bHex = Math.round(b * 255)
    .toString(16)
    .padStart(2, '0');
  return '#' + rHex + gHex + bHex;
}

export function rgbaToString(r: number, g: number, b: number, a: number): string {
  const rHex = Math.round(r * 255)
    .toString(16)
    .padStart(2, '0');
  const gHex = Math.round(g * 255)
    .toString(16)
    .padStart(2, '0');
  const bHex = Math.round(b * 255)
    .toString(16)
    .padStart(2, '0');
  const aHex = Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');

  return a === 1
    ? '#' + rHex + gHex + bHex
    : `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
