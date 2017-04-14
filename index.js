const datasGetter = require('./datas');

/*function distance(initial, target){
  const {x: initialX, y: initialY, z: initialZ} = initial;
  const {x: targetX, y: targetY, z: targetZ} = target;
  return Math.sqrt(Math.pow((initialX - targetX), 2) + Math.pow((initialY - targetY), 2 ) + Math.pow((initialZ - targetZ), 2))
}*/
datasGetter.initDb()
    .then(() => datasGetter.db.dropDatabase())
    .then(datasGetter.updateDB)
    .then(datasGetter.closeDB)
    .catch(err=>console.log(err));
  
  
  /*for(let index in systems){
  if(systems.hasOwnProperty(index)){
    let system = systems[index];
    console.log(index)
  /*
  if(systems.hasOwnProperty(index)){
    let system = systems[index];
    system.distances = [];
    for(let targetIndex in systems){
      if(systems.hasOwnProperty(targetIndex)){
        let target = systems[index];
        if(target.distances && target.distances[index]){
          system.distances[targetIndex] = target.distances[index];
        }
        system.distances[targetIndex] = distance(system, target);
      }
    }
  }*//*
  }
}*/

//TODO: подключить линтер