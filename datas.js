var http = require('https')
var fs = require('fs')
var eachOfLimit = require('async').eachOfLimit;

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
			callback();
		})
	}).on('error', (e) => {
		console.error(e);
	});
}

function getFile(url, path, callback){
	fs.stat(path, (err, stat) => {
		const date = new Date();
		if( stat
			&& (stat.birthtime.getFullYear() === date.getFullYear())
			&& (stat.birthtime.getMonth() === date.getMonth())
			&& (stat.birthtime.getDate() === date.getDate())){
				callback();
			} else {
				downloadFile(url, path, callback)		
			}
	})

}

function getJsonPath(item){
	return `data/${item}.json`
}

function getData(api, done){
	eachOfLimit(api, 1, (value, key, callback) => getFile(value, getJsonPath(key), callback), () => done(0, Object.keys(api).map( item => getJsonPath(item))))
}


module.exports = {
	getAllData: getData,
	getFile: getFile,
	getJsonPath: getJsonPath
}