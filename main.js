var DB_FILE = 'bancos2014.db';

var exec = require('child_process').exec;
      fs = require('fs'),
     Zip = require('adm-zip'),
      _  = require('underscore'),
 sqlite3 = require('sqlite3').verbose();

exec('adb shell pm list packages -f -3 | grep "fullbancos"', function(err, stdout, stderr) {
  if(stderr) return console.log(stderr);

  var apkFile = stdout.match(/package:(.+)=.+/).pop();
  var appFile = './downloads/app.apk';

  exec(['adb pull', apkFile, appFile].join(' '), function(err, stdout, stderr) {
    if(err) return console.log(stderr);

    // Reemplazar por esto cuando existan...                             deutsche                                                                      santander
    // Manul, no queda de otra                                            vvvvvv                                                                        vvvvvv
    var bancos = ['azteca', 'banbif', 'city', 'comercio', 'bbva', 'bcp', 'azteca', 'falabella', 'financiero', 'gnb', 'interbank', 'mibanco', 'ripley', 'azteca', 'scotiabank', 'nacion'];

    var zip = new Zip(appFile);
    zip.extractEntryTo('assets/' + DB_FILE, 'downloads', false, true);

    _.each(bancos, function(banco) {
      zip.extractEntryTo('res/drawable-hdpi/pin_' + banco + '.png', 'data/img', false, true);
    });

    db = new sqlite3.Database('./downloads/' + DB_FILE);
    db.all('SELECT url, phone, picture, idCompany, flagAct FROM banco', function(err, companies) {
      companies = _.map(companies, function(company, index) {
        company.pinName = bancos[index];
        return company;
      });

      companies = _.indexBy(companies, 'idCompany');

      if(err) console.log(err);

      db.all('SELECT * FROM sucursal ORDER BY _rowid_ ASC', function(err, sucursales) {
        if(err) console.log(err);

        var geojson = {
          type: 'FeatureCollection',
          features: []
        };

        /**
         * Armando la estructura geojson
         */
        geojson.features = _.map(sucursales, function(sucursal) {
          if(_.isEmpty(sucursal.latitude) || _.isEmpty(sucursal.latitude)) {
            return false;
          }

          sucursal     = _.pick(sucursal, 'name', 'address', 'descript', 'url', 'phone', 'nameDistrict', 'nameCity', 'latitude', 'longitude');
          sucursal._l  = [parseFloat(sucursal.longitude), parseFloat(sucursal.latitude)];
          sucursal.geo = { name: sucursal.name };

          return {
            type: 'Feature',
            geometry: {
              coordinates: sucursal._l,
              type: 'Point'
            },
            properties: _.omit(sucursal, 'geo')
          }
        });

        // Limpia arreglo de valores falsos
        geojson.features = _.compact(geojson.features);

        // JSON (mantiene estructure de la BD)
        fs.writeFile('data/sucursales.json', JSON.stringify(sucursales), function (err) {
          if (err) return console.log(err);
        });

        // formato geojson http://geojson.org/geojson-spec.html
        fs.writeFile('data/sucursales.geojson', JSON.stringify(geojson), function (err) {
          if (err) return console.log(err);
        });
      });
    });
  });
});
