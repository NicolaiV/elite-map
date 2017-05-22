const mongoose = require('mongoose');
const bluebird = require('bluebird');
const System = require('../DB_Models/System');
const PathModel = require('../DB_Models/Path');
const amqplib = require('amqplib');
const config = require('../config');

Promise = bluebird;
mongoose.Promise = bluebird;

let maxRadius = null;
let path = null;
let nodes = null;

function distance(x1, y1, z1, x2, y2, z2) {
  function distanceBetweenSystemsConsts(initialX, initialY, initialZ, targetX, targetY, targetZ) {
    return Math.sqrt(((initialX - targetX) ** 2)
              + ((initialY - targetY) ** 2)
              + ((initialZ - targetZ) ** 2));
  }
  function distanceBetweenSystems(initial, target) {
    const { x: initialX, y: initialY, z: initialZ } = initial;
    const { x: targetX, y: targetY, z: targetZ } = target;
    return distanceBetweenSystemsConsts(initialX, initialY, initialZ, targetX, targetY, targetZ);
  }
  if (!z1) {
    return distanceBetweenSystems(x1, y1);
  }
  return distanceBetweenSystemsConsts(x1, y1, z1, x2, y2, z2);
}

function depsBySystem(system) {
  return System.find({ $and: [
      { x: { $lt: (system.x + maxRadius) } },
      { x: { $gt: (system.x - maxRadius) } },
      { y: { $lt: (system.y + maxRadius) } },
      { y: { $gt: (system.y - maxRadius) } },
      { z: { $lt: (system.z + maxRadius) } },
      { z: { $gt: (system.z - maxRadius) } }]
  })
  .then(docs => docs.map((target) => {
    const d = distance(system, target);
    if (d < maxRadius) {
      return {
        target: target.name,
        X: [system.x, target.x],
        Y: [system.y, target.y],
        Z: [system.z, target.z],
        distance: d
      };
    }
    return null;
  })
  .filter(item => item !== null));
}

function iterate(iterable, endNamesArray) {
  return System.findOne({ name: endNamesArray[0] })
      .then(end =>
          depsBySystem(iterable)
            .then(deps => new Promise((resolve) => {
              if (deps.length !== 0) {
                const { x: endX, y: endY, z: endZ } = end;
                const distanceToTarget = distance(
                  deps[0].X[0],
                  deps[0].Y[0],
                  deps[0].Z[0],
                  endX,
                  endY,
                  endZ);
                const delta = deps.map((item, index) => ({
                  value: distance(item.X[1], item.Y[1], item.Z[1], endX, endY, endZ),
                  index
                }))
                  .sort((a, b) => a.value - b.value)
                  .map(item => item.index);
                const namesOfTargets = delta
                  .map(index => deps[index].target)
                  .filter(item => nodes.indexOf(item) === -1);
                const iterateNames = (index) => {
                  const targetName = namesOfTargets[index];
                  console.log(`name: ${targetName} dist: ${distanceToTarget}`);
                  if (targetName === endNamesArray[0]) {
                    const curentNodeName = endNamesArray.shift();
                    console.log(`curentNodeName: ${curentNodeName}`);
                    nodes = [];
                    if (endNamesArray.length === 0) {
                      resolve(true);
                      return;
                    }
                  }
                  path.push(targetName);
                  nodes.push(targetName);
                  System.findOne({ name: targetName })
                    .then(current => iterate(current, endNamesArray))
                    .then((r) => {
                      if (r || (namesOfTargets.length === (index + 1))) {
                        resolve(r);
                      } else {
                        path.pop();
                        iterateNames(index + 1);
                      }
                    });
                };
                if (namesOfTargets.length === 0) {
                  resolve(false);
                } else {
                  iterateNames(0);
                }
              } else {
                resolve(false);
              }
            })));
}

const queueOfTasks = config.amqplib.queueOfTasks;
let id = null;

mongoose.connect(config.mongoose.colletction)
  .then(() => amqplib.connect(config.amqplib.connect))
  .then((conn) => {
  return conn.createChannel().then(function(ch) {
    var ok = ch.assertQueue(queueOfTasks, {durable: true});
    ok = ok.then(function() { ch.prefetch(1); });
    ok = ok.then(function() {
      ch.consume(queueOfTasks, doWork, {noAck: false});
      console.log(" [*] Waiting for messages. To exit press CTRL+C");
    });
    return ok;

    function doWork(msg) {      
      if (msg !== null) {
        const toStr = msg.content.toString();
        console.log(toStr)
        id = JSON.parse(toStr)._id;
        return PathModel.findOne({ _id: id })
          .then(msgValue => {
            const startName = msgValue.names.shift();
            maxRadius = msgValue.maxRadius;
            path = [];
            nodes = [];
            console.time('time');
            return System.findOne({ name: startName })
              .then(start => iterate(start, msgValue.names))
              .then((res) => {
                console.log(res);
                console.timeEnd('time');
                msgValue.path = path;
                msgValue.code = res;
                msgValue.generated = true;
              })
              .then(() => msgValue.save())
              .then(() => ch.ack(msg))
          })
      }
    }
  });
}).catch(console.warn);
