# Eggstractor

<img align="left" src="img/eggstractor.png" height="80px" style="margin-right: 20px;">

This plugin generates SCSS variables and mixins from Figma, it also enables you to create a new branch, commit, and push your changes to GitHub.

<br>

## Features

- Extracts colors, background colors, padding, margin, font size, line height, font weight, opacity, and more from current page.
- Generates SCSS variables for each color.
- Handles text nodes to extract font colors.
- Outputs the generated SCSS code to the plugin UI.

## Development

Use `npm run dev` to run the webpack compiler in watch mode. 

### Local plugin
You will need to use Figma Desktop for this

1. Run `npm run dev` or `npm run build` to build the plugin
2. In Figma, go to Plugins → Development → Import plugin from manifest…
3. Select the manifest.json file.
4. The plugin will now be available under Plugins → Development.
