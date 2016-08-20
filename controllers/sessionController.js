'use strict';
const Joi = require('joi');
const crypto = require('../services/crypto');
const jwt = require('../services/jwt');
const boom = require('boom');

const prefix = '/sessions';

module.exports = [

  {
    method: 'GET',
    path: `${prefix}`,
    config: {
      auth: 'jwt',
      handler: (request, reply) => {

        reply(request.auth.credentials);

      },
    },
  },

  {
    method: 'POST',
    path: `${prefix}`,
    config: {
      validate: {          // Route validations check
        payload: {
          username: Joi.string().alphanum().min(3).max(30).required(),
          password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{6,12}$/),
        },
        options: { abortEarly: false },
      },
      handler: (request, reply)=> {
        const User  = request.server.plugins['hapi-mongo-models'].User;
        const payload = request.payload;

        let reportInvalid = () => {
          reply(boom.badRequest('invalid username or password'));
        };

        User.findOne({ username: payload.username }, function (err, user) {

          if (err) {
            return reply(err);
          }

          if (!user) {
            return reportInvalid();
          }

          const userSalt = user.salt;
          const userPassHash = user.passwordHash;

          crypto
            .hashStringWithSalt(payload.password, userSalt)
            .then((hashData) => {
              if (userPassHash === hashData.hash) {
                reply({ accessToken: jwt.sign({id: user._id.toString()}) });
              }else {
                reportInvalid();
              }
            })
            .catch(reply);
        });
      },
    },
  },
];
