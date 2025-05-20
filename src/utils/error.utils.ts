export function deduplicateMessages(tokens: { warnings?: string[]; errors?: string[] }[]): {
  warnings: string[];
  errors: string[];
} {
  const warningsSet = new Set<string>();
  const errorsSet = new Set<string>();

  tokens.forEach((token) => {
    if (token.warnings) {
      token.warnings.forEach((warning) => warningsSet.add(warning));
    }
    if (token.errors) {
      token.errors.forEach((error) => errorsSet.add(error));
    }
  });

  return {
    warnings: Array.from(warningsSet),
    errors: Array.from(errorsSet),
  };
}
