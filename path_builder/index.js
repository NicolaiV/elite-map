const mongoose = require('mongoose');
const bluebird = require('bluebird');
const System = require('../DB_Models/System');
Promise = bluebird;
mongoose.Promise = bluebird;

const maxRadius = 10;


function distance(initial, target) {
  const { x: initialX, y: initialY, z: initialZ } = initial;
  const { x: targetX, y: targetY, z: targetZ } = target;
  return Math.sqrt(((initialX - targetX) ** 2)
            + ((initialY - targetY) ** 2)
            + ((initialZ - targetZ) ** 2));
}


function distanceConsts(x1, y1, z1, x2, y2, z2){
  let res =  Math.sqrt(((x1 - x2) ** 2)
            + ((y1 - y2) ** 2)
            + ((z1 - z2) ** 2));
  return res;
}

// TODO: заменить а map
function depsBySystem(system){    
  let dists = [];
  return System.find({ $and: [
      { x: { $lt: (system.x + maxRadius) } },
      { x: { $gt: (system.x - maxRadius) } },
      { y: { $lt: (system.y + maxRadius) } },
      { y: { $gt: (system.y - maxRadius) } },
      { z: { $lt: (system.z + maxRadius) } },
      { z: { $gt: (system.z - maxRadius) } }]
  })
  .then((docs) => Promise.each(docs, (target) => {
    const d = distance(system, target);
    if (d < maxRadius) {
      dists.push({
        names: [system.name, target.name],
        X: [system.x, target.x],
        Y: [system.y, target.y],
        Z: [system.z, target.z],
        distance: d
      });
    }
  })
  .then(() => dists)
);
}

let startName = '1 G. Caeli';
let endName = 'Waruta';
let start = null;
let end = null;
let path = [];
let nodes = [];
function iterate(start, end) {
  return depsBySystem(start)
    .then((deps) => new Promise((resolve) => {
        if (deps.length !== 0) {
          const { x: endX, y: endY, z: endZ } = end;
          let distanceToTarget = distanceConsts(deps[0].X[0], deps[0].Y[0], deps[0].Z[0], endX, endY, endZ);
          let delta = deps.map((item, index) => {
             return {
                 value: distanceConsts(item.X[1], item.Y[1], item.Z[1], endX, endY, endZ),
                 index
             }
          }).sort((a, b) => { return a.value - b.value; });
          const iterateTargetNameUse = function(iterateTargetNamesIndex){
		    const iterateTargetName = iterateTargetNames[iterateTargetNamesIndex];
            console.log('name:   ' + iterateTargetName + ' dist: ' + distanceToTarget);
            path.push(iterateTargetName);
            nodes.push(iterateTargetName);
            if (iterateTargetName === endName) {
              resolve(true);
            } else {
            System.findOne({ name: iterateTargetName})
              .then(start => iterate(start, end))
              .then(r => {
				if(r || ( iterateTargetNames.length === (iterateTargetNamesIndex + 1))) {
                  resolve(r)
				} else {
                  iterateTargetNameUse(iterateTargetNamesIndex + 1)
				}
			  })
			}
          }
          let iterateTargetNames = [];
          for(let indexOfMinimum = 0; indexOfMinimum < delta.length; indexOfMinimum++) {
            const iterateTargetName = deps[delta[indexOfMinimum].index].names[1];
            if (nodes.indexOf(iterateTargetName) === -1) {
              iterateTargetNames.push(iterateTargetName)
            }
          }
          if (iterateTargetNames.length === 0) {
            resolve(false);
          } else {
            iterateTargetNameUse(0)
		  }
        } else {
          resolve(false);
        }
    }))
}

const connect = mongoose.connect('mongodb://localhost:27017/elite')
    .then(() => console.log('start'))
    .then(() => System.find({ name: startName}))
    .then( startE => { start = startE[0]})
    .then(() => console.log('end'))
    .then(() => System.find({ name: endName}))
    .then( endE => { end = endE[0]})
    .then(() => iterate(start, end))
    .then(res => console.log(res))
    .then((q, w) => console.log('конец'))