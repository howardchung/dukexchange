var express = require('express');
var session = require('cookie-session');
var app = express();
var moment = require('moment');
var flash = require('flash');
var env = require('./env');
var attributes = require('./config/attributes/clothing.json');
var imageDirectory = env.IMAGE_DIRECTORY;
//TODO: move db code to own file
var db = require('monk')(env.MONGOLAB_URI);
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
    secret: env.SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.locals.moment = moment;
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    //locate user in db using google id
    //console.log(obj);
    users.findOne({
        id: obj.id
    }, function(err, user) {
        done(err, user);
    });
});
passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.ROOT_URL + "/auth/google/return"
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
// Middleware to include user and attributes on every response
app.use(function(req, res, next) {
    res.locals.user = req.user;
    res.locals.attributes = attributes;
    res.locals.rootUrl = env.ROOT_URL;
    next();
});
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
app.use('/', routes(db));
//error handlers
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
//start listening
var server = app.listen(env.PORT, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('[WEB] listening at http://%s:%s', host, port);
});
//TODO: expire old listings/offers
//TODO: search
