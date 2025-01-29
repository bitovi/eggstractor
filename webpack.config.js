const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlInlineCssPlugin = require('html-inline-css-webpack-plugin').default;
const path = require('path');

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  devtool: argv.mode === 'production' ? false : 'inline-source-map',
  entry: {
    ui: ['./src/ui.ts', './src/ui.css'],
    code: './src/code.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'ui.tsconfig.json'
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ],
  },
  resolve: { extensions: ['.tsx', '.ts', '.js', '.css'] },
  output: {
    filename: (pathData) => {
      return pathData.chunk.name === 'code' ? 'code.js' : '[name].[contenthash].js';
    },
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: './src/ui.html',
      filename: 'ui.html',
      chunks: ['ui'],
    }),
    new HtmlInlineCssPlugin({
      replace: {
        removeTarget: true
      }
    }),
    new HtmlInlineScriptPlugin({
      htmlMatchPattern: [/ui.html/],
      scriptMatchPattern: [/.js$/],
    }),
  ],
}); 