var express = require('express');
const mongoose = require('mongoose');
const config = require('../config');
var app = express();

const bluebird = require('bluebird');
const PathModel = require('../DB_Models/Path');
const amqplib = require('amqplib');
mongoose.Promise = bluebird;
Promise = bluebird;

app.get('/', function(req, res) {
  res.send('elite-map');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

mongoose.connect(config.mongoose.colletction)
  //.then(() => PathModel.remove())
  .then(() => amqplib.connect('amqp://localhost'))
  .then(connection => connection.createChannel())
  .then(res => ch = res)
  .then(ch => ch.assertQueue('tasks'))
  .then(() => app.post('/generate', (req, res) => {
    console.log('generate');
    console.log(req.body);
    const msg = JSON.parse(req.body);
    const model = new PathModel({"names": msg.names, "maxRadius":msg.maxRadius, "generated": false})
    return model.save()
      .then(() => ch.sendToQueue('tasks', new Buffer(`{"_id":"${model._id}"}`)))
      .tnen(() => res.end(`{"_id" = "${model._id}"}`))
  }))
  .then(() => app.post('/get_path', (req, res) => {
    const msg = JSON.parse(req.body);
    return PathModel.findOne({_id: msg._id})
      .then(res => {
        console.log(res);
        if (res) {
          const result = JSON.strngify(res)
          if (res.generated){
            return PathModel.remove({_id: model.id})
              .tnen(() => res.end(`{"_id" = "${model._id}"}`))
          } else {
            return res.end('{"generation": true}')
          }
        } else {
          return res.end('{"error": true}')
        }
      })
  }))
  .catch(console.warn)
