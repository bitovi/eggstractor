# Toggle Page Name in Utility/Mixin Names

## Overview

Eggstractor currently outputs the page name from a Figma design document in all generated utility/mixin names. For example:

```text
button-page-button-large-primary
button-page-button-layer-default-false
```

In many cases, the page name is redundant and makes the output overly verbose. This feature will add a toggle in the UI to allow users to control whether the page name is included in the generated output.

**Jira Ticket:** [EGG-77](https://bitovi.atlassian.net/browse/EGG-77)

## Current State

### How Naming Works Today

1. **NamingContext** (`packages/figma/src/utils/create-naming-context/`) handles name generation
   - `NamingContextConfig` interface already has an `includePageInPath` property (boolean, optional)
   - Default configuration sets `includePageInPath: true` in `defaultContextConfig`
   - When `true`: includes all path segments (including page)
   - When `false`: excludes the first path segment (the page) via `pathSegments.slice(1)`

2. **Transformers** create naming contexts and generate output
   - `scss.transformer.ts` - Creates default naming context (line 361)
   - `css.transformer.ts` - Creates default naming context (line 181)
   - `tailwind/index.ts` - Creates default naming context (line 83) and Tailwind 4-specific context (line 210)

3. **Main Thread** (`packages/figma/src/index.ts`) orchestrates the generation pipeline
   - Receives configuration from UI via `MessageToMainThreadPayload`
   - Currently handles: `format`, `useCombinatorialParsing`, `generateSemanticColorUtilities`, `outputMode`
   - Passes config to transformers through `transformTokensToStylesheet()`

4. **UI State** (`packages/ui/src/app/context/ConfigContext/`)
   - `ConfigContext` manages all configuration state
   - Saves config to Figma client storage via `save-config` message
   - Currently manages 8 config properties (does not include `includePageInPath`)

## Design Decisions

Based on requirements discussion:

- **Default Value:** `true` (include page name) - maintains backward compatibility
- **Storage:** Part of the GitHub config (same as other settings), not a per-user local preference
- **Format Support:** Available for all stylesheet formats (SCSS, CSS, Tailwind 3+SCSS, Tailwind 4)
- **Documentation:** Hint text in the UI toggle should include an example; no additional documentation required

## Implementation Plan

### Step 1: Add `includePageInPath` to Type Definitions

**Files to modify:**

- `packages/common/src/types/github-config.ts`
- `packages/common/src/types/message-to-main-thread-payload.ts`

**Changes:**

1. Add `includePageInPath: boolean` to `GithubConfig` interface
2. Add `includePageInPath: boolean` to `SaveConfigPayload` interface
3. Add `includePageInPath: boolean` to `GenerateStylesPayload` interface

**How to verify:**

- TypeScript compilation passes without errors
- Existing code continues to work with the new optional property

---

### Step 2: Update ConfigContext in UI

**Files to modify:**

- `packages/ui/src/app/context/ConfigContext/ConfigContext.tsx`

**Changes:**

1. Add `includePageInPath: boolean` to the `Config` interface
2. Add `includePageInPath?: boolean` to `ConfigProps` interface
3. Add state management: `useState<boolean>(pIncludePageInPath ?? true)` (default: true)
4. Include `includePageInPath` in the `saveConfig` function logic
5. Add it to the `messageMainThread` payload in `saveConfig`
6. Include `includePageInPath` in the `useMemo` dependencies array
7. Include `includePageInPath` in the context value returned

**How to verify:**

- UI compiles without TypeScript errors
- Context provides the new property to consuming components
- Opening the Setup page doesn't break existing functionality

---

### Step 3: Add Toggle to Setup UI

**Files to modify:**

- `packages/ui/src/app/routes/Setup/Setup.tsx`

**Changes:**

1. Create a new constant for the toggle options:

   ```tsx
   export const INCLUDE_PAGE_IN_PATH_OPTIONS: ButtonGroupOption<boolean>[] = [
     { value: true, label: 'Yes' },
     { value: false, label: 'No' },
   ];
   ```

2. Destructure `includePageInPath` from `useConfig()` hook
3. Add state: `useState(initialIncludePageInPath)`
4. Include `includePageInPath` in the `saveConfig()` call within `onSubmit`
5. Add a `<ButtonGroup>` component in the form (suggested placement: after "Output grouping" and before the bottom-sheet):

   ```tsx
   <div>
     <ButtonGroup
       label="Include page name in utilities"
       value={includePageInPath}
       onChange={setIncludePageInPath}
       options={INCLUDE_PAGE_IN_PATH_OPTIONS}
       hint="e.g., 'button-page-button-large' vs 'button-large'"
     ></ButtonGroup>
   </div>
   ```

**How to verify:**

- Setup page renders without errors
- Toggle appears with correct default value (Yes/true)
- Clicking toggle updates the local state
- "Save changes" successfully saves the new value
- Alert confirmation appears after save

---

### Step 4: Wire Configuration Through Main Thread

**Files to modify:**

- `packages/figma/src/index.ts`

**Changes:**

1. Update `generateStyles()` function signature to accept `includePageInPath: boolean`
2. Update `transformTokensToStylesheet()` function signature to accept `includePageInPath: boolean`
3. Pass `includePageInPath` through the transformer calls
4. In the `'generate-styles'` message handler, extract `msg.includePageInPath` and pass it to `generateStyles()`
5. In the `'save-config'` message handler, include `includePageInPath` in the `Github.saveGithubConfig()` call
6. In the `'load-config'` message handler, ensure `includePageInPath` is included in the returned config

**How to verify:**

- Main thread compiles without errors
- Configuration flows from UI → main thread → transformers
- Saved config persists and loads correctly on plugin restart

---

### Step 5: Update Transformer Signatures

**Files to modify:**

- `packages/figma/src/transformers/types/transformer.ts`
- `packages/figma/src/transformers/scss.transformer.ts`
- `packages/figma/src/transformers/css.transformer.ts`
- `packages/figma/src/transformers/tailwind/index.ts`

**Changes:**

1. **Update Transformer type** (`transformer.ts`):

   ```typescript
   export type Transformer = (
     tokens: TokenCollection,
     useCombinatorialParsing: boolean,
     generateSemanticColorUtilities?: boolean,
     outputMode?: OutputMode,
     includePageInPath?: boolean,
   ) => TransformerResult;
   ```

2. **Update each transformer function**:
   - Add `includePageInPath = true` parameter (with default)
   - Create naming context with config:

     ```typescript
     const namingContext = createNamingContext({
       includePageInPath,
     });
     ```

   - For Tailwind transformers, also update the Tailwind 4-specific context:

     ```typescript
     const namingContext = createNamingContext({
       ...tailwind4NamingConfig,
       includePageInPath,
     });
     ```

**Files and specific lines:**

- `scss.transformer.ts`: Function signature at line 211, context creation at line 361
- `css.transformer.ts`: Function signature at line 102, context creation at line 181
- `tailwind/index.ts`: `transformToTailwindSassClass` at line 30 with context at line 83; `transformToTailwindLayerUtilityClassV4` at line 172 with context at line 210

**How to verify:**

- All transformers compile without TypeScript errors
- Existing tests continue to pass (with default `includePageInPath = true`)
- No breaking changes to existing transformer behavior

---

### Step 6: Update Export Flow

**Files to modify:**

- `packages/ui/src/app/routes/Export/Export.tsx`
- Any other files that call `messageMainThread` with `type: 'generate-styles'`

**Changes:**

1. **Audit:** Search codebase for all calls to `messageMainThread` with `type: 'generate-styles'` to ensure all are updated
2. Destructure `includePageInPath` from `useConfig()` hook
3. Include `includePageInPath` in the `messageMainThread` payload for the `'generate-styles'` message

**How to verify:**

- Export page renders without errors
- "Generate" button triggers generation with the correct `includePageInPath` value
- Generated output reflects the user's toggle choice

---

### Step 7: Testing & Validation

**Create test scenarios:**

1. **Default Behavior (Page Included)**
   - Start fresh plugin
   - Verify default toggle is "Yes"
   - Generate styles
   - Verify output includes page name (e.g., `button-page-button-large`)

2. **Toggle to Exclude Page**
   - Change toggle to "No"
   - Save changes
   - Generate styles
   - Verify output excludes page name (e.g., `button-button-large` or just `button-large` depending on path depth)

3. **Persistence**
   - Set toggle to "No"
   - Save changes
   - Close and reopen plugin
   - Verify toggle loads as "No"
   - Verify generated output still excludes page name

4. **All Output Formats**
   - Test with format = "SCSS"
   - Test with format = "Tailwind 3 + SCSS"
   - Test with format = "Tailwind 4"
   - Test with format = "CSS" (if in dev mode)
   - Verify each format respects the `includePageInPath` setting

5. **Output Modes**
   - Test with outputMode = "variables"
   - Test with outputMode = "components"
   - Test with outputMode = "all"
   - Verify each mode respects the setting where applicable

6. **Edge Cases**
   - Test with single-level components (only page)
   - Test with deeply nested components
   - Test with special characters in page names
   - Test with duplicate component names across pages

**How to verify:**

- All scenarios produce expected output
- No console errors or warnings
- UI remains responsive
- Config persists correctly

---

### Step 8: Update Tests

**Files to add/modify:**

- Add tests to existing test files or create new ones as needed

**Test coverage needed:**

1. **Naming Context Tests** (`packages/figma/src/tests/utils/create-naming-context/`)
   - Verify path building with `includePageInPath: true` (existing behavior)
   - Verify path building with `includePageInPath: false`
   - Add test for different path depths (shallow vs deeply nested)
   - **Redundant Name Case:** Test where page name matches component name (e.g., page="buttons", component="button" → "buttons-button" vs "button")
   - **Non-Redundant Name Case:** Test where page name is distinct (e.g., page="forms", component="button" → "forms-button" vs "button") - verify excluding page doesn't cause confusion
   - **Test with default delimiters:** `includePageInPath: false` with CSS/SCSS default delimiters (pathSeparator: '-')
   - **Test with Tailwind v4 delimiters:** `includePageInPath: false` with Tailwind v4 delimiters (pathSeparator: '/')

2. **Transformer Tests**
   - Add test for SCSS transformer with `includePageInPath: false`
   - Add test for CSS transformer with `includePageInPath: false`
   - Add test for Tailwind SCSS transformer with `includePageInPath: false`
   - Add test for Tailwind v4 transformer with `includePageInPath: false`
   - Verify output format matches expected patterns for each format
   - Test that default behavior (no parameter) still includes page name

3. **Edge Case Tests**
   - Single-level path (only page, no nested components)
   - Deeply nested paths (page → section → subsection → component)
   - Special characters in page names
   - Duplicate component names across different pages (verify unique output)

4. **Integration Tests**
   - Mock the full config flow: UI → main thread → transformer → output
   - Verify config persistence and reload
   - Verify correct default values on fresh install

**How to verify:**

- All new tests pass
- All existing tests still pass
- Test coverage remains high
- Tests are descriptive and maintainable
- Redundant vs non-redundant naming cases are clearly documented in tests

---

## Implementation Checklist

- [ ] Step 1: Add type definitions (common package)
- [ ] Step 2: Update ConfigContext
- [ ] Step 3: Add UI toggle in Setup page
- [ ] Step 4: Wire through main thread
- [ ] Step 5: Update all transformers
- [ ] Step 6: Update Export flow
- [ ] Step 7: Manual testing of all scenarios
- [ ] Step 8: Add/update automated tests
- [ ] Documentation: Update README if needed
- [ ] Code review and merge

---

## Spec Review Notes

### ✅ Verified Against Codebase

1. **NamingContextConfig** - Confirmed `includePageInPath` exists as an optional boolean property (line 3 of `naming-context.utils.ts`)
2. **defaultContextConfig** - Confirmed default is `true` (line 23)
3. **tailwind4NamingConfig** - Confirmed it does NOT include `includePageInPath`, so spreading + adding is correct approach
4. **Config interface** - Currently has 8 properties (verified in `ConfigContext.tsx` lines 5-14)
5. **Transformer type** - Current signature at `transformer.ts` takes 4 parameters; adding 5th is straightforward
6. **Line numbers verified:**
   - `transformToScss` at line 211
   - `transformToCss` at line 102
   - `transformToTailwindSassClass` at line 30
   - `transformToTailwindLayerUtilityClassV4` at line 172
   - Naming context creation locations verified

### ⚠️ Potential Issues Identified

1. **Export.tsx missing `includePageInPath`** - The spec correctly identifies this needs to be added to the `generateStyles()` call in Export.tsx (line 32-38)

2. **Test coverage exists** - The existing test at lines 159-197 already tests `includePageInPath: false` with custom config. The spec correctly asks to expand this.

### ✅ No Contradictions Found

The spec is internally consistent.

### ✅ Minimal Redundancy

Steps are sequential and build on each other appropriately.

### ✅ Additional Confirmations

1. **Tailwind config spreading** - Confirmed: preserve spread behavior for `tailwind4NamingConfig` so custom delimiters are kept, then add `includePageInPath`
2. **Test coverage** - Confirmed: expanded tests should include `includePageInPath: false` with BOTH default (CSS/SCSS) delimiters AND Tailwind v4 delimiters
3. **Audit for other callers** - Confirmed: verify all places in UI that call `messageMainThread` with `type: 'generate-styles'` are updated (not just `Export.tsx`)
