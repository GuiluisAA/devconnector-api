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
   * @desc		Create user profile
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
   * @route		POST api/v1/profiles/experience
   * @desc		Create Experience
   * @access	Public
   */  
  router.post('/experience', passport.authenticate('jwt', { session: false }), (req, res) => {

    const newExperience = req.body.experience;

    const { errors, isValid } = validateExperienceInput(newExperience);
  
    if (!isValid) {
      return res.status(400).json(errors);
    }
  
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const newExp = {
          title: newExperience.title,
          company: newExperience.company,
          location: newExperience.location,
          from: newExperience.from,
          to: newExperience.to,
          current: newExperience.current,
          description: newExperience.description,
        }
  
        //Add to experience array
        profile.experience.unshift(newExp);
        profile.save()
        .then(profile => res.json(profile))
        .catch(error => res.status(500).json(error));
      })
  });

  /**
   * @route		DELETE api/v1/profiles/experience/:experience_id
   * @desc		Create Experience
   * @access	Public
   */
  router.delete('/experience/:experience_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  
    Profile.findOne({ user: req.user.id })
      .then(profile => {
  
        // Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.param.experience_id);
  
          // Splice out of array
          profile.experience.splice(removeIndex, 1);
      
          // Save
          profile.save()
            .then(profile => res.json(profile))
        })
        .catch(err => res.status(404).json(err))
  
  });

  /**
   * @route		POST api/v1/profiles/education
   * @desc		Create Experience
   * @access	Public
   */  
  router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {

    const newEducation = req.body.education;

    const { errors, isValid } = validateEducationInput(newEducation);
  
    if (!isValid) {
      return res.status(400).json(errors);
    }
  
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const newEdu = {
          school: newEducation.school,
          degree: newEducation.degree,
          field_of_study: newEducation.field_of_study,
          from: newEducation.from,
          to: newEducation.to,
          current: newEducation.current,
          description: newEducation.description,
        }
  
        //Add to education array
        profile.education.unshift(newEdu);
        profile.save()
          .then(profile => res.json(profile))
          .catch(error => res.status(500).json(error))
      })
  });

  /**
   * @route		DELETE api/v1/profiles/education/:education_id
   * @desc		Create Experience
   * @access	Private
   */  
  router.delete('/education/:education_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  
    Profile.findOne({ user: req.user.id })
      .then(profile => {
  
        // Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.param.education_id);
  
        // Splice out of array
        profile.education.splice(removeIndex, 1);
  
        // Save
        profile.save()
          .then(profile => res.json(profile))
      })
      .catch(err => res.status(404).json(err))
  
  });

  /**
   * @route		DELETE api/v1/profiles/
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