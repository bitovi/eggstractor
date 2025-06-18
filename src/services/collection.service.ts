import { TokenCollection } from '../types';
import { getProcessorsForNode } from '../processors';
import { extractNodeToken } from '../services';
import { getNodePathName } from '../utils/node.utils';

export async function collectTokens(onProgress?: (progress: number, message: string) => void) {
  const collection: TokenCollection = { tokens: [] };

  let totalNodes = 0;
  let processedNodes = 0;

  function countNodes(node: BaseNode): void {
    if ('type' in node && ['VECTOR', 'INSTANCE'].includes(node.type)) {
      return;
    }

    totalNodes++;

    if ('children' in node) {
      for (const child of node.children) {
        countNodes(child);
      }
    }
  }

  let lastTimestamp = Date.now();
  let lastPercentage = -1;

  async function processNode(node: BaseNode) {
    if ('type' in node && ['VECTOR', 'INSTANCE'].includes(node.type)) return;
    processedNodes++;

    // calculate integer percent in your 10–95 range
    const currentPercentage = Math.floor((processedNodes / totalNodes) * 85) + 10;
    const shouldUpdate = currentPercentage !== lastPercentage || processedNodes === totalNodes;

    if (shouldUpdate) {
      lastTimestamp = currentPercentage;
      onProgress?.(currentPercentage, `Processing nodes… ${processedNodes}/${totalNodes}`);

      // throttle yields to at most once every 200 ms
      const now = Date.now();
      if (now - lastTimestamp >= 200) {
        await new Promise((r) => setTimeout(r, 0));
        lastTimestamp = now;
      }
    }

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

  onProgress?.(0, 'Loading pages...');
  await figma.loadAllPagesAsync();

  onProgress?.(5, 'Counting nodes...');
  for (const page of figma.root.children) {
    countNodes(page);
  }

  onProgress?.(10, `Processing ${totalNodes} nodes...`);

  const pagePromises = figma.root.children.map(async (page) => {
    await processNode(page);
  });

  await Promise.all(pagePromises);

  return collection;
}
