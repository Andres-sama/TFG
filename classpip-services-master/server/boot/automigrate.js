// var server = require('../server');
var fs = require('fs');
// var ds = server.dataSources.dbmongo;
// ds.automigrate(function(er) {
//   if (er) throw er;
//   console.log('Loopback tables created in', ds.adapter.name);
//   ds.disconnect();
// });
module.exports = function(app) {
  'use strict';
  var mongo = app.dataSources.dbmongo;
  console.log('-- Models found:', Object.keys(app.models));

  for (var model in app.models) {
    // eslint-disable-next-line max-len
    console.log('Cheking if table for model ' + model + ' is created and up-to-date in DB...');
    mongo.isActual(model, function(err, actual) {
      if (!actual) {
        console.log('Difference found! Auto-migrating model ' + model + '...');
        mongo.autoupdate(model, function() {
          console.log('Auto-migrated model ' + model + ' successfully.');
        });
      }
    });
  };
      // eslint-disable-next-line max-len
//   fs.readFile('./common/models/data/db.json',
//   'utf8', function(err, data) {
//     if (err) throw err;
//     console.log(data);
//     var json = JSON.parse(data);
//     mongo.configurations.insert(json, function(err, doc) {
//       console.log(data);
//       if (err) throw err;
//     });
//   });
};
