var dotenv = require('dotenv');
dotenv.load();
var express = require('express');
var session = require('cookie-session');
var app = express();
//var async = require('async');
var moment = require('moment');
var db = require('monk')(process.env.MONGOLAB_URI || "mongodb://localhost/dukeexchange");
var users = db.get("users");
users.index('id', {
    unique: true
});
var listings = db.get("listings");
var offers = db.get("offers");
var reviews = db.get("reviews");
var passport = require('passport');
var multiparty = require('multiparty');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
app.set('view engine', 'jade');
app.use('/public', express.static(__dirname + '/public'));
app.use(session({
    secret: process.env.SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());
app.locals.moment = moment;
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.ROOT_URL + "/auth/google/return"
}, function(token, tokenSecret, profile, done) {
    profile = profile._json;
    //put user in db
    users.update({
        id: profile.id
    }, {
        $set: profile
    }, {
        upsert: true
    }, function(err) {
        done(err, profile);
    });
}));
app.get('/auth/google', passport.authenticate('google', {
    scope: 'openid email'
}));
app.get('/auth/google/return', passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/'
}));
app.get('/logout', function(req, res) {
    req.logout();
    req.session = null;
    res.redirect('/');
});
app.get('/', function(req, res) {
    res.render("index", {
        user: req.user
    });
});
app.get('/users/:user_id', function(req, res, next) {
    users.findOne({
        id: req.params.user_id
    }, function(err, user) {
        if (err) {
            return next(err);
        }
        res.render("user", {
            user: user
        });
    });
});
app.get('/listings/:listing_id', function(req, res) {
    res.render("listing");
});
app.post("/listings", function(req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {
        if (err) {
            return next(err);
        }
        //size, condition, brand, color (all text?)
        //images
        console.log(fields);
        console.log(files);
    });
});
app.post("/offers", function(req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {
        if (err) {
            return next(err);
        }
        //offerer id
        //item id
        //offer
        console.log(fields);
        console.log(files);
    });
});
app.post("/reviews", function(req, res, next) {
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
app.use(function(req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    return next(err);
});
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err);
    next(err);
});
var server = app.listen(process.env.PORT || 5000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('[WEB] listening at http://%s:%s', host, port);
});
//todo expire old listings
//todo search
//todo listings
//todo reviews
//todo offers
//todo user pages
