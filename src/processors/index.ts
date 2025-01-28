import { StyleProcessor } from '../types/processors';
import { backgroundProcessor } from './background.processor';
import { fontProcessors } from './font.processor';
import { layoutProcessors } from './layout.processor';
import { borderProcessors } from './border.processor';
import { spacingProcessors } from './spacing.processor';

export function getProcessorsForNode(node: SceneNode): StyleProcessor[] {
  switch (node.type) {
    case "TEXT":
      return fontProcessors;
    case "FRAME":
    case "RECTANGLE":
    case "INSTANCE":
      return [
        backgroundProcessor,
        ...layoutProcessors,
        ...borderProcessors,
        ...spacingProcessors
      ];
    default:
      return [];
  }
} 