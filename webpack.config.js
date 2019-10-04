const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractWebpackPlugin = require('mini-css-extract-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');

const srcDir = path.resolve(__dirname, 'src');
const staticDir = path.resolve(__dirname, 'static');
const publicDir = path.resolve(__dirname, 'public');

module.exports = (_, argv) => {
  const isProd = argv.mode === 'production';
  const postCssPlugins = [require('autoprefixer')];

  return {
    entry: {
      app: path.resolve(srcDir, 'js', 'index.js'),
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
      new MiniCssExtractWebpackPlugin({
        filename: 'style-[hash].css',
      }),
      new CopyWebpackPlugin([{ from: staticDir, to: publicDir, ignore: ['.gitkeep'] }]),
    ],
    devServer: {
      hot: true,
      inline: true,
      contentBase: publicDir,
      port: 8000,
    },
  };
};
