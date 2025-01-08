## Bitovi Figma SCSS Plugin

This plugin generates SCSS variables and mixins from selected nodes in Figma.

### Features

- Extracts fill colors from selected nodes.
- Generates SCSS variables for each color.
- Handles text nodes to extract font colors.
- Outputs the generated SCSS code to the plugin UI.

## Development

Use `npm run watch` to run the typescript compiler in watch mode. This will compile the code.ts file to code.js.

### Local plugin

  •	In Figma, go to Plugins → Development → Import plugin from manifest…
	•	Select the manifest.json file.
	•	The plugin will now be available under Plugins → Development.