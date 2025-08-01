# Instance Override SCSS Mixins

## Overview

This feature adds the ability for Eggstractor to generate SCSS mixins for component instances that include only override styles. Each instance gets its own mixin named after the instance, containing only the styles that differ from the main component.

## How It Works

1. **Instance Detection**: The plugin identifies all instance nodes in the design and links them to their main components.

2. **Override Comparison**: For each instance, the plugin compares the instance's styles with its main component's styles to identify overrides.

3. **Mixin Generation**: Each instance gets a dedicated SCSS mixin containing only the override styles.

## Example Output

Given a Button component with two instances:
- **Primary Button**: Red background (overrides blue)
- **Secondary Button**: Gray background and smaller border radius (overrides blue and 8px radius)

The generated SCSS will include:

```scss
// Generated SCSS Variables
$button-blue: #3366cc;
$button-red: #cc3333;
$button-gray: #e6e6e6;

// Generated SCSS Mixins
@mixin button-state-default {
  background: $button-blue;
  border: 1px solid #1a2d66;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 1rem;
  width: 7.5rem;
  height: 2.5rem;
}

// Generated Instance Mixins (Override Styles Only)
@mixin primary-button {
  background: $button-red;
  border: 2px solid #991a1a;
  border-radius: 0.75rem;
}

@mixin secondary-button {
  background: $button-gray;
  border: 1px solid #808080;
  border-radius: 0.25rem;
}
```

## Usage in SCSS

You can use these mixins in your SCSS files:

```scss
// Apply the base component styles
.button {
  @include button-state-default;
}

// Apply instance-specific overrides
.button--primary {
  @include button-state-default;
  @include primary-button;
}

.button--secondary {
  @include button-state-default;
  @include secondary-button;
}
```

## Benefits

1. **Override-Only Styles**: Instance mixins contain only the styles that differ from the component, keeping them lean.

2. **Consistent Naming**: Mixins are named after the instance names in Figma for easy identification.

3. **Component Set Support**: All instances of a component set get their own mixins, even if they have no overrides.

4. **Fallback Handling**: Instances without overrides still get mixins with helpful comments.

## Technical Implementation

- **Service**: `src/services/instance.service.ts` - Handles override detection and comparison
- **Transformer**: `src/transformers/scss.transformer.ts` - Enhanced with instance mixin generation
- **Integration**: Automatically included when using SCSS output format

## Requirements Fulfilled

✅ **Instance-named mixins**: Each instance gets a mixin named after the instance, not the component  
✅ **Override-only styles**: Mixins contain only styles that override the main component  
✅ **All instances included**: Every instance gets a mixin, even without overrides  
✅ **Component set support**: Works with component sets and variant properties
