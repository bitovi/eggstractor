import { PathNode } from '../types';
import { sanitizeSegment } from './string.utils';

export function getParentSceneNodes(node: SceneNode): PathNode[] {
  const nodes: SceneNode[] = [];
  let current: SceneNode | null = node;

  while (current && current.parent) {
    // TODO: This is to skip the "Components" page that Figma adds automatically
    const nodeType = (current as { type: string }).type;
    const isComponentsPage = nodeType === 'PAGE' && current.name.toLowerCase() === 'components';
    if (!isComponentsPage) {
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
