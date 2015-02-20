var dotenv = require('dotenv');
dotenv.load();
var express = require('express');
var bodyParser = require('body-parser');
var session = require('cookie-session');
var app = express();
var async = require('async');
var moment = require('moment');
var db = require('monk')(process.env.MONGOHQ_URL || "mongodb://localhost/dukeexchange");
var users = db.get("users");
var listings = db.get("listings");
var offers = db.get("offers");
var reviews = db.get("reviews");
var passport = require('passport');
users.index('id', {
    unique: true
});
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use('public', express.static(__dirname + '/public'));
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
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.ROOT_URL + "/auth/google/return"
}, function(token, tokenSecret, profile, done) {
    profile = profile._json;
    console.log(profile);
    done(null, profile);
}));
app.get('/auth/google', passport.authenticate('google', {
    scope: 'openid email'
}));
app.get('/auth/google/return', passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/'
}));
app.listen(process.env.PORT || 5000, function() {
    console.log("Node app is running");
});
app.get('/', function(req, res) {
    res.render("index");
});
app.get('/users/:user_id', function(req, res) {});
app.get('/listings/:listing_id', function(req, res) {});
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