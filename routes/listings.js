var router = require('express').Router();
var multiparty = require('multiparty');
var async = require('async');
var _ = require('underscore');

module.exports = function(db) {
  var listings = db.get('listings');

  router.post('/', function(req, res, next) {
    var form = new multiparty.Form();
    async.waterfall([
      function(cb) {
      form.parse(req, function(err, fields, files) {
        cb(err, fields, files);
      });
    },
    function(fields, files, cb) {
      listings.insert({
        title: _.first(fields.title) || '',
        description: _.first(fields.description) || '',
        size: _.first(fields.size) || '',
        condition: _.first(fields.condition) || '',
        brand: _.first(fields.brand) || '',
        color: _.first(fields.color) || '',
      }, function(err, doc) {
        cb(err, doc);
      });
    },
    ], function(err, doc) {
      if (err) {
        return next(err);
      }
      return res.redirect('/listings/' + doc._id);
    });
  });

  router.get('/new', function(req, res, next) {
    res.render('listings/new', {
    });
  });

  router.get('/:listing_id', function(req, res, next) {
    listings.findOne({
      _id: req.params.listing_id
    }, function(err, l) {
      if (err) {
        return next(err);
      }
      res.render('listings/show', {
        listing: l
      });
    });
  });

  return router;
};
