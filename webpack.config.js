var path = require('path');
module.exports = {
  resolve: {
    root: [
      path.resolve(__dirname, './src/js'),
      path.resolve(__dirname, './src/bower_components')
    ]
  },
  entry: {
    'listing-form': './src/js/listing-form.js',
  },
  output: {
    filename: '[name].js',
  },
};
