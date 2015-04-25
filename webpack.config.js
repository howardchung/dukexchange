var path = require('path');
var webpack = require('webpack');
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;

module.exports = {
  resolve: {
    root: [
      path.resolve(__dirname, './src/js'),
      path.resolve(__dirname, './src/node_modules')
    ]
  },
  module: {
    loaders: [
      {
        test: /\.jsx$/,
        loader: 'jsx-loader'
      }
    ]
  },
  entry: {
    'listing-form': './src/js/listing-form.js',
    'browse': './src/js/browse.js',
    'index': './src/js/index.js'
  },
  output: {
    filename: '[name].js',
  },
  plugins: [
    new CommonsChunkPlugin('grid-commons.js', ['browse', 'index'])
  ]
};
