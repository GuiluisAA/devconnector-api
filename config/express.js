const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const consign = require('consign');

module.exports = () => {

  const app = express();
  
  // Body parser middleware
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  
  // Passport middleware
  app.use(passport.initialize());

  
  // DB Config
  const db = require('./keys').mongoURI;
  // Connect to MongoDB
  mongoose.connect(db)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));
  
  // Passport Config
  require('./passport')(passport);
  
  consign()
    .include("routes")
    .into(app);

  return app;
}
