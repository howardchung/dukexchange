var lorem = require('lorem-ipsum');
var env = require('../../env');
var db = require('monk')(env.MONGOLAB_URI);
var _ = require('underscore');
var async = require('async');

var listings = db.get('listings');
var data = _.times(10, function(n) {
  return {
    title: lorem({
      count: 3,
      units: 'words',
    }) + ' ' + n,
    createdAt: new Date(),
    images: []
  };
});

async.parallel(data.map(function(d) {
  return function(cb) {
    listings.insert(d, cb);
  };
}), function(err, res) {
  if (err) {
    console.log(err);
    process.exit(1);
    return;
  }
  process.exit(0);
});
