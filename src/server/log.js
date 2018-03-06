const fs = require('fs');

const logStream = fs.createWriteStream('log.log', { flags: 'a' });

module.exports = (text) => {
  const out = `${new Date().toJSON()} ${text}`;
  // eslint-disable-next-line no-console
  console.log(out);
  logStream.write(`${out}\n`);
};
