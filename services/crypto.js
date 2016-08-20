const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.genSalt = () => {
  return new Promise((resolve, reject) => {
    bcrypt
      .genSalt(saltRounds, function (err, salt) {
        if (err) {
          return reject(err);
        }

        resolve(salt);
      });
  });
};

exports.hashString = (str) => {
  return new Promise((resolve, reject) => {
    exports
      .genSalt()
      .then((salt) => {
        bcrypt.hash(str, salt, function (err, hash) {
          if (err) {
            return reject(err);
          }

          resolve({ salt: salt, hash: hash });
        });
      })
      .catch(reject);
  });
};

exports.hashStringWithSalt = (str, salt) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(str, salt, function (err, hash) {
      if (err) {
        return reject(err);
      }

      resolve({ salt: salt, hash: hash });
    });
  });
};

