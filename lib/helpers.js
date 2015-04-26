var flash = require('flash');

var helpers = {
  requireUser: function(req, res, next) {
    if (!req.user) {
      req.flash('info', 'You must log in to do that!');
      return res.redirect('/');
    }
    return next();
  }
};

module.exports = helpers;
