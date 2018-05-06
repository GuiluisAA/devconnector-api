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

  /**
   * @route  GET api/v1/posts/
   * @desc   Get all posts
   * @access Public
   */
  router.get('/', (req, res) => {
    Post.find()
      .sort({ date: -1 })
      .then(posts => res.json({ posts }))
      .catch(err => res.status(404).json(err));
  });

  /**
   * @route		GET api/v1/posts/:post_id
   * @desc		Get Post by id
   * @access	Public
   */  
  router.get('/:post_id', (req, res) => {
    Post.findById(req.params.post_id)
      .then(post => {

        if (!post) {
          return res.status(404).json({
            error: {
              status: 404,
              message: "No Post Found"
            }
          })
        }

        res.json({ post })
      })
      .catch(err => res.status(500).json(err));
  });

  /**
   * @route		POST api/v1/posts/
   * @desc		Create a new Post
   * @access	Private
   */  
  router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {

    const newPostInput = req.body.post;
    const currentUser = req.user;

    const { errors, isValid } = validatePostInput(newPostInput);
  
    // Check Validation
    if(!isValid) {
      return res.status(400).json(errors);
    }
  
    const newPost = new Post({
      text: newPostInput.text,
      user: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
    });
  
    newPost.save()
      .then(post => res.status(201).json({ post }))
      .catch(error => res.status(500).json(error));
  });

  /**
   * @route  DELETE api/v1/posts/:post_id
   * @desc   Delete Post by id
   * @access Private
   */
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
              .then(() => res.json({}))
              .catch(err => res.status(404).json(err))
          })
          .catch(err => res.status(404).json(err))
      })
      .catch(err => res.status(404).json(err))
  });

  /**
   * @route		PUT api/v1/posts/:post_id/like/
   * @desc		like Post
   * @access	Private
   */
  router.put('/:post_id/like', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.post_id)
          .then(post => {
            if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
              return res.status(400).json({
                error: {
                  status: 400,
                  message: 'You already liked this post'
                }
              });
            }
  
            // Add user id to likes array
            post.likes.unshift({ user: req.user.id });
            
            post.save()
              .then(post => res.json({ post }));
          })
          .catch(err => res.status(500).json(err))
      })
      .catch(err => res.status(500).json(err))
  });

  /**
   * @route		PUT api/v1/posts/:post_id/unlike
   * @desc		Unlike Post
   * @access	Private
   */  
  router.put('/:post_id/unlike', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.post_id)
          .then(post => {
            if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
              return res.status(400).json({
                error: {
                  status: 400,
                  message: 'You have not yet liked this post'
                }
              })
            }
  
            // Get the remove index
            const removeIndex = post.likes
              .map(item => item.user.toString())
              .indexOf(req.user.id);
  
            // Split out of array
            post.likes.splice(removeIndex, 1);
  
            // Save
            post.save()
              .then(post => res.json({ post }));

          })
          .catch(err => res.status(500).json(err));
      })
      .catch(err => res.status(500).json(err));

  });

  /**
   * @route  GET api/v1/posts/:post_id/comments
   * @desc   Get all Comments from post
   * @access Private
   */
  router.get('/:post_id/comments', (req, res) => {
    Post.findById(req.params.post_id)
      .then(post => {

        if (!post) {
          return res.status(404).json({
            error: {
              status: 404,
              message: "No Post Found"
            }
          })
        }

        res.json({ comments: post.comments })
      })
      .catch(err => res.status(500).json(err));
  });
  
  /**
   * @route   POST api/v1/posts/:post_id/comments
   * @desc		Add comment Post by id
   * @access	Private
   */
  router.post('/:post_id/comments', passport.authenticate('jwt', { session: false }), (req, res) => {

    const newCommentInput = req.body.comment;
    const currentUser = req.user;

    const { errors, isValid } = validatePostInput(newCommentInput);
  
    // Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
  
    Post.findById(req.params.post_id)
      .then(post => {
        const newComment = {
          text: newCommentInput.text,
          name: currentUser.name,
          avatar: currentUser.avatar,
          user: currentUser.id,
        }
  
        // add to comments array
        post.comments.unshift(newComment);
  
        // Save
        post.save()
          .then(post => res.json({ post }))
          .catch(error => res.status(500).json(error))
      })
      .catch(err => res.status(404).json({
        error: {
          status: 404,
          message: 'No Post Found'
        }
      }));
  });

  /**
   * @route  GET api/v1/:post_id/comments/:comment_id
   * @desc   Get a single comment by ID
   * @access Private
   */
  router.get('/:post_id/comments/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  
    Post.findById(req.params.post_id)
      .then(post => {
        //Check if comment exists
        if (post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
          return res.status(404).json({
            error: {
              status: 404,
              message: 'No comment found'
            }
          });
        }
  
        // Get remove index
        const commentIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id)
  
        res.json({ comment: post.comments[commentIndex] });
      })
      .catch(err => res.status(404).json({
        error: {
          status: 404,
          message: 'No Post Found'
        }
      }))
  });

  /**
   * @route  DELETE api/v1/:post_id/comments/:comment_id
   * @desc   Delete comment from Post
   * @access Private
   */
  router.delete('/:post_id/comments/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  
    Post.findById(req.params.post_id)
      .then(post => {
        //Check if comment exists
        if (post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
          return res.status(404).json({
            error: {
              status: 404,
              message: 'Comment does not exist'
            }
          });
        }
  
        // Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id)
  
        // Splice comment outr of array
        post.comments.splice(removeIndex, 1);
  
        post.save().then(post => res.json({ post }));
      })
      .catch(err => res.status(404).json({
        error: {
          status: 404,
          message: 'No Post Found'
        }
      }))
  });

  v1Router.use('/posts', router);
}
