'use strict';

const path = require('path');

const webpack = require('webpack');

module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'webpack'),
    filename: 'index.js',
    library: 'HomeyLib',
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    // AIReviewer is Node-only (fs, child_process, tar CLI, openai/anthropic SDKs).
    // Ignore it entirely in the browser/RN bundle — consumers of that bundle
    // get `undefined` for `require('homey-lib').AIReviewer`, which is the
    // expected behavior for a server-side feature.
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/lib\/AIReviewer/,
    }),
  ],
  resolve: {
    fallback: {
      crypto: false,
      fs: false,
      path: false,
      util: false,
      url: false,
      buffer: require.resolve('buffer'),
    },
  },
  mode: 'production',
};
