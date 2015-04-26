var $ = require('jquery');

module.exports = function(el) {
  $(el).on('submit', function(e) {
    return confirm('Are you sure?');
  });
};
