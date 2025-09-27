import { StyleToken } from '../../types';

export const getStylePropertyAndValue = (
  token: StyleToken,
): Record<string, string> => {
  const output: Record<string, string> = {
    [token.property]: token.rawValue!,
  };

  return output;
};
