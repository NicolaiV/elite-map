const mongoInterface = require('./mongo_interface');
const schedule = require('node-schedule');
const config = require('./config');

let updaeterErrorDeep = 0;

function reActualData() {
  console.log('reActualData');
  return mongoInterface.initDb()
  //  .then(() => mongoInterface.db.dropDatabase())
    .then(() => mongoInterface.System.count({}))
    .then((count) => {
      console.log(`Count of systems is ${count}`);
      return count;
    })
    .then(() => mongoInterface.Distance.count({}))
    .then((count) => {
      console.log(`Count of distance is ${count}`);
      return count;
    })
    .then(count => mongoInterface.actualDB(count === 0))
   // .then(mongoInterface.closeDB)
    .then(() => { console.log('END'); updaeterErrorDeep = 0; })
    .catch((err) => {
      console.log(`err ${err}`);
      if (updaeterErrorDeep < config.maxErrorDeep) {
        updaeterErrorDeep++;
        setTimeout(reActualData, (updaeterErrorDeep ** 3) * 1000);
      } else {
        throw err;
      }
    });
}

schedule.scheduleJob(config.scheduleJob, reActualData);

reActualData();
