'user strict'
var Glue    = require('glue');
const path  = require('path');
process.env.NODE_CONFIG_DIR = path.join(__dirname, 'config');
const options = {
    relativeTo: __dirname,
  };

Glue.compose(require('./manifest.js'), options,function (err, server) {
  if(err)
    throw err;

  server.start((err) => {
    if (err) {
      return console.error(err);
    }

    var api = server.connections[0];
    console.log(`ChadApp started at: ${api.info.uri}`);
  });

});
