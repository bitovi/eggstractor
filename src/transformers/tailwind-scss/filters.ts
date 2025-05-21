import { TokenCollection, NonNullableStyleToken } from '../../types';

export function filterStyleTokens({ tokens }: TokenCollection): NonNullableStyleToken[] {
  return tokens.filter(
    (token): token is NonNullableStyleToken =>
      token.type === 'style' &&
      token.value != null &&
      token.value !== '' &&
      token.rawValue != null &&
      token.rawValue !== '',
  );
}
