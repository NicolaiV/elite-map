const mongoInterface = require('./mongo_interface');
const config = require('./config');
const Agenda = require('agenda');

const agenda = new Agenda({ db: { address: config.mongoConnectionString } });
let updaterErrorDeep = 0;

// TODO: Решить проблему лишних срабатываний

function actualData() {
  console.log('actual data');
  return mongoInterface.initDb()
    .then(() => {
      if (config.drop) {
        return mongoInterface.db.dropDatabase();
      }
      return null;
    })
    .then(() => mongoInterface.System.count())
    .then((count) => {
      console.log(`Count of systems is ${count}`);
      return count;
    })
    .then(count => mongoInterface.actualDB(count === 0))
   // .then(mongoInterface.closeDB)
    .then(() => {
      console.log('END');
      updaterErrorDeep = 0;
    })
    .catch((err) => {
      console.log(`err ${err}`);
      if (updaterErrorDeep < config.maxErrorDeep) {
        updaterErrorDeep++;
        agenda.schedule(`in ${updaterErrorDeep ** 2} minutes`, 'actual data');
      } else {
        updaterErrorDeep = 0;
      }
    });
}

agenda.define('actual data', actualData);
agenda.on('ready', () => {
  agenda.every(config.agenda, 'actual data');
  agenda.start();
});

actualData();
