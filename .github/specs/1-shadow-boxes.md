# Implementation Plan: Add Shadow-Box Effect Support

## Overview

Currently, Eggstractor doesn't support extracting shadow-box effects from Figma nodes. The system already supports shadow effects defined as **Effect Styles** (via `effect.service.ts`), but does not process shadows applied directly to individual nodes via `node.effects`.

This feature will add a new processor to extract box-shadow properties from `node.effects`, transform them into CSS/SCSS mixins or Tailwind utilities, and ensure proper handling when nodes have both border shadows (from INSIDE stroke alignment) and actual shadow effects.

**Key Requirements Based on Q&A:**

- Support variable bindings on effects
- Support only DROP_SHADOW and INNER_SHADOW (exclude LAYER_BLUR and BACKGROUND_BLUR)
- Filter out shadows with zero opacity
- Filter out invisible shadows (visible: false)
- Combine border shadows with actual shadows (not one or the other)
- Assume effect colors are literals (no variable resolution needed initially)
- Match existing test fixture patterns

**Architectural Decision:**

The Eggstractor architecture only allows ONE processor to output a given CSS property per node (enforced by `extractNodeToken` in `token.service.ts`). Since both the border processor and shadow processor need to output `box-shadow`, we use **Option A: Shadow processor detects INSIDE borders and combines them internally**.

Implementation approach:

1. **Type Update**: Add `effects` to VariableBindings interface
2. **Shadow Processor**: Creates box-shadow tokens, checks for INSIDE borders and merges them if present
3. **Border Processor**: Modified to skip box-shadow output if node has shadow effects (defers to shadow processor)
4. **Precedence**: When both exist, shadow processor handles everything; when only INSIDE border exists, border processor handles it

This approach requires no changes to the core token collection architecture and maintains backward compatibility.

## Current Architecture Context

- **Processors** extract properties from Figma nodes (located in `packages/figma/src/processors/`)
- **Transformers** convert extracted tokens into CSS, SCSS, or Tailwind output (located in `packages/figma/src/transformers/`)
- **Effect Service** already handles Effect Styles (predefined shadows) but not node-level effects
- **Border Processor** currently uses `box-shadow` for rendering INSIDE stroke alignment borders, which we must not conflict with

## Implementation Steps

### Step 1: Update Type Definitions

**What to do:**

- Add `effects?: VariableAlias | VariableAlias[];` to the `VariableBindings` interface in `packages/figma/src/types/processors.ts`
- This enables the processor to check for variable bindings on effects

**How to verify:**

- TypeScript compiles without errors
- VariableBindings interface includes effects property
- Matches pattern of other binding properties (fills, strokes, etc.)

**Key considerations:**

- Place it logically with other visual effect properties (near opacity)
- Follow same type pattern as other bindings: optional with single or array of VariableAlias
- This is required for Step 2 to work properly

### Step 2: Create Shadow Effect Processor

**What to do:**

- Create new file `packages/figma/src/processors/shadow.processor.ts`
- Implement `shadowProcessors` array following the StyleProcessor interface pattern
- Add processor with `property: 'box-shadow'` and `bindingKey: 'effects'`
- Extract DROP_SHADOW and INNER_SHADOW effects from `node.effects`
- **Critical**: Check if node has INSIDE stroke alignment - if yes, the shadow processor must combine border shadows with effect shadows
- Use helper function to detect and extract border shadow string (similar logic to border processor)
- Convert effects to CSS box-shadow format (matching pattern in `effect.service.ts`)
- Build final box-shadow: border shadows (if INSIDE), then effect shadows (comma-separated)

**How to verify:**

- Processor exports array matching `StyleProcessor[]` type
- Code compiles without TypeScript errors
- Processor structure matches existing processors (border, background, etc.)
- Handles both standalone shadows and combined border+shadow cases

**Key considerations:**

- Add type guard to check if node has `effects` property: `'effects' in node && Array.isArray(node.effects)`
- Check for variable bindings on effects first (check variableTokenMapByProperty for 'effects')
- Filter for shadow types only: `DROP_SHADOW` and `INNER_SHADOW` (exclude LAYER_BLUR and BACKGROUND_BLUR)
- Filter out shadows with zero opacity: `effect.color.a === 0` or `effect.color.a === undefined`
- Check `effect.visible !== false` to exclude hidden effects
- Handle multiple shadows (join with commas)
- Build shadow string: `[inset] offset-x offset-y blur-radius [spread-radius] color`
- Spread radius is optional - only include if defined: `if (effect.spread) parts.push(\`\${effect.spread}px\`);`
- Convert Figma RGBA values to CSS `rgba()` format
- **For INSIDE borders**: Detect if `strokeAlign === 'INSIDE'` and has strokes, then replicate border shadow logic from border processor and prepend to effect shadows
- Return `null` if no shadow effects found after filtering AND no INSIDE border

