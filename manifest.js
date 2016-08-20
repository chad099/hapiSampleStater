'use strict';
const config = require('config');

module.exports = {
  server: {},

  connections: [
    {
      host: config.api.host, port: config.api.port, labels: ['web'],
    },
  ],

  registrations: [
    {
      plugin: {
        register: './plugins/auth',
        options: {},
      },
    },
    {
      plugin: {
        register: 'hapi-router',
        options: {
          routes: 'controllers/**/*Controller.js',
        },

      },
    },

    {
      plugin: {
        register: 'hapi-mongo-models',
        options: {
          mongodb: {
            url: config.mongoDb.url,
            options: config.mongoDb.options,
          },
          autoIndex: false,
          models: {
            User: './models/User',

          },
        },
      },
    },

    {
      plugin: {
        register: 'good',
        options: {
          reporters: {
            console: [
              {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{ log: '*', response: '*', error: '*' }]
              },
              {
                module: 'good-console',
              },
              'stdout',
            ],
          },
        },
      },
    },
  ],

};
