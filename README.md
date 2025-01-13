## Bitovi Figma SCSS Plugin

This plugin generates SCSS variables and mixins from selected nodes in Figma.

### Features

- Extracts fill colors from selected nodes.
- Generates SCSS variables for each color.
- Handles text nodes to extract font colors.
- Outputs the generated SCSS code to the plugin UI.

## Development

Use `npm run dev` to run the webpack compiler in watch mode. 

### Local plugin
You will need to use Figma Desktop for this

1. In Figma, go to Plugins → Development → Import plugin from manifest…
2. Select the manifest.json file.
3. The plugin will now be available under Plugins → Development.
