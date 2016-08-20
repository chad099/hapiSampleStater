'use strict';
const joi     = require('joi');
const crypto  = require('../services/crypto');
const boom    = require('boom');
const jwt     = require('../services/jwt');
const random  = require('../services/random');
const twilio  = require('../services/twilio');

joi.phone     = require('joi-phone');

const prefix = '/accounts';

module.exports = [
  {
    method: 'POST',
    path: `${prefix}`,
    config: {
      validate: {          // Route validations check
        payload: {
          username: joi.string().alphanum().min(3).max(30).required(),
          email:    joi.string().email().required(),
          password: joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{6,12}$/),
          phone:    joi.phone.e164(),
          profession: joi.string().required(),
          country:  joi.string().required(),

        },
        options: { abortEarly: false },
      },
      handler: (request, reply)=> {
        const User  = request.server.plugins['hapi-mongo-models'].User;
        let payload = request.payload;

        //Crypt password
        crypto
          .hashString(payload.password)
          .then((hashData) => {

            // lower case data
            payload.email = payload.email.toLowerCase();
            payload.username = payload.username.toLowerCase();
            payload.isActive = false;

            const filter = {};

            // User uniqueness check
            User.findOne({ $or: [{ username: payload.username },
              { email: payload.email }, ], }, (err, user) => {

              if (err) {
                return reply(err);

              }if (user) {

                reply(boom.notAcceptable('Username or Email already exists.'));
              } else {
                // password encryption
                payload.salt = hashData.salt;
                payload.passwordHash = hashData.hash;

                // remove unwanted fields
                delete payload.password;

                // validate model
                User.validate(payload, (err, createUser) => {
                  if (err) {
                    return reply(err);
                  }

                  // default values
                  createUser.isActive = false;
                  createUser.verifyToken = random.randomNumber().toString();
                  createUser.verifyTokenAt = new Date();

                  // Create New User
                  User.insertOne(createUser, [], function (err, newUser) {
                    if (err) {
                      return reply(err);
                    }

                    // sanitize and generate accessToken
                    let  user = User.sanitize(newUser[0]);
                    user.accessToken = jwt.sign({ id: user._id.toString() });

                    // call twilio
                    twilio.sendUserVerifyToken(user);

                    // reply
                    reply(user).code(201);

                  });
                });
              }
            });
          })
          .catch(reply);
      },
    },
  },

  {
    method: 'POST',
    path:   `${prefix}/check-username-available`,
    config: {
      validate: {
        payload: {
          username: joi.string().required(),
        },
      },
      handler: (request, reply) => {
        const User  = request.server.plugins['hapi-mongo-models'].User;
        User.findOne({ username: request.payload.username }, (err, user) => {
          reply({ error: err, field: 'username', isAvailable: !user });
        });
      },
    },
  },

  {
    method: 'POST',
    path:   `${prefix}/check-email-available`,
    config: {
      validate: {
        payload: {
          email: joi.string().email().required(),
        },
      },
      handler: (request, reply) => {
        const User  = request.server.plugins['hapi-mongo-models'].User;
        User.findOne({ email: request.payload.email }, (err, user) => {
          reply({ error: err, field: 'email', isAvailable: !user });
        });
      },
    },
  },

  {
    method: 'POST',
    path:   `${prefix}/verify`,
    config: {
      auth: 'jwt',
      validate: {
        payload: {
          verifyToken: joi.string().required(),
        },
      },
      handler: (request, reply) => {
        var authUser = request.auth.credentials;

        if (request.payload.verifyToken !== authUser.verifyToken) {
          return reply(boom.badRequest('Wrong verify token supplied'));
        }

        //update
        const User = request.server.plugins['hapi-mongo-models'].User;
        User.updateOne(
          { _id: authUser._id },
          { verifyToken: null, verifyTokenAt: null, isActive: true },
          (err, updated) => {
            if (err) {
              console.error(err)
              return reply(boom.badRequest('Error in updating user'));
            }
            reply({success: true});
          });
      },
    },
  },
];
