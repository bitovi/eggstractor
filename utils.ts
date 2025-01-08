namespace Utils {
  export function toBase64(str: string): string {
    const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const utf8str = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function (_, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      }
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
  }
  
  export function rgbToHex(r: number, g: number, b: number) {
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = Math.round(x * 255).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  }

  export function sanitizeSegment(str: string): string {
    return str
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
      .toLowerCase();
  }
  
  export function sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/\//g, "-")
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
      .toLowerCase();
  }
}