**Architecture note:**

- The system only allows ONE processor to output a given property per node (see `extractNodeToken` in `token.service.ts`)
- Border processor outputs `box-shadow` for INSIDE borders, shadow processor outputs `box-shadow` for effects
- Since we can't have both processors output the same property, the shadow processor MUST handle the merging internally
- This is **Option A** from the architectural analysis: Shadow processor detects INSIDE borders and combines them itself

### Step 3: Modify Border Processor to Skip box-shadow When Effects Present

**What to do:**

- Modify the border processor's `box-shadow` processor (in `packages/figma/src/processors/border.processor.ts`) to return `null` if the node has shadow effects
- Add check at the beginning: if node has `effects` array with visible DROP_SHADOW or INNER_SHADOW (with opacity > 0), return `null`
- This ensures shadow processor (which handles merging) takes over when both exist

**How to verify:**

- Border processor only outputs box-shadow for INSIDE borders when node has NO shadow effects
- When node has both INSIDE border and shadow effects, only shadow processor outputs box-shadow
- No duplicate box-shadow properties in token collection
- Border-only nodes still work correctly (regression test)

**Key considerations:**

- Add this check early in border processor's box-shadow process function (right after the strokeAlign check)
- Reuse the same filtering logic: `effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW'` and `effect.visible !== false` and opacity > 0
- This establishes clear precedence: shadow processor wins when both exist
- Maintains backward compatibility for nodes with only INSIDE borders
- Existing border tests should still pass (they don't have effects)

### Step 4: Integrate Shadow Processor into Processing Pipeline

**What to do:**

- Import `shadowProcessors` in `packages/figma/src/processors/index.ts`
- Add to `LAYOUT_PROCESSORS` array (after border processors)
- Ensure it's included for appropriate node types (FRAME, RECTANGLE, INSTANCE, etc.)

**How to verify:**

- `getProcessorsForNode` includes shadow processors for layout nodes
- Processor runs during token collection
- Console logs show shadow processing activity (if logging is enabled)

**Key considerations:**

- Add after border processors in array, though order doesn't matter since border processor now defers to shadow processor
- Include for same node types that support effects: FRAME, RECTANGLE, INSTANCE, ELLIPSE, COMPONENT, VECTOR, STAR, POLYGON
- Don't add to TEXT_PROCESSORS (text nodes don't typically have box-shadow effects)

### Step 5: Create Test Fixture for Shadow Effects

**What to do:**

- Create `packages/figma/src/tests/fixtures/figma-test-data_shadow-effects.json`
- Include test data with nodes that have:
  - Single DROP_SHADOW effect
  - Multiple shadow effects (multiple DROP_SHADOW)
  - INNER_SHADOW effect
  - Combination of DROP_SHADOW and INNER_SHADOW
  - Node with no effects (should return null)
  - Node with INSIDE stroke AND shadow effects (to test merging)
  - Node with only INSIDE stroke (to verify border processor still works)
  - Shadow with zero opacity (should be filtered out)
  - Shadow with `visible: false` (should be filtered out)

**How to verify:**

- JSON file matches structure of existing fixtures (check `figma-test-data_border-position.json` as reference)
- Includes all necessary Figma API properties
- Mock data represents realistic Figma shadow configurations
- Effects array properly structured with offset, radius, spread, color, type, visible properties

**Key considerations:**

- Study existing fixture files for structure (especially border fixtures)
- Include `effects` array with proper DropShadowEffect and InnerShadowEffect structures
- Include nodes with strokeAlign: 'INSIDE' and strokes for merging test
- Include effect properties: `offset: {x, y}`, `radius`, `spread` (optional), `color: {r, g, b, a}`, `type`, `visible`
- Include test case with zero opacity shadow (`color.a = 0`) - should be filtered out
- Include test case with invisible effect (`visible: false`)
- Follow exact structure and naming conventions from existing test fixtures
- Include proper node types (FRAME, RECTANGLE) that support effects

### Step 6: Write Unit Tests for Shadow Processor

**What to do:**

