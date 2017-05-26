﻿var express = require('express');
const mongoose = require('mongoose');
const config = require('../config');
const bodyParser = require('body-parser');
const System = require('../DB_Models/System');
var app = express();

const bluebird = require('bluebird');
const PathModel = require('../DB_Models/Path');
const amqplib = require('amqplib');
mongoose.Promise = bluebird;
Promise = bluebird;

app.use(bodyParser.json());

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
			  .then(() => res.end(result))
          } else {
            return res.end('{"generated": false}')
          }
        } else {
          return res.end('{"error": true}')
        }
	  })
  }))
		
  .then(() => app.post('/get_systems', (req, res) => {
    let msg = req.body;
	console.log(msg);
	['x', 'y', 'z'].forEach((code) => msg[code] = msg[code].sort((a, b) => a - b))
	System.find({ $and: [
      { x: { $lt: msg['x'][1] } },
      { x: { $gt: msg['x'][0] } },
      { y: { $lt: msg['y'][1] } },
      { y: { $gt: msg['y'][0] } },
      { z: { $lt: msg['z'][1] } },
      { z: { $gt: msg['z'][0] } }]
    })
	  .then(systems => {
		  res.end(JSON.stringify(systems));
	  })
  }))
  .catch(console.warn)
