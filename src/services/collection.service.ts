import { TokenCollection } from "../types";
import { getProcessorsForNode } from "../processors";
import { extractNodeToken } from "../services";
import { getNodePathName } from "../utils/node.utils";

export async function collectTokens(): Promise<TokenCollection> {
  const collection: TokenCollection = { tokens: [] };

  async function processNode(node: BaseNode) {
    if ("type" in node && "boundVariables" in node) {
      const nodePath = getNodePathName(node as SceneNode).split("_");
      const processors = getProcessorsForNode(node as SceneNode);

      for (const processor of processors) {
        const tokens = await extractNodeToken(
          node as SceneNode,
          processor,
          nodePath
        );
        collection.tokens.push(...tokens);
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        await processNode(child);
      }
    }
  }

  await processNode(figma.currentPage);
  return collection;
}
