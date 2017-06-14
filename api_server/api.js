const PathModel = require('../DB_Models/Path');
const System = require('../DB_Models/System');

function setRequests(app, ch) {
  app.post('/generate', (req, res) => {
    const msg = req.body;
    console.log(`generate ${JSON.stringify(msg)}`);
    const model = new PathModel({
      names: msg.names,
      maxRadius: msg.maxRadius,
      generated: false
    });
    return model.save()
      .then(() => {
        ch.sendToQueue('tasks', new Buffer(`{"_id":"${model._id}"}`));
        res.end(`{"_id": "${model._id}"}`);
      });
  })
  app.post('/get_path', (req, res) => {
    const msg = req.body;
    return PathModel.findOne({ _id: msg._id })
      .then((pm) => {
        console.log(pm);
        if (pm) {
          const result = JSON.stringify(pm);
          if (pm.generated) {
            PathModel.remove({ _id: pm._id })
              .then(() => res.end(result));
          } else {
            return res.end('{"generated": false}');
          }
        } else {
          return res.end('{"error": true}');
        }
        return null;
      });
  })
  app.post('/get_systems', (req, res) => {
    const msg = req.body;
    console.log(msg);
    ['x', 'y', 'z'].forEach(code => (msg[code] = msg[code].sort((a, b) => a - b)));
    System.find({ $and: [
      { x: { $lt: msg.x[1] } },
      { x: { $gt: msg.x[0] } },
      { y: { $lt: msg.y[1] } },
      { y: { $gt: msg.y[0] } },
      { z: { $lt: msg.z[1] } },
      { z: { $gt: msg.z[0] } }]
    })
      .then(systems => res.end(JSON.stringify(systems)));
  })
}

module.exports = setRequests;
