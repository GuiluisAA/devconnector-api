const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../../config/keys');
const passport = require('passport');

// Load Input Validation
const validateRegisterInput = require('../../../validation/register');
const validateLoginInput = require('../../../validation/login');

module.exports = v1Router => {

  /**
   * @route  POST api/v1/auth/register
   * @desc   Register new user
   * @access Public
   */
  router.post('/register', (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body);

    //Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    User.findOne({ email: req.body.email })
      .then(user => {
        if (user) {
          errors.email = 'Email already exists';
          return res.status(400).json(errors)
        } else {

          const avatar = gravatar.url(req.body.email, {
            s: '200', // Size
            r: 'pg', //Rating
            d: 'mm' // Default
          });

          const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            avatar,
            password: req.body.password
          });

          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;

              newUser.save()
                .then(user => res.json(user))
                .catch(err => console.log(err));
            })
          })
        }
      })

  });

  /**
   * @route  POST POST api/v1/auth/login
   * @desc   Return a JWT Token to login user
   * @access Public
   */
  router.post('/login', (req, res) => {

    const { errors, isValid } = validateLoginInput(req.body);

    //Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    // Find user by email
    User.findOne({ email })
      .then(user => {
        // Check for user
        if (!user) {
          errors.email = 'User not found'
          return res.status(404).json(errors)
        }

        // Check Password
        bcrypt.compare(password, user.password)
          .then(isMatch => {
            if (isMatch) {
              // User Matched
              const payload = { id: user.id, name: user.name, avatar: user.avatar }; // Create JWT payload

              //Sign Token
              jwt.sign(payload, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {
                res.json({
                  success: true,
                  token
                })
              });
            } else {
              return res.status(400).json({ password: "Password incorrect" })
            }
          })
      })

  });

  v1Router.use('/auth', router);
}