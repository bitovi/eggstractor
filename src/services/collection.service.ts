import { TokenCollection } from '../types';
import { getProcessorsForNode } from '../processors';
import { extractNodeToken } from '../services';
import { getNodePathName } from '../utils/node.utils';

export async function collectTokens(): Promise<TokenCollection> {
  const collection: TokenCollection = { tokens: [] };
  const startTime = Date.now();
  async function processNode(node: BaseNode) {
    // Eggstractor won't use the VECTOR nodes from FIGMA, and they are numerous, so skip them.
    if ('type' in node && ['VECTOR', 'INSTANCE'].includes(node.type)) return;

    if ('type' in node && 'boundVariables' in node) {
      const nodePath = getNodePathName(node as SceneNode).split('_');
      const processors = getProcessorsForNode(node as SceneNode);

      for (const processor of processors) {
        const tokens = await extractNodeToken(node as SceneNode, processor, nodePath);
        collection.tokens.push(...tokens);
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        await processNode(child);
      }
    }
  }

  await figma.loadAllPagesAsync();
  const pagePromises = figma.root.children.map(async (page, i) => {
    await processNode(page);
  });

  await Promise.all(pagePromises);

  const endTime = Date.now();
  const totalSeconds = (endTime - startTime) / 1000;
  console.log(
    `Total time: ${totalSeconds}s (${Math.floor(totalSeconds / 60)}m ${Math.floor(totalSeconds % 60)}s)`,
  );

  return collection;
}
