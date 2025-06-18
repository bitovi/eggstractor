import { sanitizeSegment } from './string.utils';

export function getNodePathName(node: SceneNode): string {
  const pathParts: string[] = [];
  let current: SceneNode | null = node;

  while (current && current.parent) {
    if (current.name.toLowerCase() !== 'components') {
      pathParts.push(current.name);
    }
    current = current.parent as SceneNode;
  }

  pathParts.reverse();
  const processed = pathParts.map((p) => parseVariantWithoutKey(p));
  return processed.join('_');
}

export function parseVariantWithoutKey(variant: string): string {
  const segment = variant.split(', ').map(part => {
    const [_, valueRaw] = part.split('=')

    if (valueRaw) {
      return valueRaw;
    }

    return part;
  }).join('__and__');

  const [_, valueRaw] = variant.split('=');

  // const [_, valueRaw] = part.split('=')
  //
  // if (valueRaw) {
  //   return sanitizeSegment(valueRaw);
  // }
  //
  // return sanitizeSegment(segment);

  if (valueRaw) {
    console.log(`[${valueRaw}]`, variant);

    console.log(`[${valueRaw}]`, 'new', segment);
    console.log(`[${valueRaw}]`, 'new -> ', sanitizeSegment(segment));

    console.log(`[${valueRaw}]`, 'old', valueRaw ?? variant);
    console.log(`[${valueRaw}]`, 'old ->', sanitizeSegment(valueRaw ?? variant));
  }

  return sanitizeSegment(segment);
}
