'use strict';

const config = require('config');

const register = function (server, options, next) {

  var validate = function (decoded, request, callback) {

    if (!decoded || !decoded.id) {
      return callback(null, false);
    }

    const User = server.plugins['hapi-mongo-models'].User;
    User.findById(decoded.id, (err, user) => {
      if (err || !user) {
        return callback(null, false);
      }

      callback(null, true, User.sanitize(user));
    });
  };

  server.register(require('hapi-auth-jwt2'), function (err) {

    if (err) {
      console.error(err);
    }

    server.auth.strategy('jwt', 'jwt',
      { key: config.secret,
        validateFunc: validate,
        verifyOptions: { algorithms: [ 'HS256' ] },
      });


  });

  return next();
};

register.attributes = {
  name: 'auth',
  version: '1.0.0',
};


module.exports = register;
