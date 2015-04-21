var listingRoutes = require('./listings');
var router = require('express').Router();
var async = require('async');
var multiparty = require('multiparty');
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
            createdAt: -1
          }
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
          async.each(offers, function(offer, cb) {
            listings.findOne({
              _id: offer.listing_id
            }, function(err, l) {
              //get listing name for each
              offer.title = l.title;
              cb(err);
            });
          }, function(err) {
            if (err) {
              return cb(err);
            }
            cb(err, user, offers);
          });
        });
      }
    ],
    function(err, user, offers) {
      user.madeOffers = offers;
      res.render("user", {
        profileUser: user
      });
    });
  });
  router.post("/offers", function(req, res, next) {
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
      offers.insert({
        user_id: res.locals.user._id,
        value: Number(fields.value[0]),
        listing_id: fields.listing_id[0],
        date: new Date()
      }, function(err) {
        if (err) {
          return next(err);
        }
        //offer made, redirect the user to their home page?
        res.redirect("/users/" + res.locals.user._id);
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
