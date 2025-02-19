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

Use `npm run dev` to run the webpack compiler in watch mode. 

### Local plugin
You will need to use Figma Desktop for this

1. Run `npm run dev` or `npm run build` to build the plugin
2. In Figma, go to Plugins → Development → Import plugin from manifest…
3. Select the manifest.json file.
4. The plugin will now be available under Plugins → Development.

### Local visualizer
This is to view the generated CSS in a browser.

1. Run `npm run start:server` to start the local server
2. Open `http://localhost:3000` in your browser

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## Documentation

For detailed documentation about how to use Eggstractor, please see our [Documentation](docs/DOCS.md).
For general-purpose information on getting started with using Eggstractor, including a step-by-step guide to a working demo, see our [Getting Started Guide](https://bitovi.atlassian.net/wiki/spaces/Eggstractor/overview).

