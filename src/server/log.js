const fs = require('fs');

const logStream = fs.createWriteStream('log.log', { flags: 'a' });

module.exports = (text) => {
  const out = `${new Date().toJSON()} ${text}`;
  console.log(out);
  logStream.write(`${out}\n`);
};
