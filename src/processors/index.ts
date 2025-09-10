import { StyleProcessor } from '../types/processors';
import { backgroundProcessors } from './background.processor';
import { fontProcessors } from './font.processor';
import { layoutProcessors } from './layout.processor';
import { borderProcessors } from './border.processor';
import { spacingProcessors } from './spacing.processor';

const TEXT_PROCESSORS = fontProcessors;
const LAYOUT_PROCESSORS = [
  ...backgroundProcessors,
  ...layoutProcessors,
  ...borderProcessors,
  // spacingProcessors depend on borderProcessors being run first
  ...spacingProcessors,
];

export function getProcessorsForNode(node: SceneNode): StyleProcessor[] {
  switch (node.type) {
    case 'TEXT':
      return TEXT_PROCESSORS;
    case 'FRAME':
    case 'RECTANGLE':
    case 'INSTANCE':
    case 'ELLIPSE':
    case 'COMPONENT':
    case 'VECTOR':
    case 'STAR':
    case 'POLYGON':
      return LAYOUT_PROCESSORS;
    default:
      return [];
  }
}
