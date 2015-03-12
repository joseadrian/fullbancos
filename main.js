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

    // Manul, no queda de otra                                            vvvvvvvv                                                                        vvvvvvvvv
    var bancos = ['azteca', 'banbif', 'city', 'comercio', 'bbva', 'bcp', 'deutsche', 'falabella', 'financiero', 'gnb', 'interbank', 'mibanco', 'ripley', 'santander', 'scotiabank', 'nacion'];

    var zip = new Zip(appFile);
    zip.extractEntryTo('assets/' + DB_FILE, 'downloads', false, true);

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

        fs.writeFile('data/sucursales.json', JSON.stringify(sucursales), function (err) {
          if (err) return console.log(err);
        });
      });
    });
  });
});
