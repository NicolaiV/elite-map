const mongoose = require('mongoose');
const bluebird = require('bluebird');
const System = require('../DB_Models/System');

Promise = bluebird;
mongoose.Promise = bluebird;

const maxRadius = 11;
const startName = '1 G. Caeli';
const endName = 'Waruta';
const path = [];
const nodes = [];
let start = null;

function distance(initial, target) {
  const { x: initialX, y: initialY, z: initialZ } = initial;
  const { x: targetX, y: targetY, z: targetZ } = target;
  return Math.sqrt(((initialX - targetX) ** 2)
            + ((initialY - targetY) ** 2)
            + ((initialZ - targetZ) ** 2));
}

function distanceConsts(x1, y1, z1, x2, y2, z2) {
  return Math.sqrt(((x1 - x2) ** 2)
            + ((y1 - y2) ** 2)
            + ((z1 - z2) ** 2));
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
        names: [system.name, target.name],
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

function iterate(iterable, end) {
  return depsBySystem(iterable)
    .then(deps => new Promise((resolve) => {
      if (deps.length !== 0) {
        const { x: endX, y: endY, z: endZ } = end;
        const distanceToTarget = distanceConsts(
          deps[0].X[0],
          deps[0].Y[0],
          deps[0].Z[0],
          endX,
          endY,
          endZ);
        const delta = deps.map((item, index) => {
          return {
            value: distanceConsts(item.X[1], item.Y[1], item.Z[1], endX, endY, endZ),
            index
          };
        }).sort((a, b) => a.value - b.value);
        const iterateTargetNames = [];
        const iterateTargetNameUse = (iterateTargetNamesIndex) => {
          const iterateTargetName = iterateTargetNames[iterateTargetNamesIndex];
          console.log(`'${iterateTargetName}'`);
          path.push(iterateTargetName);
          nodes.push(iterateTargetName);
          if (iterateTargetName === endName) {
            resolve(true);
          } else {
            System.findOne({ name: iterateTargetName })
              .then(current => iterate(current, end))
              .then((r) => {
                if (r || (iterateTargetNames.length === (iterateTargetNamesIndex + 1))) {
                  resolve(r);
                } else {
				  path.pop();
                  iterateTargetNameUse(iterateTargetNamesIndex + 1);
                }
              });
          }
        };
        for (let indexOfMinimum = 0; indexOfMinimum < delta.length; indexOfMinimum++) {
          const iterateTargetName = deps[delta[indexOfMinimum].index].names[1];
          if (nodes.indexOf(iterateTargetName) === -1) {
            iterateTargetNames.push(iterateTargetName);
          }
        }
        if (iterateTargetNames.length === 0) {
          resolve(false);
        } else {
          iterateTargetNameUse(0);
        }
      } else {
        resolve(false);
      }
    }));
}

mongoose.connect('mongodb://localhost:27017/elite')
    .then(() => {
      console.time('time');
    })
    .then(() => console.log('start'))
    .then(() => System.findOne({ name: startName }))
    .then((startE) => { start = startE; })
    .then(() => System.findOne({ name: endName }))
    .then(end => iterate(start, end))
    .then((res) => {
      console.log(res);
      console.log(path);
      console.timeEnd('time');
      return mongoose.connection.close();
    });
