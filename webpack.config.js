const fs = require('fs');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractWebpackPlugin = require('mini-css-extract-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');

const srcDir = path.resolve(__dirname, 'src');
const pagesDir = path.resolve(srcDir, 'pages');
const assetsDir = path.resolve(__dirname, 'assets');
const publicDir = path.resolve(__dirname, 'public');

const pages = fs
  .readdirSync(pagesDir, { withFileTypes: true })
  .filter((dirInfo) => dirInfo.isDirectory())
  .map(({ name }) => name);
const entries = pages.reduce((acc, key) => {
  return {
    ...acc,
    [key]: path.resolve(pagesDir, key, 'index.js'),
  };
}, {});
const htmlPlugins = pages.map((key) => {
  return new HtmlWebpackPlugin({
    template: path.resolve(pagesDir, key, 'index.html'),
    filename: `${key}.html`,
    inject: 'body',
    chunks: [key],
  });
});

module.exports = (_, argv) => {
  const isProd = argv.mode === 'production';
  const postCssPlugins = [require('autoprefixer')];

  return {
    entry: {
      ...entries,
      app: path.resolve(srcDir, 'index.js'),
    },
    output: {
      filename: '[name]-[hash].js',
      path: path.join(publicDir),
    },
    optimization: {
      splitChunks: {
        name: 'vendor',
        chunks: 'initial',
      },
      minimizer: [new TerserWebpackPlugin({}), new OptimizeCssAssetsWebpackPlugin({})],
    },
    devtool: isProd ? false : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: ['babel-loader'],
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: [{ loader: 'html-loader', options: { minimize: isProd } }],
        },
        {
          test: /\.s?(css)$/,
          exclude: /node_modules/,
          use: [
            MiniCssExtractWebpackPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                url: false,
                sourceMap: !isProd,
                importLoaders: 2,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: !isProd,
                plugins: postCssPlugins,
              },
            },
            {
              loader: 'sass-loader',
              options: {
                implementation: require('sass'),
                sourceMap: !isProd,
                sassOptions: {
                  includePaths: [path.resolve(srcDir, 'styles')],
                },
              },
            },
          ],
        },
        {
          test: /\.(svg|jpg|png|gif)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'images/',
                path: path.resolve(publicDir, 'images'),
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(srcDir, 'index.html'),
        filename: 'index.html',
      }),
      ...htmlPlugins,
      new MiniCssExtractWebpackPlugin({
        filename: 'style-[hash].css',
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: assetsDir, to: publicDir, globOptions: { dot: false, gitignore: false }, noErrorOnMissing: true },
        ],
      }),
    ],
    devServer: {
      hot: true,
      inline: true,
      contentBase: publicDir,
      port: 8000,
    },
  };
};
