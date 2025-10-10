import {
  ComponentSetToken,
  ComponentToken,
  InstanceToken,
  StyleToken,
  TokenCollection,
} from '../types';
import { getProcessorsForNode } from '../processors';
import {
  extractComponentSetToken,
  extractComponentToken,
  extractInstanceSetToken,
  extractNodeToken,
} from './token.service';
import { collectAllFigmaVariables } from './variable.service';
import { collectAllFigmaEffectStyles } from './effect.service';
import { MAX_PROGRESS_PERCENTAGE, delay, getParentSceneNodes } from '../utils';

/**
 * @deprecated - TODO: Separate warning tokens as a separate thing than StyleTokens.
 */
function createErrorToken(
  issue: Awaited<ReturnType<typeof extractNodeToken>>['issues'][0],
): StyleToken {
  return {
    property: issue.error,
    name: `duplicate-variable-token-error`,
    type: 'style',
    value: null,
    rawValue: null,
    path: [{ name: 'NONE', type: 'COMPONENT_SET' } as SceneNode],
    warnings: [issue.message],
    // STUB
    variableTokenMapByProperty: new Map(),
  };
}

/**
 * @deprecated - TODO: Separate warning tokens as a separate thing than StyleTokens.
 */
function createWarningToken(componentSetNode: BaseNode, duplicateNames: string[]): StyleToken {
  return {
    property: `warning-${componentSetNode.id}`,
    name: `duplicate-component-warning`,
    type: 'style',
    value: null,
    rawValue: null,
    path: [
      {
        name: componentSetNode.name || 'unnamed',
        type: 'COMPONENT_SET',
      } as SceneNode,
    ],
    warnings: [
      `Component set "${componentSetNode.name}" contains duplicate variants: ${duplicateNames.join(', ')}. ` +
        `Remove duplicate components in Figma to fix this issue.`,
    ],
    // Optional: mark it somehow so it gets filtered out of actual CSS generation
    componentSetId: componentSetNode.id,
    // STUB
    variableTokenMapByProperty: new Map(),
  };
}

export function shouldSkipInstanceTokenGeneration(
  node: InstanceNode,
  instanceToken: InstanceToken,
  collection: TokenCollection,
): boolean {
  // If this instance references a component we already have tokens for, skip it
  if (instanceToken.componentNode) {
    const baseComponentId = instanceToken.componentNode.id;
    const baseComponent = collection.components[baseComponentId];

    if (baseComponent) {
      console.info(
        `🎯 Instance "${node.name}" duplicates component "${baseComponentId}" - skipping tokens`,
      );
      return true;
    }
  }
  return false;
}

export function detectComponentSetDuplicates(componentSetNode: BaseNode): {
  duplicateNames: string[];
  hasDuplicates: boolean;
} {
  const duplicateNames: string[] = [];
  const seenVariants = new Set<string>();

  if (!('children' in componentSetNode)) {
    return { duplicateNames, hasDuplicates: false };
  }

  for (const child of componentSetNode.children) {
    if (child.type === 'COMPONENT') {
      const variantName = child.name || 'unnamed';

      if (seenVariants.has(variantName)) {
        console.warn(
          `🚨 DUPLICATE VARIANT in "${componentSetNode.name}" component set:\n` +
            ` Layer: "${variantName}"\n` +
            ` Found duplicate layers in Figma - check the layers panel for identical component names`,
        );
        duplicateNames.push(variantName);
      } else {
        seenVariants.add(variantName);
      }
    }
  }

  return {
    duplicateNames,
    hasDuplicates: duplicateNames.length > 0,
  };
}

