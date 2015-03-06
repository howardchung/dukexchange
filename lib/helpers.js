helpers = {
  requireUser: function(route) {
    return function(req, res, next) {
      if (!req.user) {
        // TODO: Redirect to a more appropriate route and/or prompt to log in
        return res.redirect('/');
      }
      return route();
    };
  }
};

module.exports = helpers;
