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
  ],
  resolve: {
    fallback: {
      fs: false,
      path: false,
      util: false,
      url: false,
      buffer: require.resolve('buffer'),
    },
  },
  mode: 'production',
};
