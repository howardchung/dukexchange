var path = require('path');
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
    'browse': './src/js/browse.js'
  },
  output: {
    filename: '[name].js',
  },
};
