export default {
  toBase64(str: string): string {
    const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const utf8str = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))
    );
    let i = 0;
    let result = '';
    while (i < utf8str.length) {
      const char1 = utf8str.charCodeAt(i++);
      const char2 = i < utf8str.length ? utf8str.charCodeAt(i++) : NaN;
      const char3 = i < utf8str.length ? utf8str.charCodeAt(i++) : NaN;
      const enc1 = char1 >> 2;
      const enc2 = ((char1 & 3) << 4) | (char2 >> 4);
      const enc3 = ((char2 & 15) << 2) | (char3 >> 6);
      const enc4 = char3 & 63;
      result += base64chars[enc1] + base64chars[enc2] +
        (isNaN(char2) ? '=' : base64chars[enc3]) +
        (isNaN(char3) ? '=' : base64chars[enc4]);
    }
    return result;
  },
  sanitizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  },
  sanitizeSegment(segment: string): string {
    return segment.toLowerCase().replace(/[^a-z0-9]/g, '-');
  },
  rgbToHex(r: number, g: number, b: number): string {
    const rHex = Math.round(r * 255).toString(16).padStart(2, '0');
    const gHex = Math.round(g * 255).toString(16).padStart(2, '0');
    const bHex = Math.round(b * 255).toString(16).padStart(2, '0');
    return '#' + rHex + gHex + bHex;
  },
  rgbaToString(r: number, g: number, b: number, a: number): string {
    const rHex = Math.round(r * 255).toString(16).padStart(2, '0');
    const gHex = Math.round(g * 255).toString(16).padStart(2, '0');
    const bHex = Math.round(b * 255).toString(16).padStart(2, '0');
    const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
    
    return a === 1 ? 
      '#' + rHex + gHex + bHex : 
      '#' + rHex + gHex + bHex + aHex;
  },
  groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
    return arr.reduce((groups, item) => {
      const k = key(item);
      if (!groups[k]) groups[k] = [];
      groups[k].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
};