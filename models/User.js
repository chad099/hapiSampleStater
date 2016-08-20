'use strict';
const joi = require('joi');
const objectAssign = require('object-assign');
const BaseModel = require('hapi-mongo-models').BaseModel;
const hoek = require('hoek');

const User = BaseModel.extend({
  // instance prototype
  constructor: function (attrs) {
    objectAssign(this, attrs);
  },
});

User._collection = 'users'; // the mongo collection name

User.schema = joi.object().keys({
  username:       joi.string().required(),
  passwordHash:   joi.string().required(),
  salt:           joi.string().required(),
  phone:          joi.string().required(),
  email:          joi.string().required(),
  profession:     joi.string().required(),
  country:        joi.string().required(),
  verifyToken:    joi.string(),
  verifyTokenAt:  joi.date(),
  isActive:       joi.boolean().required(),
});

User.sanitize = function (user) {
  let clone = hoek.clone(user);

  delete clone.salt;
  delete clone.passwordHash;

  return clone;
};

module.exports = User;

