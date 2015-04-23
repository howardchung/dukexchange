var helpers = {
  requireUser: function(req, res, next) {
    if (!req.user) {
      // TODO: Redirect to a more appropriate route and/or prompt to log in
      return res.redirect('/');
    }
    return next();
  }
};

module.exports = helpers;
