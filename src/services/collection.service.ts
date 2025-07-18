import { ComponentSetToken, ComponentToken, TokenCollection } from '../types';
import { getProcessorsForNode } from '../processors';
import {
  extractComponentSetToken,
  extractComponentToken,
  extractInstanceSetToken,
  extractNodeToken,
} from '../services';
import { getNodePathNames } from '../utils/node.utils';

export function getFlattenedValidNodes(node: BaseNode): BaseNode[] {
  const result: BaseNode[] = [];

  function traverse(currentNode: BaseNode) {
    const currentNodeType = 'type' in currentNode ? currentNode.type : null;

    // Skip VECTOR which are not relevant for token extraction.
    if (currentNodeType === 'VECTOR') {
      return;
    }

    // Skip . and _ nodes entirely. These are components that are marked as hidden or private by designers.
    if ('name' in currentNode && ['.', '_'].some((char) => currentNode.name.startsWith(char))) {
      return;
    }

    result.push(currentNode);

    // For INSTANCE nodes, we still want to collect them but not their children.
    if (currentNodeType === 'INSTANCE') {
      return;
    }

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
  const collection: TokenCollection = {
    tokens: [],
    components: {},
    componentSets: {},
    instances: {},
  };

  let componentToken: ComponentToken | null = null;
  let componentSetToken: ComponentSetToken | null = null;

  let totalNodes = 0;
  let processedNodes = 0;

  let lastTimestamp = Date.now();
  let lastPercentage = -1;

  async function processNode(node: BaseNode) {
    processedNodes++;

    const currentPercentage = Math.floor((processedNodes / totalNodes) * 85) + 10;
    const shouldUpdate = currentPercentage !== lastPercentage || processedNodes === totalNodes;

    if (shouldUpdate) {
      lastPercentage = currentPercentage;
      onProgress(currentPercentage, `Processing nodes… ${processedNodes}/${totalNodes}`);

      const now = Date.now();
      if (now - lastTimestamp >= 200) {
        await new Promise((r) => setTimeout(r, 0));
        lastTimestamp = now;
      }
    }

    if ('type' in node && 'boundVariables' in node) {
      if (node.type === 'COMPONENT_SET') {
        try {
          componentSetToken = extractComponentSetToken(node);
          collection.componentSets[node.id] = componentSetToken;
        } catch (error) {
          console.error(
            `❌ Error extracting COMPONENT_SET token for "${node.name}":`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      if (node.type === 'COMPONENT') {
        try {
          componentToken = extractComponentToken(node, componentSetToken!);
          collection.components[node.id] = componentToken;
        } catch (error) {
          console.error(
            `❌ Error extracting COMPONENT token for "${node.name}":`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      if (node.type === 'INSTANCE') {
        try {
          const instanceToken = await extractInstanceSetToken(node);
          collection.instances[node.id] = instanceToken;
        } catch (error) {
          console.error(
            `❌ Error extracting INSTANCE token for "${node.name}":`,
            error instanceof Error ? error.message : String(error),
          );
        }
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
