const https = require('https');
const fs = require('fs');
const fsp = require('fs-es6-promise');

function getJsonPath(item) {
  return `data/${item}.json`;
}

function downloadFile(url, path) {
  return new Promise((resolve, reject) => {
    const stream = new fs.createWriteStream(path);
    https.get(url, (res) => {
      console.log(`Downloas ${url}`);
      res.on('data', (chunk) => {
        stream.write(chunk);
      });
      res.on('end', () => {
        console.log(`Write ${url} to ${path}`);
        stream.end();

        fsp.readFile(path)
          .then((data) => {
            try {
              JSON.parse(data.toString());
            } catch (e) {
              downloadFile(url, path)
                .then(resolve);
            }
            resolve();
          });
      });
      res.on('error', (err) => {
        reject(err);
      });
    });
  });
}

module.exports = {
  getJsonPath,
  downloadFile
};
