import { StyleToken, VariableToken } from '../types';
import { StyleProcessor, VariableBindings } from '../types/processors';
import { collectBoundVariable } from './variable.service';

export async function extractNodeToken(
  node: SceneNode,
  processor: StyleProcessor,
  path: string[]
): Promise<(StyleToken | VariableToken)[]> {
  const tokens: (StyleToken | VariableToken)[] = [];
  const variableTokensMap = new Map<string, VariableToken>();

  // Helper to check or add variable token
  const getOrCreateVariableToken = async (varId: string, property: string) => {
    const key = `${varId}-${property}`;
    if (variableTokensMap.has(key)) {
      return variableTokensMap.get(key)!;
    }

    const token = await collectBoundVariable(varId, property, path, node);
    if (token) {
      variableTokensMap.set(key, token);
      tokens.push(token);
    }
    return token;
  };

  // Step 1 & 2: Handle Variable Bindings
  const customBoundVariables = node.boundVariables as unknown as VariableBindings;
  const bindings = processor.bindingKey
    ? (Array.isArray(customBoundVariables[processor.bindingKey])
      ? customBoundVariables[processor.bindingKey] as VariableAlias[]
      : [customBoundVariables[processor.bindingKey]] as VariableAlias[])
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

  // Step 4: Process the node and create Style Token
  const processedValue = await processor.process([...variableTokensMap.values()], node);
  if (processedValue) {
    const styleToken: StyleToken = {
      type: 'style',
      name: path.join('_'),
      value: processedValue.value,
      rawValue: processedValue.rawValue,
      property: processor.property,
      path: path.length > 1 ? path.slice(1) : path,
      variables: variableTokensMap.size > 0 ? [...variableTokensMap.values()] : undefined,
      metadata: {
        figmaId: node.id,
      },
      warnings: processedValue.warnings,
      errors: processedValue.errors
    };
    tokens.push(styleToken);
  }

  return tokens;
} 