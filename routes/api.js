const express = require('express');
const apiRouter = express.Router();

const users = require('./api/v1')(apiRouter);

module.exports = app => {
  app.use('/api', apiRouter);
}