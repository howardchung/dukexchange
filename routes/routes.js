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
    users.findOne({
      _id: req.params.user_id
    }, function(err, user) {
      if (err) {
        return next(err);
      }
      //TODO: user pages should display that user's listings
      //also get the offers on those listings
      //also get the offers this user has made
      //let owner delete the listing at will?  no feedback cycle for offerers in that case
      //listing owner can see emails of all offerers, up to user to contact and delete listing when item is sold
      //offers made by this user
      //TODO: denormalize!  store offers as an array within each listing
      //offers have no meaning without a listing
      //to get a user's outstanding offers, need to do listings.offers.user_id
      //might need an index on this field
      //if this were SQL we'd use separate tables and join
      offers.find({
        user_id: user._id
      }, function(err, docs) {
        res.locals.user.madeOffers = docs;
        //TODO get email for each offer
        res.render("user");
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
