require('dotenv').config({ path: `${__dirname}/.env` });

const express = require('express');
const errorHandler = require('../shared/errors/errorHandler');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: process.env.SERVICE_NAME
  });
});

require('./routes')(app);

app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`${process.env.SERVICE_NAME} listening on ${process.env.PORT}`);
});
