/**
 * Defines what should be included in the generated output.
 *
 * - `variables`: Only Figma variables (primitives, semantics, effects) - no node traversal
 * - `components`: Only component utilities/mixins from traversed nodes + semantic color utilities - no theme
 * - `all`: Everything (current behavior) - variables, theme, and component utilities
 */
export type OutputMode = 'variables' | 'components' | 'all';
