import {
  ComponentSetToken,
  ComponentToken,
  InstanceToken,
  PathNode,
  StyleToken,
  VariableToken,
} from '../types';
import { StyleProcessor, VariableBindings } from '../types/processors';
import { collectBoundVariable } from './variable.service';

export const extractInstanceSetToken = async (node: InstanceNode): Promise<InstanceToken> => {
  const componentNode = await node.getMainComponentAsync();

  return {
    type: node.type,
    id: node.id,
    name: node.name,
    remote: componentNode?.remote ?? false,
    // This can be used to reference components -> component sets for non-remote components
    componentNode,
    variantProperties: node.variantProperties ?? {},
  };
};

export const extractComponentToken = (
  node: ComponentNode,
  componentSetToken?: ComponentSetToken,
): ComponentToken => {
  return {
    type: node.type,
    id: node.id,
    componentSetId: componentSetToken?.id ?? null,
    variantProperties: node.variantProperties ?? {},
  };
};

export const extractComponentSetToken = (node: ComponentSetNode): ComponentSetToken => {
  const variantPropertyDefinitions: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(node.componentPropertyDefinitions)) {
    if (value.type !== 'VARIANT') {
      continue;
    }

    variantPropertyDefinitions[key] = value.variantOptions ?? [];
  }

  return {
    type: node.type,
    id: node.id,
    name: node.name,
    variantPropertyDefinitions,
  };
};

const variableTokensCache = new Map<string, VariableToken>();

interface Issue {
  message: string;
  error: string;
}

export async function extractNodeToken(
  node: SceneNode,
  processor: StyleProcessor,
  pathNodes: PathNode[],
  componentToken?: ComponentToken | null,
  componentSetToken?: ComponentSetToken | null,
): Promise<{ tokens: (StyleToken | VariableToken)[]; issues: Issue[] }> {
  const issues: Issue[] = [];
  const tokens: (StyleToken | VariableToken)[] = [];
  const variableTokensMap = new Map<string, VariableToken>();

  // Helper to check or add variable token
  const getOrCreateVariableToken = async (varId: string, property: string) => {
    const key = `${varId}-${property}`;

    let token: VariableToken | null | undefined;

    // Check global cache first
    if (variableTokensCache.has(key)) {
      token = variableTokensCache.get(key)!;
    }

    // All variable tokens of a property should already be unique and varId
    // shouldn't have to be included. This is because any style token should
    // only attempt to set one css property.
    token ??= await collectBoundVariable(varId, property, pathNodes, node);

    if (!token) {
      // TODO(ERROR-HANDLING): Replace throw with log-and-continue strategy.
      // Should log warning with variable ID (varId), property, and node path,
      // skip this token, and add to warnings array to show in UI. Don't halt entire process.
      throw new Error('Unexpected null token for variable');
    }

    // Check scoped cache to StyleToken
    if (!variableTokensMap.has(key)) {
      variableTokensMap.set(key, token);
      // Deprecated and should be removed in the future
      tokens.push(token);
    }

    return token;
  };

  // Step 1 & 2: Handle Variable Bindings
  const customBoundVariables = node.boundVariables as unknown as VariableBindings;
  const bindings = processor.bindingKey
    ? Array.isArray(customBoundVariables[processor.bindingKey])
      ? (customBoundVariables[processor.bindingKey] as VariableAlias[])
      : ([customBoundVariables[processor.bindingKey]] as VariableAlias[])
    : [];

  for (const binding of bindings) {
    if (binding?.id) {
      await getOrCreateVariableToken(binding.id, processor.property);
    }
  }

  // Step 3: Collect variables from boundVariables
  if ('boundVariables' in node && node.boundVariables) {
    for (const [key, value] of Object.entries(node.boundVariables)) {
      if (typeof key === 'string' && value) {
        if (Array.isArray(value)) {
          for (const v of value) {
            if (v.type === 'VARIABLE_ALIAS') {
              await getOrCreateVariableToken(v.id, key);
            }
          }
        } else if (value?.type === 'VARIABLE_ALIAS') {
          await getOrCreateVariableToken(String(value.id), key);
        }
      }
    }
  }

  const variableTokenMapByProperty = new Map<string /* property */, VariableToken>();

  variableTokensMap.forEach((token, key) => {
    if (!variableTokenMapByProperty.has(token.property)) {
      variableTokenMapByProperty.set(token.property, token);
    } else {
      // All VariableTokens for a single StyleToken should be unique by property
      // This is because we currently are not supporting multiple variable
      // tokens for the same property.
      // throw new Error(
      //   `Variable token for property "${token.property}" already exists in the map. Key: ${key}`,
      // );
      issues.push({
        message: `Duplicate variable token for property "${token.property}" found. Only one variable token per property is allowed. ${token.metadata?.figmaId ?? 'UNKNOWN_ID'}`,
        error: `DUPLICATE_VARIABLE_TOKEN_PROPERTY: ${key} ${token.property} ${token.metadata?.figmaId ?? 'UNKNOWN_ID'}`,
      });
    }
  });

  // Step 4: Process the node and create Style Token
  const processedValue = await processor.process(variableTokenMapByProperty, node);

  if (processedValue) {
    const styleToken: StyleToken = {
      type: 'style',
      // TODO: this property conflicts with naming context and is too easy to
      // get mixed up. We should remove it or figure something else out.
      name: pathNodes.map(({ name }) => name).join('_AND_'),
      value: processedValue.value,
      rawValue: processedValue.rawValue,
      valueType: processedValue.valueType,
      property: processor.property,
      path: pathNodes,
      // Deprecated and will be removed in the future
      variables: variableTokensMap.size > 0 ? [...variableTokensMap.values()] : undefined,
      variableTokenMapByProperty,
      metadata: {
        figmaId: node.id,
      },
      warnings: processedValue.warnings,
      errors: processedValue.errors,
      componentId: componentToken?.id,
      componentSetId: componentSetToken?.id,
    };
    tokens.push(styleToken);
  }

  return { tokens, issues };
}
