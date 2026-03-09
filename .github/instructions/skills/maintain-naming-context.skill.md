# Skill: MaintainNamingContext

## Purpose

Provides an agent with the knowledge needed to safely modify, debug, or extend the naming context system without breaking name generation, deduplication, or delimiter configuration across output formats.

## Implementation

- File: `packages/figma/src/utils/create-naming-context/create-naming-context.utils.ts`
- File: `packages/figma/src/utils/create-naming-context/naming-context.utils.ts`
- Key export: `createNamingContext(partialConfig?) → NamingContext`

## Input

```typescript
partialConfig?: NamingContextConfig  // defaults to defaultContextConfig
```

## Output

```typescript
interface NamingContext {
  createName: (
    path: BaseToken['path'],
    propertyNameConflicts?: Record<string, string[]>,
    variants?: Record<string, string>,
  ) => string;
}
```

## Configuration Profiles

```typescript
// Default (CSS, SCSS)
{
  env: 'css',
  includePageInPath: true,
  delimiters: { pathSeparator: '-', afterComponentName: '-', variantEqualSign: '_', betweenVariants: '-' },
  duplicate: (name, count) => `${name}${count}`,
}

// Tailwind v4
{
  env: 'tailwind-v4',
  delimiters: { pathSeparator: '/', afterComponentName: '.', variantEqualSign: '_', betweenVariants: '.' },
}
```

## Key Behaviors

- `path: PathNode[]` → segment names joined by `pathSeparator`
- `variants: Record<string, string>` → appended as `variantName[variantEqualSign]variantValue` separated by `betweenVariants`
- `propertyNameConflicts` → used to detect when the same generated name would be produced by different tokens; `duplicate()` fn appends a count suffix
- `includePageInPath: false` → page-level `PathNode` excluded from generated name

## TODO

- [ ] Document which `path` nodes are included vs. excluded (page? frame? component set?)
- [ ] Document `propertyNameConflicts` structure — how is it populated before `createName()` is called?
- [ ] Document all characters that are sanitized and the sanitization rule applied to each segment
- [ ] Document `duplicate()` default behavior — count starts at what? 1 or 2?
- [ ] Document a full example: path + variants → generated name for CSS, SCSS, and Tailwind v4
