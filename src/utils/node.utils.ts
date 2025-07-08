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

  return pathParts.map((p) => ({
    name: parseVariantWithoutKey(p.name),
    type: p.type,
  }));
}

export function parseVariantWithoutKey(variant: string): string {
  // TODO: create using componentSet token and component token instead?
  const segment = variant.split(', ').map(part => {
    const [_, valueRaw] = part.split('=')

    if (valueRaw) {
      return valueRaw;
    }

    return part;
  }).join('__and__');

  return sanitizeSegment(segment);
}
