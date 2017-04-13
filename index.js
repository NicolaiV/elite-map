var datasGetter = require('./datas');
var fs = require('fs');
var eachOfLimit = require('async').eachOfLimit;

function distance(initial, target){
	var {x: initialX, y: initialY, z: initialZ} = initial;
	var {x: targetX, y: targetY, z: targetZ} = target;
	return Math.sqrt(Math.pow((initialX - targetX), 2) + Math.pow((initialY - targetY), 2 ) + Math.pow((initialZ - targetZ), 2))
}

datasGetter.initDB()
	.then(datasGetter.clearDB)
	.then(datasGetter.updateDB)
	.catch(err=>console.log(err))
	.then(datasGetter.closeDB)
	
	
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