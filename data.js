const https = require('https');
const fs = require('fs');
const fsp = require('fs-es6-promise');
const bluebird = require('bluebird');
const mongoose = require('mongoose');

mongoose.Promise = bluebird;
     
const connect = mongoose.connect('mongodb://localhost:27017/elite');
let db = mongoose.connection.db;

const pathToSystemsJSON = getJsonPath('systems');

/*const api = {
    "modules": "https://eddb.io/archive/v5/modules.json",
    "systems": "https://eddb.io/archive/v5/systems_populated.json",
    "stations": "https://eddb.io/archive/v5/stations.json",
    "factions": "https://eddb.io/archive/v5/factions.json",
    "commodities": "https://eddb.io/archive/v5/commodities.json"
}*/


const systemSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    edsm_id: Number,
    name: String,
    x: Number,
    y: Number,
    z: Number,
    population: Number,
    /*is_populated: Boolean,
    government_id: Number,
    government: String,
    allegiance_id: Number,
    allegiance: String,
    state_id: Number,
    state: String,
    security_id: Number,
    security: String,
    primary_economy_id: Number,
    primary_economy: String,
    power: String,
    power_state: Number,
    power_state_id: Number,
    needs_permit: Boolean,
    updated_at: Number,
    simbad_ref: String,
    controlling_minor_faction_id: Number,
    controlling_minor_faction: String,
    reserve_type_id: Number,
    reserve_type: String*/
});

const System = mongoose.model('System', systemSchema);

function downloadFile(url, path){
    return new Promise(function(resolve, reject) {
        let stream = new fs.createWriteStream(path);
        https.get(url, function (res) {
            console.log(`Downloas ${url}`);
            res.on('data', function (chunk) {
                stream.write(chunk);
            });
            res.on('end', function () {
                console.log(`Write ${url} to ${path}`);
                stream.end();
                
                fsp.readFile(path)
                    .then( data => {
                        try{
                            JSON.parse(data.toString());
                        }
                        catch(e) {
                            downloadFile(url, path)
                                .then(resolve);
                        }
                        resolve();
                    });
            });
            res.on('error', err => {
                reject(err);
            });
        });
    });
}

function getJsonPath(item){
    return `data/${item}.json`;
}

/*function getAPI(api, done){
    try {
        eachOfLimit(api, 1, (value, key, callback) => downloadFile(value, getJsonPath(key))
            .then(err => {
                if(err){
                    done(err);
                } 
                callback();
            }), () => done(0, Object.keys(api).map( item => getJsonPath(item))));
    } catch (err){
        done(err);
    }
}*/


function closeDB(){
    console.log('closeDB');
    return mongoose.connection.close();
}

function initDb() { 
    return connect
        .then(() => db = connect.connection.db);
}

function count(params = {}){
    console.log('params: ' + JSON.stringify(params));
    return new Promise(function(resolve) {
        System.count(params, function(err, count) {
            if(err) {
                console.log('err');
                resolve(0);
            }
            console.log('Count is ' + count);
            resolve(count);
        });
    });
}

function updateDB() {
    return downloadFile('https://eddb.io/archive/v5/systems_populated.json', pathToSystemsJSON)
        .then( () => fsp.readFile(pathToSystemsJSON))
        .then( data => new Promise(function(resolve) {
            let systems = JSON.parse(data.toString());
            //bluebird.map(systems, system => new System(system).save()).then(()=> resolve());
			bluebird.map(systems, function(system) {
				return System(system).save();
			}).then(function() {
				console.log("done");
				resolve();
			});
        }));
}

function actualDB(force){
    return fsp.stat(pathToSystemsJSON)
        .then( stat => {
            const date = new Date();
            if( stat
                && (stat.ctime.getFullYear() === date.getFullYear())
                && (stat.ctime.getMonth() === date.getMonth())
                && (stat.ctime.getDate() === date.getDate()) && !force){
                return;
            }
            return updateDB();
        })
        .catch( err => {
            if (err.code === 'ENOENT') { 
                return updateDB();
            }
            throw err;
        });
}

module.exports = {
  //  getAPI: getAPI,
    getJsonPath: getJsonPath,
    actualDB: actualDB,
    updateDB: updateDB,
    closeDB: closeDB,
    count: count,
    db: db,
    initDb: initDb
};