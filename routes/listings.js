var router = require('express').Router();
var multiparty = require('multiparty');
var async = require('async');
var _ = require('underscore');
var requireUser = require('../lib/helpers').requireUser;
var attributes = require('../config/attributes/clothing.json');
var env = require('../env');
var gm = require('gm').subClass({
  imageMagick: true
});
var chance = new(require('chance')).Chance();
var imageDirectory = env.IMAGE_DIRECTORY;
module.exports = function(db) {
  var listings = db.get('listings');
  var offers = db.get('offers');

  /**
   * Middleware for retrieving filtered listings based on the query parameters.
   * Also handles pagination.
   */
  var fetchFilteredListings = function(req, res, next) {
    async.waterfall([
      function(cb) {
        var query;
        var queryKeys = Object.keys(req.query);
        if (_.isEmpty(req.query) || (queryKeys.length === 1 && queryKeys[0] === 'after')) {
          query = {};
        } else {
          query = {
            $or: [
              {size: req.query.size},
              {condition: req.query.condition},
              {brand: req.query.brand},
              {color: req.query.color},
              {category: req.query.category}
            ]
          }
        }
        if (req.query.after) {
          query._id = {$lt: listings.id(req.query.after)};
        }
        listings.find(query, {
          sort: {
            _id: -1,
          },
          limit: 15
        }, function(err, listings) {
          cb(err, listings);
        });
      }
    ], function(err, listings) {
      if (err) {
        return next(err);
      }
      req.listings = listings;
      next();
    });
  }

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
              gm(path).resize(400).write(imageDirectory + '/' + newFilename, function(e) {
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
          user_id: req.user._id,
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

  router.get('/browse', [fetchFilteredListings], function(req, res, next) {
    return res.render('listings/browse', {
      listings: req.listings,
      attributes: attributes
    });
  });

  router.get('/browse.json', [fetchFilteredListings], function(req, res, next) {
    return res.json(_.map(req.listings, function(l) {
      return _.defaults({_id: l._id.toString()}, l);
    }));
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
      if (listing.user_id.toString() !== req.user._id.toString()) {
        res.redirect('/listings/' + listing._id);
      }
      res.render('listings/edit', {
        listing: listing,
        attributes: attributes
      });
    });
  });

  // deletes an existing listing
  router.post('/:listing_id/delete', requireUser, function(req, res, next) {
    async.waterfall([
      function(cb) {
        listings.remove({
          _id: req.params.listing_id,
          user_id: req.user._id
        }, function(err, numDeleted) {
          cb(err, numDeleted);
        });
      },
      function(numDeleted, cb) {
        if (numDeleted > 0) {
          offers.remove({
            listing_id: req.params.listing_id
          }, function(err) {
            cb(err);
          });
        } else {
          cb();
        }
      }
    ], function(err) {
      if (err) {
        return next(err);
      }
      req.flash('success', 'You successfully deleted your listing.');
      return res.redirect('/');
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
          user_id: req.user._id
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
      req.flash('success', 'You successfully edited your listing.');
      return res.send('/listings/' + listing._id);
    });
  });
  router.get('/:listing_id', function(req, res, next) {
    //listing owner can see emails of all offerers, up to user to contact and delete listing when item is sold
    async.waterfall([
      function(cb) {
        listings.findOne({
          _id: req.params.listing_id
        }, cb);
      },
      function(listing, cb) {
        db.get('offers').find({
          listing_id: req.params.listing_id
        }, function(err, docs) {
          cb(err, listing, docs);
        });
      },
      function(listing, offers, cb) {
        async.each(offers, function(offer, ecb) {
          db.get('users').findOne({_id: offer.user_id}, function(err, user) {
            //get email for each offer
            offer.email = user.emails[0].value;
            ecb(err);
          });
        }, function(err) {
          listing.offers = offers;
          cb(err, listing);
        });
      },
      function(listing, cb) {
        db.get('users').findOne({_id: listing.user_id}, function(err, user) {
          cb(err, listing, user);
        });
      }
    ], function(err, listing, listingUser) {
      if (err) {
        return next(err);
      }
      return res.render('listings/show', {
        listing: listing,
        listingUser: listingUser
      });
    });
  });
  return router;
};
