import { ComponentSetToken, ComponentToken, TokenCollection } from '../types';
import { getProcessorsForNode } from '../processors';
import { extractComponentSetToken, extractComponentToken, extractNodeToken } from '../services';
import { getNodePathNames } from '../utils/node.utils';

export async function collectTokens(): Promise<Readonly<TokenCollection>> {
  const collection: TokenCollection = { tokens: [], components: {}, componentSets: {} };

  async function processNode(node: BaseNode, componentToken?: ComponentToken | null, componentSetToken?: ComponentSetToken | null): Promise<void> {
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      // console.log('collectTokens -> processNode', node);
    }

    // Eggstractor won't use the VECTOR nodes from FIGMA, and they are numerous, so skip them.
    if ('type' in node && ['VECTOR', 'INSTANCE'].includes(node.type)) return;

    if ('type' in node && 'boundVariables' in node) {
      if (node.type === 'COMPONENT_SET') {
        componentSetToken = extractComponentSetToken(node);
        collection.componentSets[node.id] = componentSetToken;
      }

      if (node.type === 'COMPONENT') {
        // TODO: handle
        componentToken = extractComponentToken(node, componentSetToken!);
        collection.components[node.id] = componentToken;
      }

      if (node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET') {
        const nodePathNames = getNodePathNames(node);
        const processors = getProcessorsForNode(node);

        for (const processor of processors) {
          const tokens = await extractNodeToken(node, processor, nodePathNames, componentToken, componentSetToken);
          collection.tokens.push(...tokens);
        }
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        await processNode(child, componentToken, componentSetToken);
      }
    }
  }

  await figma.loadAllPagesAsync();
  const pagePromises = figma.root.children.map(async (page) => {
    await processNode(page);
  });

  await Promise.all(pagePromises);

  return collection as Readonly<TokenCollection>;
}