- Create `packages/figma/src/tests/processors/shadow-processors.test.ts`
- Follow test pattern from `border-processors.test.ts` and `text-processors.test.ts`
- Test cases:
  - Processes DROP_SHADOW correctly
  - Processes INNER_SHADOW correctly  
  - Processes multiple shadows correctly (joins with commas)
  - Returns null for nodes without effects
  - Filters out shadows with zero opacity
  - Filters out invisible shadows (`visible: false`)
  - Combines box-shadow with INSIDE stroke borders correctly (border shadows first, then effect shadows)
  - INSIDE borders without effects still work (regression test - should return null from shadow processor)
  - Handles optional spread radius (some shadows have it, some don't)
  - Generates correct snapshot output for template mode
  - Generates correct snapshot output for combinatorial mode

**How to verify:**

- All tests pass
- Snapshots generated in `__snapshots__` directory
- Coverage includes all code paths in shadow processor
- Zero opacity shadows are properly filtered in test output
- Invisible shadows are properly filtered in test output
- Combined border-shadow cases produce merged output with correct ordering

**Key considerations:**

- Use `createTestData` utility for fixture loading
- Use `collectTokens` to run full processing pipeline
- Use `transformToScss` to verify transformer output
- Use snapshot testing for output validation
- Test both template and combinatorial parsing modes
- Consider adding unit tests for the individual processor functions (e.g., shadow filtering, border detection)

### Step 7: Test Border Processor Regression

**What to do:**

- Run existing border processor tests to ensure no regressions
- Verify border processor's box-shadow logic still works for nodes without effects
- Confirm border processor now returns null for nodes with shadow effects

**How to verify:**

- All existing border tests pass
- Border-only fixtures still produce correct box-shadow output
- New behavior (skipping when effects present) works correctly

**Key considerations:**

- Existing test fixtures don't have effects, so they should still pass
- May need to add a new test case showing border processor returns null when effects exist
- This validates Step 3 (border processor modification) works correctly

### Step 8: Verify Transformer Compatibility

**What to do:**

- Run existing tests to ensure transformers handle box-shadow tokens correctly
- Check SCSS transformer (`transformToScss`)
- Check CSS transformer
- Check Tailwind transformers (scss and v4)
- Verify variable naming for shadows
- Verify mixin generation for shadows

**How to verify:**

- All transformer tests still pass
- Generated SCSS includes box-shadow mixins
- Generated Tailwind includes shadow utilities
- No duplicate properties in output
- Shadow variables properly scoped and named

**Key considerations:**

- Transformers already support box-shadow from Effect Styles
- New tokens should be processed identically
- Check `generateTailwindBoxShadowClass` in `transformers/tailwind/generators.ts`
- Check rem conversion doesn't apply to shadow values (should remain px)
- Verify shadow values aren't treated as colors

### Step 9: Integration Testing

**What to do:**

- Test complete flow: Figma node → processor → transformer → output
- Create test Figma file with shadow effects applied to nodes
- Run Eggstractor and verify output
- Test different output formats (CSS, SCSS, Tailwind)
- Test with both parsing modes (template and combinatorial)

**How to verify:**

- Generated stylesheets include box-shadow properties
- Shadow values match Figma design
- No conflicts with border shadows
- Output is syntactically valid CSS/SCSS/Tailwind

**Key considerations:**

- May require manual testing with actual Figma plugin
- Test in Figma plugin visualizer (`packages/figma/visualizer/`)
- Verify shadow appearance matches Figma design visually
- Test edge cases: transparent shadows, zero-offset shadows, very large blur radius

### Step 10: Update Documentation

**What to do:**

- Update `docs/DOCS.md` to document shadow processor
- Add to processor types section
- Include examples of shadow extraction
- Update `CONTRIBUTING.md` if needed
- Add code comments explaining conflict avoidance logic

**How to verify:**

- Documentation clearly explains shadow feature
- Examples are accurate and helpful
- No broken links or formatting issues

**Key considerations:**

- Document the border-shadow conflict resolution (how they merge)
- Explain when shadows are extracted vs skipped (zero opacity, invisible)
- Show example input (Figma effects) and output (CSS)
- Update processor categories section in DOCS.md
- Document which effect types are supported (DROP_SHADOW, INNER_SHADOW) and which are excluded (LAYER_BLUR, BACKGROUND_BLUR)

## Implementation Summary

This plan implements shadow-box effect support through **10 sequential steps**:

1. **Type Definition** - Add effects to VariableBindings
2. **Shadow Processor** - Create processor that handles effects and merges with INSIDE borders
3. **Border Processor Update** - Modify to defer to shadow processor when effects exist
4. **Integration** - Add shadow processor to processing pipeline
5. **Test Fixture** - Create comprehensive test data
6. **Unit Tests** - Test all shadow processor functionality
7. **Regression Tests** - Ensure border processor still works correctly
8. **Transformer Tests** - Verify all output formats work
9. **Integration Tests** - End-to-end testing
10. **Documentation** - Update all relevant docs

**Critical Architectural Points:**

- Shadow processor uses self-contained merging (no architecture changes needed)
- Border processor defers to shadow processor when effects present
- Maintains backward compatibility for INSIDE borders without effects
- Follows existing processor patterns and conventions

