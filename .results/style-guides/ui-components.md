# UI Components Style Guide

## HTML Structure Convention

UI components use semantic HTML with descriptive class names:

```html
<div class="container">
  <div class="form-group">
    <label for="githubToken">GitHub Token:</label>
    <input type="password" id="githubToken" placeholder="Github PAT token" />
  </div>
</div>
```

## Form Input Pattern

All form inputs follow consistent labeling and placeholder patterns:

```html
<div class="form-group">
  <label for="inputId">Descriptive Label:</label>
  <input type="text" id="inputId" placeholder="e.g., example value" />
</div>
```

## Button Container Structure

Buttons are wrapped in containers to support loading states:

```html
<div class="button-container">
  <button id="generateBtn" class="button">Generate Styles</button>
  <div id="spinner" class="spinner hidden"></div>
</div>
```

## Dynamic Element Visibility

Use inline styles for dynamic show/hide behavior:

```html
<div id="devControls" style="display: none; margin-bottom: 10px">
  <!-- Development-only controls -->
</div>

<button id="exportTestDataBtn" class="button" style="display: none;">
  Export Test Data
</button>
```

## Loading State Implementation

Implement loading states with spinner elements:

```html
<div id="spinner" class="spinner hidden"></div>
```

## Status Message Display

Include dedicated status message containers:

```html
<span id="status"></span>
```

## Code Display Structure

Use dedicated containers for syntax-highlighted code output:

```html
<div id="output">
  <pre><code id="generatedCode" class="language-scss"></code></pre>
</div>
```

## Select Option Values

Use descriptive values that match transformer format parameters:

```html
<select id="formatSelect">
  <option value="scss">SCSS</option>
  <option value="tailwind-scss">(v3) Tailwind-SCSS</option>
  <option value="tailwind-v4">(v4) Tailwind Layer Utilities</option>
</select>
```
