import { ComponentSetToken, ComponentToken, TokenCollection } from '../types';
import { getProcessorsForNode } from '../processors';
import { extractComponentSetToken, extractComponentToken, extractNodeToken } from '../services';
import { getNodePathNames } from '../utils/node.utils';

function getFlattenedValidNodes(node: BaseNode): BaseNode[] {
  const result: BaseNode[] = [];

  function traverse(currentNode: BaseNode) {
    // Skip VECTOR and INSTANCE nodes entirely. INSTANCE nodes which are
    // instances of components, which are not relevant for token extraction.
    if ('type' in currentNode && ['VECTOR', 'INSTANCE'].includes(currentNode.type)) {
      return;
    }

    result.push(currentNode);

    if ('children' in currentNode) {
      for (const child of currentNode.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return result;
}

export async function collectTokens(onProgress: (progress: number, message: string) => void) {
  const collection: TokenCollection = { tokens: [], components: {}, componentSets: {} };

  let componentToken: ComponentToken | null = null;
  let componentSetToken: ComponentSetToken | null = null;

  let totalNodes = 0;
  let processedNodes = 0;

  let lastTimestamp = Date.now();
  let lastPercentage = -1;

  async function processNode(node: BaseNode) {
    processedNodes++;

    // calculate integer percent in your 10–95 range
    const currentPercentage = Math.floor((processedNodes / totalNodes) * 85) + 10;
    const shouldUpdate = currentPercentage !== lastPercentage || processedNodes === totalNodes;

    if (shouldUpdate) {
      lastTimestamp = currentPercentage;
      onProgress(currentPercentage, `Processing nodes… ${processedNodes}/${totalNodes}`);

      // throttle yields to at most once every 200 ms
      const now = Date.now();
      if (now - lastTimestamp >= 200) {
        await new Promise((r) => setTimeout(r, 0));
        lastTimestamp = now;
      }
    }

    if ('type' in node && 'boundVariables' in node) {
      if (node.type === 'COMPONENT_SET') {
        componentSetToken = extractComponentSetToken(node);
        collection.componentSets[node.id] = componentSetToken;
      }

      if (node.type === 'COMPONENT') {
        componentToken = extractComponentToken(node, componentSetToken!);
        collection.components[node.id] = componentToken;
      }

      const nodePathNames = getNodePathNames(node);
      const processors = getProcessorsForNode(node);

      for (const processor of processors) {
        const tokens = await extractNodeToken(
          node,
          processor,
          nodePathNames,
          componentToken,
          componentSetToken,
        );
        collection.tokens.push(...tokens);
      }
    }
  }

  onProgress(0, 'Loading pages...');
  await figma.loadAllPagesAsync();

  onProgress(5, 'Counting nodes...');
  const validNodes = figma.root.children.flatMap((page) => getFlattenedValidNodes(page));
  totalNodes = validNodes.length;

  onProgress(10, `Processing ${totalNodes} nodes...`);

  // Process all pages in parallel for maximum speed
  const pagePromises = figma.root.children.map(async (page) => {
    const validNodes = getFlattenedValidNodes(page);

    for (const node of validNodes) {
      await processNode(node);
    }
  });

  await Promise.all(pagePromises);

  return collection as Readonly<TokenCollection>;
}
