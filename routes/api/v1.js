const express = require('express');
const v1Router = express.Router();

const users = require('./v1/users')(v1Router);
const profiles = require('./v1/profiles')(v1Router);
const posts = require('./v1/posts')(v1Router);

module.exports = apiRouter => {
  apiRouter.use('/v1', v1Router);
}