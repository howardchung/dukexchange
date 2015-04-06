var express = require('express');
var session = require('cookie-session');
var app = express();
var moment = require('moment');
//TODO: refactor process.env to config
var imageDirectory = process.env.IMAGE_DIRECTORY || __dirname + '/image';
//TODO: move db code to own file
var db = require('monk')(process.env.MONGOLAB_URI || "mongodb://localhost/dukeexchange");
var users = db.get("users");
users.index('id', {
    unique: true
});
//for performance we will want to index other collections as well
var routes = require('./routes/routes');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
app.set('view engine', 'jade');
app.use('/public', express.static(__dirname + '/public'));
app.use("/images", express.static(imageDirectory));
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
// Middleware to include user on every response
app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});
app.use('/', routes(db));
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
//TODO: expire old listings/offers
//TODO: search
