import { StyleToken, InstanceToken, ComponentToken, TokenCollection } from '../types';
import { getProcessorsForNode } from '../processors';
import { extractNodeToken } from './token.service';
import { getNodePathNames } from '../utils/node.utils';

export interface InstanceOverride {
  instanceId: string;
  instanceName: string;
  componentId?: string;
  overrideTokens: StyleToken[];
  allTokens: StyleToken[];
}

/**
 * Detects and extracts override styles for component instances by comparing
 * fresh style extractions from both instance and component nodes.
 */
export async function detectInstanceOverrides(
  collection: TokenCollection
): Promise<InstanceOverride[]> {
  const overrides: InstanceOverride[] = [];

  for (const [instanceId, instanceToken] of Object.entries(collection.instances)) {
    if (instanceToken.remote || !instanceToken.componentNode) {
      continue; // Skip remote instances and instances without component references
    }

    try {
      // Get the actual Figma nodes for comparison
      const instanceNode = await figma.getNodeByIdAsync(instanceId) as InstanceNode;
      const componentNode = instanceToken.componentNode;
      
      if (!instanceNode || !componentNode) {
        continue;
      }

      // Extract fresh styles from both nodes for accurate comparison
      const componentSetToken = instanceToken.componentNode?.parent?.type === 'COMPONENT_SET' 
        ? collection.componentSets[instanceToken.componentNode.parent.id]
        : undefined;
      
      const componentTokenData = collection.components[componentNode.id];
      
      const instanceStyles = await extractInstanceStyles(instanceNode, componentTokenData, componentSetToken);
      const componentStyles = await extractComponentStyles(componentNode, componentTokenData, componentSetToken);

      // Find overrides by comparing properties
      const overrideTokens: StyleToken[] = [];
      
      for (const instanceStyle of instanceStyles) {
        const correspondingComponentStyle = componentStyles.find(
          componentStyle => componentStyle.property === instanceStyle.property
        );

        // If there's no corresponding token in the component, or values differ, it's an override
        if (!correspondingComponentStyle || 
            correspondingComponentStyle.value !== instanceStyle.value ||
            correspondingComponentStyle.rawValue !== instanceStyle.rawValue) {
          overrideTokens.push(instanceStyle);
        }
      }

      // Include this instance even if there are no overrides (as per requirement)
      overrides.push({
        instanceId,
        instanceName: instanceToken.name,
        componentId: componentNode.id,
        overrideTokens,
        allTokens: instanceStyles,
      });

    } catch (error) {
      console.warn(`Failed to process instance ${instanceToken.name}:`, error);
      // Still include the instance with empty overrides
      overrides.push({
        instanceId,
        instanceName: instanceToken.name,
        componentId: instanceToken.componentNode?.id,
        overrideTokens: [],
        allTokens: [],
      });
    }
  }

  return overrides;
}

/**
 * Extracts all style properties for an instance node by processing it directly.
 * This is used to get fresh token data for comparison.
 */
export async function extractInstanceStyles(
  instanceNode: InstanceNode,
  componentToken?: ComponentToken,
  componentSetToken?: any
): Promise<StyleToken[]> {
  const nodePathNames = getNodePathNames(instanceNode);
  const processors = getProcessorsForNode(instanceNode);
  const allTokens: StyleToken[] = [];

  for (const processor of processors) {
    const tokens = await extractNodeToken(
      instanceNode,
      processor,
      nodePathNames,
      componentToken,
      componentSetToken,
    );

    const styleTokens = tokens.filter((token): token is StyleToken => token.type === 'style');
    allTokens.push(...styleTokens);
  }

  return allTokens;
}

/**
 * Extracts all style properties for a component node by processing it directly.
 */
export async function extractComponentStyles(
  componentNode: ComponentNode,
  componentToken?: ComponentToken,
  componentSetToken?: any
): Promise<StyleToken[]> {
  const nodePathNames = getNodePathNames(componentNode);
  const processors = getProcessorsForNode(componentNode);
  const allTokens: StyleToken[] = [];

  for (const processor of processors) {
    const tokens = await extractNodeToken(
      componentNode,
      processor,
      nodePathNames,
      componentToken,
      componentSetToken,
    );

    const styleTokens = tokens.filter((token): token is StyleToken => token.type === 'style');
    allTokens.push(...styleTokens);
  }

  return allTokens;
}
