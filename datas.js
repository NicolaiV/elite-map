var http = require('https')
var fs = require('fs')
var eachOfLimit = require('async').eachOfLimit;
var mongoose = require('mongoose');
var db = null;

var System = mongoose.model('System', 
{  
	id: Number,
	edsm_id: Number,
	name: String,
	x: Number,
	y: Number,
	z: Number 
});

function downloadFile(url, path, callback){	
	var stream = new fs.createWriteStream(path);
	http.get(url, function (res) {
		console.log(`Загрузка ${url}`);
		let strJson = '';
		res.on('data', function (chunk) {
			stream.write(chunk);
		});
		res.on('end', function () {
			console.log(`Запись ${url} в ${path}`);
			stream.end()
			fs.readFile(path, (code, data)=>{
				if(code){
					callback(e);
				} else {
					try{
						JSON.parse(data.toString())
					}
					catch(e) {
						downloadFile(url, path, callback);
					}
					callback();
				}
			});
		});
		res.on('error', (e) => {
			callback(e);
		});
	})
}

function getFile(url, path, callback){
	try{
		fs.stat(path, (err, stat) => {
			const date = new Date();
			if( stat
				&& (stat.ctime.getFullYear() === date.getFullYear())
				&& (stat.ctime.getMonth() === date.getMonth())
				&& (stat.ctime.getDate() === date.getDate())){
					callback();
				} else {
					downloadFile(url, path, callback)		
				}
		})
	} catch (err){
		callback(err)
	}
}

function getJsonPath(item){
	return `data/${item}.json`
}

function getAPI(api, done){
	try {
		eachOfLimit(api, 1, (value, key, callback) => getFile(value, getJsonPath(key), (code)=>{if(code){done(code)} callback()}), () => done(0, Object.keys(api).map( item => getJsonPath(item))))
	} catch (err){
		done(err)
	}
}

function updateDB() {
	return new Promise(function(resolve, reject) {
		var pathToSystemsJSON = getJsonPath('systems');
		getFile("https://eddb.io/archive/v5/systems_populated.json", pathToSystemsJSON, (err, data)=>{
			if(err){
				console.log('Ошибка чтения файла')
				reject(err);
			}
			console.log('Файл прочитан')
			var systems = JSON.parse(fs.readFileSync(pathToSystemsJSON).toString());
			console.log(systems.length)
			eachOfLimit(systems, 1, (value, key, callback) => {
					new System(value).save((err, data, affected) => callback());
				}, () => console.log('END'));
			delete systems;
			resolve()
		})
	});
}

function initDB(callback){
	return new Promise(function(resolve, reject) {
		console.log('initDB');
		mongoose.connect('mongodb://localhost:27017/');
		db = mongoose.connection.db;
		mongoose.connection.on('open', (err) => err ? reject() : resolve());
	})
}

function clearDB(callback){
	return new Promise(function(resolve, reject) {
		console.log('clearDB');
		db.dropDatabase((err) => err ? reject() : resolve());
	})
}

function closeDB(callback){
	return new Promise(function(resolve) {
		console.log('closeDB');
		mongoose.connection.close(resolve);
	})
}

module.exports = {
	getAPI: getAPI,
	getJsonPath: getJsonPath,
	getFile: getFile,
	updateDB: updateDB,
	initDB: initDB,
	clearDB: clearDB,
	closeDB: closeDB
}