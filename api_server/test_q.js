/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const config = require('../config');
const PathModel = require('../DB_Models/Path');
const amqplib = require('amqplib');

mongoose.Promise = bluebird;
let ch = null;
let model = null;

mongoose.connect(config.mongoose.colletction)
  // .then(() => PathModel.remove())
  .then(() => amqplib.connect('amqp://localhost'))
  .then(connection => connection.createChannel())
  .then(res => (ch = res))
  .then(() => ch.assertQueue('tasks'))
  .then(() => new PathModel({
    names: ['HIP 69901', 'Obastini', 'Waruta'],
    maxRadius: 11,
    code: 1,
    generated: false
  }))
  .then(res => (model = res))
  .then(() => model.save())
  .then(() => ch.sendToQueue('tasks', new Buffer(`{"_id":"${model._id}"}`)))
  .then(() =>
    setTimeout(() => PathModel.findOne({ _id: model.id })
        .then((res) => {
          console.log(res);
          return PathModel.remove({ _id: model.id });
        }), 3000))
  .catch(console.warn);
