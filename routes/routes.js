var listingRoutes = require('./listings');
var router = require('express').Router();
var async = require('async');
var multiparty = require('multiparty');
var sendgrid = require('sendgrid')(process.env.SENDGRID_USER, process.env.SENDGRID_KEY);
var _ = require('underscore');

module.exports = function(db) {
  var listings = db.get("listings");
  var reviews = db.get("reviews");
  var users = db.get("users");
  var offers = db.get("offers");
  router.get('/', function(req, res, next) {
    //why does this need to be waterfalled?
    async.waterfall([
      function(cb) {
        listings.find({}, {
          sort: {
            _id: -1
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
      res.render("index", {
        listings: listings
      });
    });
  });
  router.use('/listings', listingRoutes(db));
  //public user profiles
  router.get('/users/:user_id', function(req, res, next) {
    async.waterfall([
      function(cb) {
        users.findOne({
          _id: req.params.user_id
        }, cb);
      },
      function(user, cb) {
        offers.find({
          user_id: user._id
        }, function(err, offers) {
          if (err) {
            return cb(err);
          }
          //get the offers this user has made
          async.each(offers, function(offer, cb) {
            listings.findOne({
              _id: offer.listing_id
            }, function(err, l) {
              if (err){
                return cb(err);
              }
              //get listing name for each
              offer.title = l.title;
              cb(err);
            });
          }, function(err) {
            if (err) {
              return cb(err);
            }
            user.madeOffers = offers;
            cb(err, user);
          });
        });
      }
    ],
    function(err, user) {
      res.render("user", {
        profileUser: user
      });
    });
  });
  router.post("/offers", function(req, res, next) {
    if (!res.locals.user){
      //not logged in
      return next("not logged in");
    }
    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {
      if (err) {
        return next(err);
      }
      //offers are stored in their own collection
      //listing pages embed an offer form that prepopulates listing_id
      //offers get created on POST /offers
      //get listing id/offer value from POST body
      //user id autofilled by currently logged in user
      //convert offer value to Number field
      //user id
      //listing id
      //offer value
      console.log(fields);
      console.log(files);
      async.waterfall([
        // Create offer
        function(cb) {
          offers.insert({
            user_id: res.locals.user._id,
            value: Number(fields.value[0]),
            message: fields.message[0],
            listing_id: fields.listing_id[0],
            date: new Date()
          }, function(err, offer) {
            return cb(err, offer);
          });
        },
        // Retrieve listing and listing's user
        function(offer, wcb) {
          async.parallel({
            user: function(cb) {
              users.findOne({
                _id: offer.user_id
              }, cb);
            },
            listing: function(cb) {
              listings.findOne({
                _id: offer.listing_id
              }, cb);
            }
          }, function(err, results) {
            wcb(err, offer, results.user, results.listing);
          });
        },
        // Send email
        function(offer, user, listing, cb) {
          var template = _.template("Hi <%= name %>,\n\nYou've received an offer on <%= title %> from <%= offerer %>. \n\n$<%= value %>\n\nTheir message:\r\n<%= message %>\n\nYou can reply to this email to send this person an email to their email address.\n\n--\n\nDuke Exchange");
          sendgrid.send({
            from: res.locals.user.emails[0].value,
            to: user.emails[0].value,
            subject: '[Duke Exchange] New Message on "' + listing.title + '"',
            text: template({
              name: user.displayName,
              title: listing.title,
              value: offer.value,
              message: offer.message, // Need to escape this if using in html
              offerer: res.locals.user.displayName
            })
          }, function(err) {
            cb(err, listing);
          });
        }
      ], function(err, listing) {
        if (err) {
          return next(err);
        }
        res.redirect('/listings/' + listing._id);
      });
    });
  });
  //todo reviews
  router.post("/reviews", function(req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {
      if (err) {
        return next(err);
      }
      //reviewer id
      //reviewee id
      //rating
      //comment
      console.log(fields);
      console.log(files);
    });
  });
  return router;
};
