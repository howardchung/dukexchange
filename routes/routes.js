var listingRoutes = require('./listings');
var router = require('express').Router();
var async = require('async');

module.exports = function(db) {
  var listings = db.get("listings");
  var reviews = db.get("reviews");
  var users = db.get("users");

  router.get('/', function(req, res, next) {
    async.waterfall([
      function(cb) {
        listings.find({}, {sort: {createdAt: -1}}, function(err, listings) {
          cb(err, listings);
        });
      }
    ],
      function(err, listings) {
        if (err) {
          return next(err);
        }
        res.render("index", {
          listings: listings
        });
      }
    );
  });

  router.use('/listings', listingRoutes(db));

  router.get('/users/:user_id', function(req, res, next) {
    users.findOne({
      id: req.params.user_id
    }, function(err, user) {
      if (err) {
        return next(err);
      }
      res.render("user", {
      });
    });
  });

  router.post("/offers", function(req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {
      if (err) {
        return next(err);
      }
      //user id
      //listing id
      //offer
      console.log(fields);
      console.log(files);
    });
  });

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
