import { NonNullableStyleToken, TokenCollection, VariableToken } from '../../types';
import { groupBy } from '../utils/group-by.utils';
import { convertToGeneratorTokens, convertVariantGroupBy } from '../variants';
import { filterStyleTokens } from './filters';
import { createTailwindClasses } from './generators';
import { getStylePropertyAndValue } from '../utils';
import {
  createNamingContext,
  tailwind4NamingConfig,
  generateThemeDirective,
  buildDynamicThemeTokens,
  generateSemanticColorUtilities,
} from '../../utils';
import { Transformer } from '../types';

export const transformToTailwindSassClass: Transformer = (
  collection: TokenCollection,
  useCombinatorialParsing: boolean,
  _config,
) => {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token: NonNullableStyleToken) => token.name);
  const namingContext = createNamingContext();
  const selectors = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

  let output = '/* Generated Tailwind-SCSS */';

  /**
   * @deprecated - This is a temporary fix to ensure the output is consistent with the previous version.
   */
  const formattedStyleTokens = convertToGeneratorTokens(selectors).sort((a, b) =>
    a.variantPath.localeCompare(b.variantPath),
  );

  /**
   * don't use a theme mapping for Tailwind-SCSS generation; themeMapping works only for Tailwind v4+, and sass variables aren't compatible with tailwind built-in utilities.
   */
  for (const { variantPath, tokens } of formattedStyleTokens) {
    const classesToApply = createTailwindClasses(tokens);

    if (classesToApply.length) {
      output += `\n@mixin ${variantPath} {\n  @apply ${classesToApply.join(' ')}; \n}\n`;
    }
  }

  return {
    result: output,
    warnings,
    errors,
  };
};

export const transformToTailwindLayerUtilityClassV4: Transformer = (
  collection: TokenCollection,
  useCombinatorialParsing: boolean,
  config,
) => {
  const { styleTokens, warnings, errors } = filterStyleTokens(collection);
  const groupedTokens = groupBy(styleTokens, (token) => token.name);
  const namingContext = createNamingContext(tailwind4NamingConfig);

  const selectors = convertVariantGroupBy(
    collection,
    groupedTokens,
    getStylePropertyAndValue,
    namingContext,
    useCombinatorialParsing,
  );

  /**
   * @deprecated - This is a temporary fix to ensure the output is consistent with the previous version.
   */
  const formattedStyleTokens = convertToGeneratorTokens(selectors).sort((a, b) =>
    a.variantPath.localeCompare(b.variantPath),
  );

  // Extract semantic colors for custom utilities (if enabled)
  let semanticColorTokens: VariableToken[] = [];
  const generateSemantics = config?.generateSemanticColorUtilities ?? true; // TODO: Remove this override once UI is updated

  if (generateSemantics) {
    semanticColorTokens = collection.tokens.filter(
      (token): token is VariableToken =>
        token.type === 'variable' &&
        token.primitiveRef !== undefined && // Semantic tokens have primitiveRef
        (token.property === 'color' || token.name.startsWith('color')),
    );
  }

  // Generate the @theme directive with all tokens (semantic colors remain in :root)
  const themeDirective = generateThemeDirective(collection, false); // Always include all colors in :root
  const variableTokens = collection.tokens.filter(
    (token): token is VariableToken => token.type === 'variable',
  );
  const dynamicThemeTokens = buildDynamicThemeTokens(variableTokens);
  let output = themeDirective; // Don't concatenate the object!

  // Generate custom semantic color utilities (before component utilities)
  if (generateSemantics && semanticColorTokens.length > 0) {
    output += generateSemanticColorUtilities(semanticColorTokens);
  }

  output += '\n\n/* Generated Tailwind Utilities */\n';

  for (const { variantPath, tokens } of formattedStyleTokens) {
    // Pass dynamic theme tokens to the generator
    const classesToApply = createTailwindClasses(tokens, dynamicThemeTokens);
    if (classesToApply.length) {
      output += `\n@utility ${variantPath} {\n  @apply ${classesToApply.join(' ')}; \n}\n`;
    }
  }

  return {
    result: output,
    warnings,
    errors,
  };
};
