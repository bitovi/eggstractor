import { TokenCollection, NonNullableStyleToken } from '../../types';

export function filterStyleTokens({ tokens }: TokenCollection): {
  styleTokens: NonNullableStyleToken[];
  warnings: string[];
  errors: string[];
} {
  const warningsSet = new Set<string>();
  const errorsSet = new Set<string>();

  const styleTokens = tokens.filter((token): token is NonNullableStyleToken => {
    // Extract warnings/errors from ALL tokens as we iterate
    if ('warnings' in token && token.warnings) {
      token.warnings.forEach((warning: string) => warningsSet.add(warning));
    }
    if ('errors' in token && token.errors) {
      token.errors.forEach((error: string) => errorsSet.add(error));
    }

    return (
      token.type === 'style' &&
      token.value != null &&
      token.value !== '' &&
      token.rawValue != null &&
      token.rawValue !== ''
    );
  });

  return {
    styleTokens,
    warnings: Array.from(warningsSet),
    errors: Array.from(errorsSet),
  };
}
