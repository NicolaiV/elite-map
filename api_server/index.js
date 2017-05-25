var express = require('express');
const mongoose = require('mongoose');
const config = require('../config');
const bodyParser = require('body-parser');
var app = express();

const bluebird = require('bluebird');
const PathModel = require('../DB_Models/Path');
const amqplib = require('amqplib');
mongoose.Promise = bluebird;
Promise = bluebird;

app.use(bodyParser.json());
app.use(function (req, res, next) {
  console.log(req.body) // populated!
  next()
})

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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
    const msg = req.body;
    console.log('generate ' + JSON.stringify(msg));
    let model = new PathModel({"names": msg.names, "maxRadius":msg.maxRadius, "code": 1, "generated": false})
    return model.save()
      .then(() => {
          ch.sendToQueue('tasks', new Buffer(`{"_id":"${model._id}"}`))
          res.end(`{"_id": "${model._id}"}`)
      })
      
  }))
  .then(() => app.post('/get_path', (req, res) => {
    const msg = req.body;
    return PathModel.findOne({_id: msg._id})
      .then(pm => {
        console.log(pm);
        if (pm) {
          const result = JSON.stringify(pm)
          if (pm.generated){
            PathModel.remove({"_id": pm._id})
            res.end(result)
          } else {
            return res.end('{"generation": true}')
          }
        } else {
          return res.end('{"error": true}')
        }
      })
  }))
  .catch(console.warn)
