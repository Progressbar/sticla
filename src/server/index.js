const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

const db = require('./db');

const log = require('./log');
log('starting application');

const handler = require('./handler');

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})
app.post('/api', (req, res) => {
  handler(req.body)
    .then((data) => res.json(data))
    .catch((data) => {
      log(`error\n${data}`);
      res.json({ error: data });
    })
})

app.listen(0xB48);
