# Build Config Style Guide

## Webpack Dual Entry Configuration

Webpack config must handle both main thread and UI thread builds:

```javascript
module.exports = (env, argv) => ({
  entry: {
    ui: './src/ui.ts',    // UI thread entry
    code: './src/code.ts', // Main thread entry
  },
});
```

## TypeScript Configuration Separation

Use separate TypeScript configs for different contexts:

- `tsconfig.json`: Main thread (Figma API access)
- `ui.tsconfig.json`: UI thread (DOM access)

```javascript
// Webpack ts-loader configuration
{
  test: /\.tsx?$/,
  use: {
    loader: 'ts-loader',
    options: {
      configFile: 'ui.tsconfig.json',  // UI-specific config
    },
  },
}
```

## CSS Processing Pipeline

CSS processing uses MiniCssExtractPlugin with inline integration:

```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlInlineCssPlugin = require('html-inline-css-webpack-plugin').default;

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlInlineCssPlugin(),
  ],
};
```

## Environment-Based Optimization

Different optimization strategies for development vs production:

```javascript
module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  devtool: argv.mode === 'production' ? false : 'inline-source-map',
});
```

## HTML Template Processing

HTML templates are processed and inlined for plugin distribution:

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');

new HtmlWebpackPlugin({
  template: './src/ui.html',
  filename: 'ui.html',
  inject: false,
}),
new HtmlInlineScriptPlugin()
```

## ESLint Multi-Config Support

ESLint supports both main and UI TypeScript configs:

```json
{
  "parserOptions": {
    "project": [
      "./tsconfig.json",
      "./ui.tsconfig.json"
    ]
  }
}
```

## Target Environment Specification

TypeScript targets specific ES version for Figma compatibility:

```json
{
  "compilerOptions": {
    "target": "es2021",
    "lib": ["es2021"]
  }
}
```

## Figma Plugin Type Integration

Include Figma plugin types in TypeScript configuration:

```json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types", "./node_modules/@figma"]
  }
}
```
