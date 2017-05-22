var q = 'tasks';
const mongoose = require('mongoose');
const bluebird = require('bluebird');
mongoose.Promise = bluebird;
const config = require('../config');
const PathModel = require('../DB_Models/Path');

mongoose.connect(config.mongoose.colletction)
  .then(() => PathModel.remove())
  .then(() => {
var open = require('amqplib').connect('amqp://localhost');


// Publisher
return open.then(function(conn) {
  return conn.createChannel();
}).then(function(ch) {
  return ch.assertQueue(q).then(function(ok) {
	let m = new PathModel({"names": ["HIP 69901", "Obastini", "Waruta"], "maxRadius":11, "code": 1, "generated": false});
	console.log(m._id)
    return m.save()
	         .then(() => ch.sendToQueue(q, new Buffer(`{"_id":"${m._id}"}`)))
			 .then(() => setTimeout(()=>PathModel.findOne({_id: m.id})
			   .then(res => {
			     console.log(res);
				 return PathModel.remove({_id: m.id});
			   })
			 , 3000));
  });
}).catch(console.warn);
})