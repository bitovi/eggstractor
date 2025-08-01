import { ComponentSetToken, ComponentToken, StyleToken, TokenCollection, InstanceToken } from '../types';
import { getProcessorsForNode } from '../processors';
import {
  extractComponentSetToken,
  extractComponentToken,
  extractInstanceSetToken,
  extractNodeToken,
} from '../services';
import { getNodePathNames } from '../utils/node.utils';

function createWarningToken(componentSetNode: BaseNode, duplicateNames: string[]): StyleToken {
  return {
    property: `warning-${componentSetNode.id}`,
    name: `duplicate-component-warning`,
    type: 'style',
    value: null,
    rawValue: null,
    path: [{ name: componentSetNode.name || 'unnamed', type: 'COMPONENT_SET' }],
    warnings: [
      `Component set "${componentSetNode.name}" contains duplicate variants: ${duplicateNames.join(', ')}. ` +
        `Remove duplicate components in Figma to fix this issue.`,
    ],
    // Optional: mark it somehow so it gets filtered out of actual CSS generation
    componentSetId: componentSetNode.id,
  };
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
            `  Layer: "${variantName}"\n` +
            `  Found duplicate layers in Figma - check the layers panel for identical component names`,
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
    const currentNodeType = 'type' in currentNode ? currentNode.type : null;

    // Skip VECTOR which are not relevant for token extraction.
    if (currentNodeType === 'VECTOR') {
      return;
    }

    // Skip . and _ nodes entirely. These are components that are marked as hidden or private by designers.
    if ('name' in currentNode && ['.', '_'].some((char) => currentNode.name.startsWith(char))) {
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
            `❌ Error extracting COMPONENT token for "${node.name}":`,
            error instanceof Error ? error.message : String(error),
          );
          console.error(`   🔍 Component ID: ${node.id}`);
          console.error(`   🔍 Basic props:`, {
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
          console.error(`   🔍 Component ID: ${node.id}`);
          console.error(`   🔍 Basic props:`, {
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
        } catch (error) {
          console.error(
            `❌ Error extracting INSTANCE token for "${node.name}":`,
            error instanceof Error ? error.message : String(error),
          );
          console.error(`   🔍 Node keys only:`, Object.keys(node));
          console.error(`   🔍 Basic props:`, {
            name: node.name,
            type: node.type,
            id: node.id,
            visible: node.visible,
          });
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
  const allPageResults = figma.root.children.map((page) => getFlattenedValidNodes(page));
  const allValidNodes = allPageResults.flatMap((result) => result.validNodes);
  const allWarningTokens = allPageResults.flatMap((result) => result.warningTokens);

  totalNodes = allValidNodes.length;

  onProgress(10, `Processing ${totalNodes} nodes...`);

  collection.tokens.push(...allWarningTokens);

  for (const node of allValidNodes) {
    await processNode(node);
  }

  // Second pass: Process component instances that should be exported as references
  onProgress(90, 'Processing component references...');
  await processComponentReferences(collection, allValidNodes);

  return collection as Readonly<TokenCollection>;
}

/**
 * Checks if a component instance should be exported as a component reference
 * rather than being broken down into individual style properties
 */
export function shouldExportAsComponentReference(
  instanceToken: InstanceToken,
  collection: TokenCollection
): boolean {
  // Skip remote components as they can't be reliably referenced
  if (instanceToken.remote) {
    return false;
  }

  // Check if the component exists in our collection
  const componentToken = instanceToken.componentNode ? collection.components[instanceToken.componentNode.id] : null;
  if (!componentToken) {
    return false;
  }

  // Check if this is a variant of a component set
  const componentSetToken = componentToken.componentSetId ? collection.componentSets[componentToken.componentSetId] : null;
  
  // Only export as reference if it's part of a component set (has variants)
  // or if it's a standalone component that's been reused
  return !!(componentSetToken || isReusedComponent(instanceToken, collection));
}

/**
 * Determines if a component is reused across the design
 */
function isReusedComponent(instanceToken: InstanceToken, collection: TokenCollection): boolean {
  if (!instanceToken.componentNode) return false;

  // Count how many instances of this component exist
  const componentId = instanceToken.componentNode.id;
  const instanceCount = Object.values(collection.instances).filter(
    instance => instance.componentNode?.id === componentId
  ).length;

  // Consider it reused if there are multiple instances
  return instanceCount > 1;
}

/**
 * Creates a component reference token instead of style tokens
 */
export function createComponentReferenceToken(
  instanceToken: InstanceToken,
  collection: TokenCollection
): StyleToken {
  const componentToken = instanceToken.componentNode ? collection.components[instanceToken.componentNode.id] : null;
  const componentSetToken = componentToken?.componentSetId ? 
    collection.componentSets[componentToken.componentSetId] : null;

  let componentReferenceName = '';
  
  if (componentSetToken) {
    // For component sets, include variant information
    const variantProperties = instanceToken.variantProperties || {};
    const variantParts = Object.entries(variantProperties)
      .map(([key, value]) => `${key}-${value}`)
      .join('--');
    
    componentReferenceName = componentSetToken.name;
    if (variantParts) {
      componentReferenceName += `--${variantParts}`;
    }
  } else if (componentToken) {
    // For standalone components, just use the component name
    componentReferenceName = instanceToken.name || componentToken.id;
  }

  return {
    type: 'style',
    name: instanceToken.name || 'unnamed',
    property: 'component-reference',
    value: `@include ${componentReferenceName}()`,
    rawValue: `/* Component reference: ${componentReferenceName} */`,
    path: [{ name: instanceToken.name, type: 'INSTANCE' }],
    componentId: componentToken?.id,
    componentSetId: componentToken?.componentSetId || undefined,
    metadata: {
      figmaId: instanceToken.id,
    }
  };
}

/**
 * Second pass processing for component instances that should be exported as references
 */
async function processComponentReferences(collection: TokenCollection, allValidNodes: BaseNode[]) {
  const instanceNodes = allValidNodes.filter(node => node.type === 'INSTANCE') as InstanceNode[];
  
  for (const instanceNode of instanceNodes) {
    const instanceToken = collection.instances[instanceNode.id];
    if (!instanceToken) continue;

    // Check if this instance should be exported as a component reference
    if (shouldExportAsComponentReference(instanceToken, collection)) {
      const referenceToken = createComponentReferenceToken(instanceToken, collection);
      collection.tokens.push(referenceToken);

      // Remove existing style tokens for this instance node to avoid duplication
      collection.tokens = collection.tokens.filter(token => 
        !(token.type === 'style' && 
          token.path.some(pathNode => pathNode.type === 'INSTANCE' && pathNode.name === instanceNode.name) &&
          token.property !== 'component-reference')
      );
    }
  }
}
