var router = require('express').Router();
var multiparty = require('multiparty');
var async = require('async');
var _ = require('underscore');
var requireUser = require('../lib/helpers').requireUser;
var attributes = require('../config/attributes/clothing.json');
var gm = require('gm').subClass({
  imageMagick: true
});
var chance = new(require('chance')).Chance();
var imageDirectory = process.env.IMAGE_DIRECTORY || './image';
module.exports = function(db) {
  var listings = db.get('listings');
  //create a new listing
  router.post('/', requireUser, function(req, res, next) {
    async.waterfall([
      function(cb) {
        var form = new multiparty.Form({
          uploadDir: '/tmp'
        });
        form.parse(req, function(err, fields, files) {
          cb(err, fields, files);
        });
      },
      function(fields, files, cb) {
        if (files) {
          var images = _.flatten(_.values(files));
          var resizeFuns = images.map(function(image) {
            var path = image.path;
            var rand = chance.string({
              length: 10,
              pool: 'abcdefghijklmnopqrstuvwxyz'
            });
            var newFilename = rand + '-' + image.originalFilename;
            // TODO: delete tmp image
            return function(cb) {
              gm(path)
                .resize(400)
                .write(imageDirectory + '/' + newFilename, function(e) {
                  cb(e, newFilename);
                });
            };
          });
          async.parallel(resizeFuns, function(e, filenames) {
            return cb(e, fields, filenames);
          });
        }
        else {
          cb(null, fields, null);
        }
      },
      function(fields, imgPaths, cb) {
        listings.insert({
          title: _.first(fields.title) || '',
          description: _.first(fields.description) || '',
          size: _.first(fields.size) || '',
          condition: _.first(fields.condition) || '',
          brand: _.first(fields.brand) || '',
          color: _.first(fields.color) || '',
          category: _.first(fields.category) || '',
          price: _.first(fields.price) || '',
          userId: req.user.id,
          images: imgPaths,
          createdAt: new Date()
        }, function(err, doc) {
          cb(err, doc);
        });
      },
    ], function(err, doc) {
      if (err) {
        return next(err);
      }
      return res.send('/listings/' + doc._id);
    });
  });
  router.get('/new', requireUser, function(req, res, next) {
    res.render('listings/new', {
      attributes: attributes
    });
  });
  router.get('/:listing_id/edit', requireUser, function(req, res, next) {
    listings.findOne({
      _id: req.params.listing_id
    }, function(err, listing) {
      if (listing.userId !== req.user.id) {
        res.redirect('/listings/' + listing._id);
      }
      res.render('listings/edit', {
        listing: listing,
        attributes: attributes
      });
    });
  });
  //edits an existing listing
  router.post('/:listing_id', requireUser, function(req, res, next) {
    async.waterfall([
      function(cb) {
        var form = new multiparty.Form();
        form.parse(req, function(err, fields, files) {
          cb(err, fields, files);
        });
      },
      function(fields, files, cb) {
        listings.findAndModify({
          _id: req.params.listing_id,
          userId: req.user.id
        }, {
          $set: {
            title: _.first(fields.title) || '',
            description: _.first(fields.description) || '',
            size: _.first(fields.size) || '',
            condition: _.first(fields.condition) || '',
            brand: _.first(fields.brand) || '',
            color: _.first(fields.color) || '',
            category: _.first(fields.category) || '',
            price: _.first(fields.price) || '',
          }
        }, function(err, listing) {
          cb(err, listing);
        });
      }
    ], function(err, listing) {
      if (err) {
        return next(err);
      }
      res.redirect('/listings/' + req.params.listing_id);
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