export function getFlattenedValidNodes(node: BaseNode): {
  validNodes: BaseNode[];
  warningTokens: StyleToken[];
} {
  const result: BaseNode[] = [];
  const warningTokens: StyleToken[] = [];

  function traverse(currentNode: BaseNode) {
    // Skip . and _ nodes entirely. These are components that are marked as hidden or private by designers.
    if ('name' in currentNode && ['.', '_'].some((char) => currentNode.name.startsWith(char))) {
      return;
    }

    if ('fills' in currentNode && Array.isArray(currentNode.fills)) {
      // VariableTokens do not current support multiple values.
      if (currentNode.fills.length > 1) {
        return;
      }

      // VariableTokens do not current support gradient styles.
      if (currentNode.fills.some((fill) => fill.type.startsWith('GRADIENT'))) {
        return;
      }
    }

    // Nodes hidden by designers aren't valid to process.
    if ('visible' in currentNode && currentNode.visible === false) {
      return;
    }

    // Check for duplicates and skip if found
    if (currentNode.type === 'COMPONENT_SET') {
      const { hasDuplicates, duplicateNames } = detectComponentSetDuplicates(currentNode);

      if (hasDuplicates) {
        console.warn(`⏭️ Skipping corrupted component set: ${currentNode.name}`);
        warningTokens.push(createWarningToken(currentNode, duplicateNames));
        return; // Skip the entire component set and all its children
      }
    }

    result.push(currentNode);

    if ('children' in currentNode) {
      for (const child of currentNode.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return { validNodes: result, warningTokens };
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
    const currentPercentage =
      Math.floor((processedNodes / totalNodes) * (MAX_PROGRESS_PERCENTAGE - 10)) + 10;
    const shouldUpdate = currentPercentage !== lastPercentage || processedNodes === totalNodes;

    if (shouldUpdate) {
      lastPercentage = currentPercentage;
      onProgress(currentPercentage, `Processing nodes… ${processedNodes}/${totalNodes}`);
      const now = Date.now();

      if (now - lastTimestamp >= 200) {
        await delay(0);
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
            `❌ Error extracting COMPONENT token for "${node.name}":`,
            error instanceof Error ? error.message : String(error),
          );
          console.error(` 🔍 Component ID: ${node.id}`);
          console.error(` 🔍 Basic props:`, {
            name: node.name,
            type: node.type,
            id: node.id,
            visible: node.visible,
          });
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
          console.error(` 🔍 Component ID: ${node.id}`);
          console.error(` 🔍 Basic props:`, {
            name: node.name,
            type: node.type,
            id: node.id,
            visible: node.visible,
          });
        }
      }

      if (node.type === 'INSTANCE') {
        try {
          const instanceToken = await extractInstanceSetToken(node);
          collection.instances[node.id] = instanceToken;

          if (shouldSkipInstanceTokenGeneration(node, instanceToken, collection)) {
            return;
          }
        } catch (error) {
          console.error(
            `❌ Error extracting INSTANCE token for "${node.name}":`,
            error instanceof Error ? error.message : String(error),
          );
          console.error(` 🔍 Node keys only:`, Object.keys(node));
          console.error(` 🔍 Basic props:`, {
            name: node.name,
            type: node.type,
            id: node.id,
            visible: node.visible,
          });
        }
      }

      const parentSceneNodes = getParentSceneNodes(node);
      const processors = getProcessorsForNode(node);

      for (const processor of processors) {
        const { tokens, issues } = await extractNodeToken(
          node,
          processor,
          parentSceneNodes,
          componentToken,
          componentSetToken,
        );
        collection.tokens.push(...tokens);
        collection.tokens.push(...issues.map((issue) => createErrorToken(issue)));
      }
    }
  }

  onProgress(0, 'Loading pages...');
  await figma.loadAllPagesAsync();

  // Collect standalone Figma Variables (primitive tokens)
  await collectAllFigmaVariables(collection, onProgress);

  // Collect Figma Effect Styles (box-shadow, etc.)
  await collectAllFigmaEffectStyles(collection, onProgress);

  onProgress(5, 'Counting nodes...');

  const allPageResults = figma.root.children.map((page) => getFlattenedValidNodes(page));
  const allValidNodes = allPageResults.flatMap((result) => result.validNodes);
  const allWarningTokens = allPageResults.flatMap((result) => result.warningTokens);

  totalNodes = allValidNodes.length;
  onProgress(10, `Processing ${totalNodes} nodes...`);
  collection.tokens.push(...allWarningTokens);

  for (const node of allValidNodes) {
    await processNode(node);
  }

  return collection as Readonly<TokenCollection>;
}
