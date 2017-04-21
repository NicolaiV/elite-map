const rp = require('request-promise');
const fsp = require('fs-es6-promise');

function getJsonPath(item) {
  return `data/${item}.json`;
}

function downloadFile(url, path) {
  console.log(`Download ${url}`);
  return rp(url)
    .then((data) => {
      console.log(`Write ${url} to ${path}`);
      try {
        JSON.parse(data.toString());
      } catch (e) {
        throw new Error('Download error');
      }
      return fsp.mkdir(`data`)
               .then(() => fsp.writeFile(path, data));
    });
}

module.exports = {
  getJsonPath,
  downloadFile
};
