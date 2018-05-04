const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load Validation
const validateProfileInput = require('../../../validation/profile');
const validateExperienceInput = require('../../../validation/experience');
const validateEducationInput = require('../../../validation/education');

// Load Profile Model
const Profile = require('../../../models/Profile');
// Load User Model
const User = require('../../../models/User');

module.exports = v1Router => {

  /**
   * @route		GET api/v1/profiles/me
   * @desc		Get current user profile
   * @access	Private
   */
  router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
    const errors = {};
  
    Profile.findOne({ user: req.user.id })
      .populate('user', [ 'name', 'avatar' ])
      .then(profile => {
        if(!profile) {
          return res.status(404).json({ errors: {
            status: 404,
            message: 'There is no profile for this user'
          } });
        }
        res.json({ profile });
      })
      .catch(err => res.status(404).json(err));
  });

  /**
   * @route		GET api/v1/profiles/
   * @desc		Get all profiles
   * @access	Public
   */  
  router.get('/', (req, res) => {
    const errors = {};
  
    Profile.find()
      .populate('user', [ 'name', 'avatar' ])
      .then(profiles =>res.json({ profiles }))
      .catch(err => res.status(404).json(err));
  });

  /**
   * @route		GET api/v1/profiles/handle/:handle
   * @desc		Get profile by handle
   * @access	Public
   */
  router.get('/handle/:handle', (req, res) => {
    const errors = {};
  
    Profile.findOne({ handle: req.params.handle })
      .populate('user', ['name', 'avatar'])
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile'
          return res.status(404).json(errors);
        }
  
        res.json({ profile });
      })
      .catch(err => res.status(404).json(err));
  });

  /**
   * @route		GET api/v1/profiles/:profile_id
   * @desc		Get profile by ID
   * @access	Public
   */  
  router.get('/:profile_id', (req, res) => {
    const errors = {};
  
    Profile.findById(req.params.profile_id)
      .populate('user', ['name', 'avatar'])
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile'
          return res.status(404).json(errors);
        }
  
        res.json({ profile });
      })
      .catch(err => res.status(404).json(err));
  });

  /**
   * @route		POST api/v1/profiles/
   * @desc		Create or Edit user profile
   * @access	Private
   */  
  router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    
    const newProfile = req.body.profile;

    const { errors, isValid } = validateProfileInput(newProfile);
  
    if(!isValid) {
      return res.status(400).json(errors);
    }
    // Get fields
    newProfile.user = req.user.id;
  
    // Skills - Split into array
    if (typeof newProfile.skills !== 'undefined') {
      newProfile.skills = newProfile.skills.split(',');
    }
  
    Profile.findOne({ user: req.user.id })
      .then(profile => {
  
        if(profile) {
          // Update
          res.status(400).json({
            errors: {
              status: 400,
              message: 'Profile already exists for this user'
            }
          });
        } else {
          //Check if handle exists
          Profile.findOne({ handle: newProfile.handle })
            .then(profile => {
              if (profile) {
                errors.handle = 'That handle already exists';
                return res.status(400).json({
                  errors: {
                    status: 400,
                    message: 'Profile already exists for this user'
                  }
                });
              }
            });
  
            //Save Profile
            new Profile(newProfile)
              .save()
              .then(profile => res.status(201).json({ profile }));
        }
      });  
  });

  /**
   * @route		POST api/profile/experience
   * @desc		Create Experience
   * @access	Public
   */  
  router.post('/experience', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);
  
    if (!isValid) {
      return res.status(400).json(errors);
    }
  
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const newExp = {
          title: req.body.title,
          company: req.body.company,
          location: req.body.location,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description,
        }
  
        //Add to experience array
        profile.experience.unshift(newExp);
        profile.save().then(profile => res.json(profile))
      })
  });

  /**
   * @route		DELETE api/profile/experience/:exp_id
   * @desc		Create Experience
   * @access	Public
   */
  router.delete('/experience/:exp_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  
    Profile.findOne({ user: req.user.id })
      .then(profile => {
  
        // Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.param.exp_id);
  
          // Splice out of array
          profile.experience.splice(removeIndex, 1);
      
          // Save
          profile.save()
            .then(profile => res.json(profile))
        })
        .catch(err => res.status(404).json(err))
  
  });

  /**
   * @route		POST api/profile/education
   * @desc		Create Experience
   * @access	Public
   */  
  router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);
  
    if (!isValid) {
      return res.status(400).json(errors);
    }
  
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const newEdu = {
          school: req.body.school,
          degree: req.body.degree,
          fieldofstudy: req.body.fieldofstudy,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description,
        }
  
        //Add to education array
        profile.education.unshift(newEdu);
        profile.save().then(profile => res.json(profile))
      })
  });

  /**
   * @route		DELETE api/profile/education/:edu_id
   * @desc		Create Experience
   * @access	Private
   */  
  router.delete('/education/:edu_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  
    Profile.findOne({ user: req.user.id })
      .then(profile => {
  
        // Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.param.edu_id);
  
        // Splice out of array
        profile.education.splice(removeIndex, 1);
  
        // Save
        profile.save()
          .then(profile => res.json(profile))
      })
      .catch(err => res.status(404).json(err))
  
  });

  /**
   * @route		DELETE api/profile/
   * @desc		Delete user profile
   * @access	Private
   */  
  router.delete('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  
    Profile.findOneAndRemove({ user: req.user.id })
      .then((profile) => {
        User.findOneAndRemove({ _id: req.user.id })
          .then((user) => {
            res.json({})
          });
      })
  });

  v1Router.use('/profiles', router);
}