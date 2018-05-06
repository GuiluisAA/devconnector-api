const express = require('express');
const router = express.Router();
const passport = require('passport');

// Load User model
const User = require('../../../models/User');

module.exports = v1Router => {
	
	/**
	 * @router  GET api/v1/users/me
	 * @desc    Get current logged user
	 * @access  Private
	 */
	router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
		res.json({
			user: {
				_id: req.user.id,
				name: req.user.name,
				email: req.user.email,
				avatar: req.user.avatar,
			}
		});
	});

	v1Router.use('/users', router);
}