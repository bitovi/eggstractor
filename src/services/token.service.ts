import { StyleToken, VariableToken } from '../types';
import { StyleProcessor, VariableBindings } from '../types/processors';
import Utils from '../utils';
import { getVariableFallback } from './variable.service';

export async function extractNodeToken(
  node: SceneNode,
  processor: StyleProcessor,
  path: string[]
): Promise<(StyleToken | VariableToken)[]> {
  const tokens: (StyleToken | VariableToken)[] = [];

  // Step 1: Handle Variable Bindings
  const customBoundVariables = node.boundVariables as unknown as VariableBindings;
  const bindings = processor.bindingKey
    ? (Array.isArray(customBoundVariables[processor.bindingKey])
      ? customBoundVariables[processor.bindingKey] as VariableAlias[]
      : [customBoundVariables[processor.bindingKey]] as VariableAlias[])
    : [];

  // Step 2: Create Variable Tokens
  const variableTokens: VariableToken[] = [];
  for (const binding of bindings) {
    if (!binding?.id) continue;

    const variable = await figma.variables.getVariableByIdAsync(binding.id);
    if (!variable) continue;

    const rawValue = await getVariableFallback(variable, processor.property);
    const variableToken: VariableToken = {
      type: 'variable',
      name: variable.name,
      value: `$${Utils.sanitizeName(variable.name)}`,
      rawValue,
      property: processor.property,
      path,
      metadata: {
        figmaId: node.id,
        variableId: variable.id,
        variableName: variable.name,
      }
    };

    variableTokens.push(variableToken);
    tokens.push(variableToken);
  }

  // Step 3: Process the node and create Style Token
  const processedValue = await processor.process(variableTokens, node);
  if (processedValue) {
    const styleToken: StyleToken = {
      type: 'style',
      name: path.join('_'),
      value: processedValue.value,
      rawValue: processedValue.rawValue,
      property: processor.property,
      path: path.length > 1 ? path.slice(1) : path,
      variables: variableTokens.length > 0 ? variableTokens : undefined,
      metadata: {
        figmaId: node.id,
      }
    };

    tokens.push(styleToken);
  }

  return tokens;
} 