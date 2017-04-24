const mongoose = require('mongoose');
const bluebird = require('bluebird');
const System = require('../DB_Models/System');
const Distance = require('../DB_Models/Distance');
Promise = bluebird;
mongoose.Promise = bluebird;

let startId = 1;
let endName = '11 Cephei';
let startName = '1 G. Caeli';
let endId = 25;
let end = null;

function depsByName(name){
	console.log('deps by name');
  return Distance.find({names: name}, (err, docs) => docs )
}

function normaliseItem(item){
  if(item.docAId === startId){
    return {
      startId: item.docAId,
      endId: item.docBId,
      dist: item.dist,
      statX: item.docAx,
      statY: item.docAy,
      statZ: item.docAz,  
      endX: item.docBx,
      endY: item.docBy,
      endZ: item.docBz
    }
  } else {
    return {
      startId: item.docBId,
      endId: item.docAId,
      dist: item.dist,
      statX: item.docBx,
      statY: item.docBy,
      statZ: item.docBz,
      endX: item.docAx,
      endY: item.docAy,
      endZ: item.docAz 
    }
  }
}

function distance(x1, y1, z1, x2, y2, z2){
  let res =  Math.sqrt(((x1 - x2) ** 2)
            + ((y1 - y2) ** 2)
            + ((z1 - z2) ** 2));
    //  console.log('res: ' +  res)
  return res;
}

let path = [];

function doStep({ x: endX, y: endY, z: endZ }) {
  return depsByName(startName)
      .then((deps) => {
		  console.log(deps);
        deps = deps.map((item) => normaliseItem(item));
        let dist = distance(deps[0].statX, deps[0].statY, deps[0].statZ, endX, endY, endZ) 
        let delta = [];
        for (let i in deps) {
          if (deps.hasOwnProperty(i)) {
            let targDist = distance(deps[i].endX, deps[i].endY, deps[i].endZ, endX, endY, endZ);
            delta[i] = targDist;
          }
        }
        let minimum = delta.reduce((minIndex, item, index, array) => { return array[minIndex] > item ? index : minIndex }, 0);
        console.log('dist: ' + dist);
        console.log('min:  ' + delta[minimum])
        //console.log('minimum: ' + JSON.stringify(deps[minimum]))
        //console.log('endX, endY, endZ: ', endX, endY, endZ)
        startId = deps[minimum].endId;
        console.log('id:   ' + startId);
        console.log('__________________');
        return (startId)
      })
}

function iterate() {
  return doStep(end)
    .then(() => { 
        if (startName !== endName) {
          return iterate()
        } 
        else {
          return null
        }
    })
}


const connect = mongoose.connect('mongodb://localhost:27017/elite')
	.then(() => System.find({ name: endName}))
    .then( endE => { end = endE[0]})
    .then(() => iterate())
    .then((q, w) => console.log('123'))