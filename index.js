var datasGetter = require('./datas');
var fs = require('fs')

/*var api = {
	"modules": "https://eddb.io/archive/v5/modules.json",
	"systems": "https://eddb.io/archive/v5/systems_populated.json",
	"stations": "https://eddb.io/archive/v5/stations.json",
	"factions": "https://eddb.io/archive/v5/factions.json",
	"commodities": "https://eddb.io/archive/v5/commodities.json"
}*/

function updateDB() {
	return new Promise(function(resolve, reject) {
		var pathToSystemsJSON = datasGetter.getJsonPath('systems');
		datasGetter.getFile("https://eddb.io/archive/v5/systems_populated.json", pathToSystemsJSON, (code, data)=>{
			var systems = JSON.parse(fs.readFileSync(pathToSystemsJSON).toString());
			
			resolve()
		})
	})
}

updateDB();