# Eggstractor

<img align="left" src="img/eggstractor.png" height="80px" style="margin-right: 20px;">

This plugin generates SCSS variables and mixins from Figma, it also enables you to create a new branch, commit, and push your changes to GitHub.

<br>

## Features

- Extracts colors, background colors, padding, margin, font size, line height, font weight, opacity, and more from current page.
- Generates SCSS variables for each color.
- Handles text nodes to extract font colors.
- Outputs the generated SCSS code to the plugin UI.

<a href="https://www.youtube.com/watch?v=m7i-IexlZqQ">
  <img src="https://github.com/user-attachments/assets/3b8925f5-2fd5-47b3-8a7b-7763cec1eeec" alt="Eggstractor Introduction - Figma to CSS Mixins - Design and Development working in harmony" width="300">
</a>

## Development

Use `npm run dev` to build the plugin for development. The project uses Vite with React for the UI.

### Architecture

- **Build System**: Vite with React
- **UI Framework**: React with TypeScript
- **Main Thread**: TypeScript (`src/code.ts`)
- **UI Thread**: React app (`src/ui/`)
- **Output**: Single-file HTML with inlined CSS/JS for Figma compatibility

### Scripts

- `npm run dev` - Build for development
- `npm run dev:ui` - Start UI development server on localhost:5173
- `npm run build` - Build for production
- `npm run build:ui` - Build React UI
- `npm run build:code` - Build main thread code
- `npm run build:html` - Combine builds into Figma-compatible format

### Figma plugin

The [Eggstractor Figma plugin](https://www.figma.com/community/plugin/1464625803208186094/eggstractor) is available for free download in the Figma community, and includes a [demo file](https://www.figma.com/community/file/1472329589982734868) that syncs with a [demo GitHub repo](https://github.com/bitovi/eggstractor-demo).

### Local plugin

Alternately, you can build your own, local plugin for private use. You will need to use Figma Desktop for this.

1. Run `npm run dev` or `npm run build` to build the plugin
2. In Figma, go to Plugins → Development → Import plugin from manifest…
3. Select the manifest.json file.
4. The plugin will now be available under Plugins → Development.

### Local visualizer

This is to view the generated CSS in a browser.

1. Run `npm run visualizer` to start the local server
2. Open `http://localhost:3000` in your browser

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## Documentation

For detailed documentation about how to use Eggstractor, please see our [Documentation](docs/DOCS.md).

For general-purpose information on getting started with using Eggstractor, including a step-by-step guide to a working demo, see our [Getting Started Guide](https://bitovi.atlassian.net/wiki/spaces/Eggstractor/overview).

## About

<img align="right" src="img/bitovi.png" height="60px" style="margin-right: 20px;">

Eggstractor is an open source project by Bitovi.

Need some help?  
[Chat with us on Discord](https://discord.com/channels/1007137664606150746/1044404122004242433 'https://discord.com/channels/1007137664606150746/1044404122004242433') | [Send feature requests](https://github.com/bitovi/eggstractor/issues/new 'https://github.com/bitovi/eggstractor/issues/new') | [Email us](mailto:support@bitovi.com 'mailto:support@bitovi.com')

Need pros to help design & build your design system or app? [That’s us](https://www.bitovi.com/services/product-design-consulting 'https://www.bitovi.com/services/product-design-consulting')!

<br>
