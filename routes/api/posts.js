const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

//Load the post model
const Post = require('../../models/Post');

//Validation
const validatePostInput = require('../../validation/post');
const { profile_url } = require('gravatar');

//@route GET api/posts/test
//@desc  Test posts route
//@access  public

router.get('/test', (req, res) => res.json({
    msg: 'Posts Works'
}));


//@route GET api/posts
//@desc  get post
//@access  public

router.get('/', (req, res) => {
    Post.find()
    .sort({date: -1})
    .then(posts => res.json(post))
    .catch(err => res.status(404).json({nopostsfound: 'No post found'}));
});

//@route GET api/posts/:id
//@desc  get post by ID
//@access  public

router.get('/:id', (req, res) => {
    Post.findById(req.params.id)
    .sort({date: -1})
    .then(posts => res.json(post))
    .catch(err => res.status(404).json({nopostsfound: 'No post found with that ID'}));
});


//@route GET api/posts
//@desc  create post
//@access  private


router.post('/', passport.authenticate('jwt', {session: false}), (req, res) => {

    const {errors, isValid} = validatePostInput(req.body);

    //Check vlaidation
    if(!isValid) {
        //if any errors, send 400 with errors object
        return res.status(400).json(errors);
    }

    const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user_id
});
    newPost.save().then(post => res.json(post));
});

//@route GET api/posts/:id
//@desc  Delete post
//@access  private

router.delete('/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    profile.findOne({user: req.user.id}).then(profile => {
        Post.findById(req.params.id)
        .then(post => {
            //Check for post owner
            if(post.user.toString() !== req.user.id){
                return res
                .status(401)
                .json({notauthorized: 'User not authorized'});
            }

            //Delete
            post.remove().then(() => res.json({success: true}));
        })
        .catch(err => res.status(404).json({postnotfond: 'Post not found'}));
    });
});

//@route GET api/posts/like/:id
//@desc  Like post
//@access  private

router.post('/like/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    profile.findOne({user: req.user.id}).then(profile => {
        Post.findById(req.params.id)
        .then(post => {
           if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
               return res.status(400).json({alreadyliked: 'user already liked this post' });
           }

           //Add user id to likes array
           post.likes.unshift({user: req.user.id});

           //save the likes into database
           post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({postnotfond: 'Post not found'}));
    });
});

//@route GET api/posts/unlike/:id
//@desc  unlike post
//@access  private

router.post('/unlike/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
    profile.findOne({user: req.user.id}).then(profile => {
        Post.findById(req.params.id)
        .then(post => {
           if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
               return res.status(400).json({notliked: 'You have not yet liked this post' });
           }

           //Get remove index
           const removeIndex = post.likes.map(
               item => item.user.toString())
               .indexOf(req.user.id);
            
            //Splce out of array
            post.likes.splice(removeIndex, 1);

            //Save
            post.save().then(post => res.json(post));
           
        })
        .catch(err => res.status(404).json({postnotfond: 'Post not found'}));
    });
});

//@route GET api/posts/comment/:id
//@desc  comment on a post
//@access  private

router.post('/comment/:id', passport.authenticate('jwt', {session: false}), (req, res) => {

    const {errors, isValid} = validatePostInput(req.body);

    //Check vlaidation
    if(!isValid) {
        //if any errors, send 400 with errors object
        return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
    .then(post => {
        const newComment = {
            text: req.body.text,
            name: req.body.name,
            avatar: req.body.avatar,
            user: req.user.id
        }

        //Add to comment array
        post.commnents.unshift(newComment);

        //Save Comment
        post.save().then(post => res.json(post));
    }).catch(errr => res.status(404).json({nopostsfound: 'No Post found'}));
});


//@route DELETE api/posts/comment/:id
//@desc  comment on a post
//@access  private

router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', {session: false}), (req, res) => {
 
    Post.findById(req.params.id)
    .then(post => {
      if(post.comments.filter(comment => comment._id.toStrin() === req.params.comment_id).length === 0 ){
          return res.status(404).json({commentnotexist: 'Comment dose not exist'});
      }

      //Get remove index
      const removeindex = post.comments
      .map(item => item._id.toString())
      .indexOf(req.params.comment_id);

      //splice comment out of array
      post.comments.splice(removeIndex, 1);

      post.save().then(post => res.json(post));

    }).catch(errr => res.status(404).json({nopostsfound: 'No Post found'}));
});

module.exports = router; 