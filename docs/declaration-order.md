# Tailwind CSS `@apply` Ordering Behavior and Exceptions

When using Tailwind CSS v4 and its `@apply` directive — especially in combination with `@utility` blocks — it's important to understand how **utility resolution order affects the final output**, and why it may not align with your written `@apply` sequence.

This document outlines an observed exception when combining utilities using `@apply`.

---

## Base Case: Inline Utility Order

```css
@utility my-util {
  @apply p-2 p-1;
}
```

**Expected**: padding from `p-1` is overridden by `p-2`

**Actual**: The final output is:

```css
.my-util {
  padding: calc(var(--spacing) * 1);
  padding: calc(var(--spacing) * 2);
}
```

The browser honors the **last** declaration (`p-2`), which is consistent with CSS rules.

**Conclusion**: When using `@apply` with multiple Tailwind utilities in a single block, the output will include **all expanded declarations**, with order determined by Tailwind’s internal plugin ordering — **not necessarily the order you wrote them**.

---

## Exception: Composed Utilities

```css
@utility foo {
  @apply p-1;
}

@utility bar {
  @apply p-2;
}

.foo-bar {
  @apply foo bar;
}

.bar-foo {
  @apply bar foo;
}
```

**Expected**:

* `.foo-bar` → should resolve to `p-2`
* `.bar-foo` → should resolve to `p-1`

**Actual**:

```css
.bar-foo,
.foo-bar {
  padding: calc(var(--spacing) * 2);
  padding: calc(var(--spacing) * 1);
}
```

Despite the different ordering in source, both `.foo-bar` and `.bar-foo` expand to identical declarations — with `p-2` appearing first, followed by `p-1`. This means the browser applies the **smaller padding**, due to CSS’s last-rule-wins behavior.

**Unexpected Behavior**:
Even though the application order in code differs (`foo bar` vs. `bar foo`), Tailwind flattens and merges utility blocks in a normalized way. This leads to both classes sharing the same output — and potentially conflicting logic.

---

## Tailwind-SCSS Mixins (Tailwind v3)

When using custom SCSS mixins that call Tailwind utility classes — such as those generated from a Tailwind theme mapping — the resulting CSS honors **the exact order** the mixins were applied.

Example:

```scss
@mixin spacing-small { padding: 0.25rem; }
@mixin spacing-large { padding: 1rem; }

.component {
  @include spacing-small;
  @include spacing-large;
}
```

**Output:**

```css
.component {
  padding: 0.25rem;
  padding: 1rem;
}
```

Unlike `@apply`, Sass mixins preserve declaration order strictly, which means your final CSS output will follow the exact sequence you've written — including any overrides or cascading declarations.

**Conclusion**:

Tailwind-SCSS integrations give you precise control over output order, which makes them ideal for theme token application, overrides, or deterministic builds.

---

## ⚠️ Key Takeaways

* `@apply` does not guarantee preservation of order
* When combining utility classes (`@apply foo bar`), the inner `@utility` blocks are expanded independently
* Final ordering is affected by internal plugin and layer resolution order, **not the lexical order in your file**
* To ensure predictable results, avoid conflicting utilities within composed classes (e.g. multiple `p-*` in one chain)

---

## Recommendation

* Prefer a single padding utility per composition
* Avoid reapplying conflicting utilities through composed classes
* If deterministic order matters, write raw CSS or use `@layer utilities` instead of `@apply`

```css
@layer utilities {
  .foo-bar {
    padding: calc(var(--spacing) * 2);
  }
}
```

---

## Further Consideration

Consider building a static analysis step that flags multiple conflicting utilities in `@apply` chains, or writing composed utilities that deliberately avoid overlaps to keep behavior predictable.
