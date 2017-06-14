const rp = require('request-promise');
const fsp = require('fs-es6-promise');
const config = require('../config');

function getJsonPath(item) {
  return `${config.localFiles}/${item}.jsonl`;
}

function downloadFile(url, path) {
  let data = null;
  console.log(`Download ${url}`);
  return rp(url)
    .then((res) => (data = res))
    .then(() => console.log(`Write ${url} to ${path}`))
    .then(() => fsp.mkdir(config.localFiles))
    .catch((err) => {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    })
    .then(() => fsp.writeFile(path, data));
}

module.exports = {
  getJsonPath,
  downloadFile
};
