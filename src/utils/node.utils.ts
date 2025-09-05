import { PathNode } from '../types';
import { sanitizeSegment } from './string.utils';

export function getParentSceneNodes(node: SceneNode): PathNode[] {
  const nodes: SceneNode[] = [];
  let current: SceneNode | null = node;

  while (current && current.parent) {
    // TODO: remove this check
    // Seems like a temporary fix to something very specific at some point
    if (current.name.toLowerCase() !== 'components') {
      nodes.unshift(current);
    }
    current = current.parent as SceneNode;
  }

  return nodes.map((node) => ({
    name: sanitizeSegment(node.name),
    type: node.type
  }));
}
