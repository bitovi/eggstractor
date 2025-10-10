/**
 * Asserts whether a value is a Variable Alias object.
 */
export const isVariableAlias = (
  value: unknown,
): value is { type: 'VARIABLE_ALIAS'; id: string } => {
  if (!value) return false;

  return (
    typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS' && 'id' in value
  );
};
