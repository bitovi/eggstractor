import { PathNode } from '../types';
import { sanitizeSegment } from './string.utils';

export function getParentSceneNodes(node: SceneNode): PathNode[] {
  const nodes: SceneNode[] = [];
  let current: SceneNode | null = node;

  while (current && current.parent) {
    // TODO: This is to skip the "Components" page that Figma adds automatically
    // This needs to be improved since it can be renamed
    if (current.name.toLowerCase() !== 'components') {
      nodes.unshift(current);
    }
    // TODO This doesn't properly verify that it's a SceneNode
    // we should stick to BaseNode | (BaseNode & ChildrenMixin)
    current = current.parent as SceneNode;
  }

  return nodes.map((node) => ({
    name: sanitizeSegment(node.name),
    type: node.type,
  }));
}
