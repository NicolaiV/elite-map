/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/
const express = require('express');
const mongoose = require('mongoose');
const config = require('../config');
const bodyParser = require('body-parser');
const bluebird = require('bluebird');
const amqplib = require('amqplib');
const api = require('./api');

const app = express();
let ch = null;

mongoose.Promise = bluebird;
Promise = bluebird;

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/', (req, res) => res.send('elite-map'));

app.listen(3000, () => console.log('Example app listening on port 3000!'));

mongoose.connect(config.mongoose.colletction)
  .then(() => amqplib.connect('amqp://localhost'))
  .then(connection => connection.createChannel())
  .then(res => (ch = res))
  .then(() => ch.assertQueue('tasks'))
  .then(() => api(app, ch))
  .catch(console.warn);
