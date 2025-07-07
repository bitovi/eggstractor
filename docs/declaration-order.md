# Tailwind CSS `@apply` Directive Ordering Issue

When using Tailwind CSS v4's `@apply` directive, **the order you write utilities does not determine the final CSS output**. Instead, Tailwind uses its own internal utility ordering system, which can produce unexpected results that contradict normal CSS cascade behavior.

This document demonstrates how `@apply` ignores written order and provides examples of the unexpected behavior.

---

## The Core Problem

When you use `@apply` with conflicting utilities, **Tailwind ignores your written order** and applies its own internal ordering logic.

### Example 1: Built-in Utility Conflict

```css
.test-many {
  @apply gap-2 gap-10 gap-1 m-2 m-10 m-1 w-2 w-10 w-1 p-2 p-10 p-1;
}
```

**Expected**: The utilities should appear in the order written, with `p-1` winning for padding, `w-1` winning for width, etc. (following normal CSS cascade)

**Actual**: The final output is:

```css
.test-many {
  margin: calc(var(--spacing) * 1);
  margin: calc(var(--spacing) * 2);
  margin: calc(var(--spacing) * 10);
  width: calc(var(--spacing) * 1);
  width: calc(var(--spacing) * 2);
  width: calc(var(--spacing) * 10);
  gap: calc(var(--spacing) * 1);
  gap: calc(var(--spacing) * 2);
  gap: calc(var(--spacing) * 10);
  padding: calc(var(--spacing) * 1);
  padding: calc(var(--spacing) * 2);
  padding: calc(var(--spacing) * 10);
}
```

**Result**: `m-10`, `w-10`, `gap-10`, and `p-10` win for their respective properties because **Tailwind sorts built-in utilities by CSS property using its internal ordering system, then numerically within each property (1, 2, 10)**. The complete disregard for written order means the largest numeric value wins for each property.

---

## Complex Case: Custom Utilities

When using `@apply` with custom `@utility` blocks, Tailwind uses **alphabetical ordering by utility name**.

```css
@utility foo {
  @apply p-1;
}

@utility bar {
  @apply p-2;
}

@utility baz {
  @apply p-3;
}

@utility boom {
  @apply p-4;
}

@utility bap {
  @apply p-5;
}

@utility bow {
  @apply p-6;
}

.test-custom {
  @apply foo bar baz boom bap bow;
}
```

**Expected**: `bow` should win (written last, following normal CSS cascade)

**Actual**: The final output is:

```css
.test-custom {
  padding: calc(var(--spacing) * 5);  /* bap */
  padding: calc(var(--spacing) * 2);  /* bar */
  padding: calc(var(--spacing) * 3);  /* baz */
  padding: calc(var(--spacing) * 4);  /* boom */
  padding: calc(var(--spacing) * 6);  /* bow */
  padding: calc(var(--spacing) * 1);  /* foo */
}
```

**Result**: `foo` (p-1) wins because **Tailwind sorts custom utilities alphabetically by utility name** (bap, bar, baz, boom, bow, foo). The utility `foo` appears last in alphabetical order, so `p-1` wins regardless of your written order.

---

## Key Takeaway

**The `@apply` directive uses two different ordering systems:**

1. **Built-in utilities**: Sorted by CSS property using Tailwind's internal ordering system, then numerically within each property (e.g., margin-1, margin-2, margin-10, then width-1, width-2, width-10, etc.)
2. **Custom utilities**: Sorted alphabetically by utility name (bar, foo, etc.)

**Both systems ignore the order you write utilities in your `@apply` directive**, breaking normal CSS cascade expectations.

---