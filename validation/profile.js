const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateProfileInput(data) {
	let errors = {};

	data.handle = !isEmpty(data.handle) ? data.handle : '';
	data.status = !isEmpty(data.status) ? data.status : '';
	data.skills = !isEmpty(data.skills) ? data.skills : '';
	data.social = !isEmpty(data.social) ? data.social : '';

	if (!Validator.isLength(data.handle, { min: 2, max: 40 })) {
		errors.handle = 'Handle nedds to between 2 and 40 characters';
	}

	if (Validator.isEmpty(data.handle)) {
		errors.handle = 'Profile handle is required'
	}

	if (Validator.isEmpty(data.status)) {
		errors.status = 'Status field is required'
	}

	if (Validator.isEmpty(data.skills)) {
		errors.skills = 'Skills field is required'
	}

	if(!isEmpty(data.website) && !Validator.isURL(data.website)) {
		errors.website = 'Not a valid URL';
	}

	if(!isEmpty(data.social.youtube) && !Validator.isURL(data.social.youtube)) {
		errors.youtube = 'Not a valid URL';
	}

	if(!isEmpty(data.social.twitter) && !Validator.isURL(data.social.twitter)) {
		errors.twitter = 'Not a valid URL';
	}

	if(!isEmpty(data.social.facebook) && !Validator.isURL(data.social.facebook)) {
		errors.facebook = 'Not a valid URL';
	}

	if(!isEmpty(data.social.linkedin) && !Validator.isURL(data.social.linkedin)) {
		errors.linkedin = 'Not a valid URL';
	}

	if(!isEmpty(data.social.instagram) && !Validator.isURL(data.social.instagram)) {
		errors.instagram = 'Not a valid URL';
	}

	return {
		errors,
		isValid: isEmpty(errors)
	};
}