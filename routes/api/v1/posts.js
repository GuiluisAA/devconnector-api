const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Post Model
const Post = require('../../../models/Post');
// Profile Model
const Profile = require('../../../models/Profile');

// Validation
const validatePostInput = require('../../../validation/post');

module.exports = v1Router => {

	// @route   GET api/posts/
	// @desc		Get Post
	// @access	Public
	router.get('/', (req, res) => {
		Post.find()
			.sort({ date: -1 })
			.then(posts => res.json(posts))
			.catch(err => res.status(404).json(err))
	});
	
	// @route		GET api/posts/:post_id
	// @desc		Get Post by id
	// @access	Public
	router.get('/:post_id', (req, res) => {
		Post.findById(req.params.post_id)
			.then(post => res.json(post))
			.catch(err => res.status(404).json(err))
	});
	
	// @route		POST api/posts/
	// @desc		Create Post
	// @access	Private
	router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
		const { errors, isValid } = validatePostInput(req.body);
	
		// Check Validation
		if(!isValid) {
			return res.status(400).json(errors);
		}
	
		const newPost = new Post({
			text: req.body.text,
			name: req.body.name,
			avatar: req.body.avatar,
			user: req.user.id
		});
	
		newPost.save()
			.then(post => res.json(post));
	});
	
	// @route		DELETE api/posts/:post_id
	// @desc		Delete Post by id
	// @access	Private
	router.delete('/:post_id', passport.authenticate('jwt', { session: false }), (req, res) => {
		Profile.findOne({ user: req.user.id })
			.then(profile => {
				Post.findById(req.params.post_id)
					.then(post => {
						// Check for post owner
						if (post.user.toString() !== req.user.id) {
							return res.status(401).json({ notauthorized: 'User not authorized' });
						}
	
						// Delete
						post.remove()
							.then(() => res.json({ success: true }))
							.catch(err => res.status(404).json(err))
					})
					.catch(err => res.status(404).json(err))
			})
			.catch(err => res.status(404).json(err))
	});
	
	// @route		POST api/posts/like/:like_id
	// @desc		like Post
	// @access	Private
	router.post('/like/:like_id', passport.authenticate('jwt', { session: false }), (req, res) => {
		Profile.findOne({ user: req.user.id })
			.then(profile => {
				Post.findById(req.params.like_id)
					.then(post => {
						if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
							return res.status(400).json({ alreadyliked: 'User already liked this post' })
						}
	
						// Add user id to likes array
						post.likes.unshift({ user: req.user.id });
						
						post.save()
							.then(post => res.json(post));
					})
					.catch(err => res.status(404).json(err))
			})
			.catch(err => res.status(404).json(err))
	});
	
	// @route		POST api/posts/unlike/:like_id
	// @desc		Unlike Post
	// @access	Private
	router.post('/unlike/:like_id', passport.authenticate('jwt', { session: false }), (req, res) => {
		Profile.findOne({ user: req.user.id })
			.then(profile => {
				Post.findById(req.params.like_id)
					.then(post => {
						if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
							return res.status(400).json({ notliked: 'You have not yet liked this post' })
						}
	
						// Get the remove index
						const removeIndex = post.likes
							.map(item => item.user.toString())
							.indexOf(req.user.id)
	
						// Split out of array
						post.likes.splice(removeIndex, 1);
	
						// Save
						post.save()
							.then(post => res.json(post))
	
	
					})
					.catch(err => res.status(404).json(err))
			})
			.catch(err => res.status(404).json(err))
	});
	
	// @route		POST api/posts/comment/:post_id
	// @desc		Add comment Post by id
	// @access	Private
	router.post('/comment/:post_id', passport.authenticate('jwt', { session: false }), (req, res) => {
		const { errors, isValid } = validatePostInput(req.body);
	
		// Check Validation
		if (!isValid) {
			return res.status(400).json(errors);
		}
	
		Post.findById(req.params.post_id)
			.then(post => {
				const newComment = {
					text: req.body.text,
					name: req.body.name,
					avatar: req.body.avatar,
					avatar: req.body.avatar,
					user: req.user.id,
				}
	
				// add to comments array
				post.comments.unshift(newComment);
	
				// Save
				post.save().then(post => res.json(post));
			})
			.catch(err => res.status(404).json({ postnotfound: 'No Post Found' }))
	});
	
	// @route		DELETE api/posts/comment/:post_id/:comment_id
	// @desc		DElete comment from Post
	// @access	Private
	router.delete('/comment/:post_id/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {
	
		Post.findById(req.params.post_id)
			.then(post => {
				//Check if comment exists
				if (post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
					return res.status(404).json({ commentnotexists: 'Comment does not exist' });
				}
	
				// Get remove index
				const removeIndex = post.comments
					.map(item => item._id.toString())
					.indexOf(req.params.comment_id)
	
				// Splice comment outr of array
				post.comments.splice(removeIndex, 1);
	
				post.save().then(post => res.json(post));
			})
			.catch(err => res.status(404).json({ postnotfound: 'No Post Found' }))
	});

	v1Router.use('/posts', router);
}
