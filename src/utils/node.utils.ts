import { sanitizeSegment } from './string.utils';

interface NodePathName {
  type: SceneNode['type'];
  name: string;
}

export function getNodePathNames(node: SceneNode): NodePathName[] {
  const pathParts: NodePathName[] = [];
  let current: SceneNode | null = node;

  while (current && current.parent) {
    if (current.name.toLowerCase() !== 'components') {
      pathParts.unshift({
        name: current.name,
        type: current.type,
      });
    }
    current = current.parent as SceneNode;
  }
  // TODO: this is a mess
  return pathParts.map((p) => ({
    name: parseVariantWithoutKey(p.name),
    type: p.type,
  }));

  // const processedWithoutVariants = pathParts.map((p) => parseVariantWithoutKey(p));
  // return [processed.join('_'), processedWithoutVariants.join('_')];
}

// export function parseVariantWithoutKey(variant: string): string {
//   const [_, valueRaw] = variant.split('=');
//   if (!valueRaw) {
//     return sanitizeSegment(variant);
//   }
//   return sanitizeSegment(valueRaw);
// }

export function parseVariantWithoutKey(variant: string): string {
  // TODO: create using componentSet token and component token?
  const segment = variant.split(', ').map(part => {
    const [_, valueRaw] = part.split('=')

    if (valueRaw) {
      return valueRaw;
    }

    return part;
  }).join('__and__');

  return sanitizeSegment(segment);
}
