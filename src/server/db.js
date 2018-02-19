const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const existsFile = (path) => new Promise((resolve, reject) => {
  util.promisify(fs.stat)(path)
    .then(() => resolve(true))
    .catch(() => resolve(false))
});
const log = require('./log');

const dbPath = `${__dirname}/db.json`;
const dbBackupPath = `${__dirname}/db-backup.json`;

const openDBPromise = 
  existsFile(dbPath)
      .then((exists) => {
        if(!exists) {
          let outerText = '';
          return readFile(dbBackupPath)
            .then((buffer) => buffer.toString())
            .then((text) => {
              outerText = text;
              return writeFile(dbPath, text)
            })
            .then(() => outerText);
        }
        return readFile(dbPath)
          .then((buffer) => buffer.toString())
      })
      .then((text) => JSON.parse(text));

const db = {
  loaded: false,
  promise:
    openDBPromise
      .then((data) => {
        log('db loaded');
        db.data = data;
        db.loaded = true;
        return data;
      }),
  data: {},
  get() {
    return this.promise;
  },
  set(data=this.data) {
    if(this.loaded) {
      this.data = data;
      return writeFile(dbPath, JSON.stringify(data));
    } else {
      return this.promise.then(() => this.set(data));
    }
  }
};

module.exports = db;
