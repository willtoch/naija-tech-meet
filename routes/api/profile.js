const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

//Load Profile Validation
const validateProfileInput = require('../../validation/profile');
//Load experience Validation
const validateExperienceInput = require('../../validation/experience');
//Load education Validation
const validateEducationInput = require('../../validation/education');

//Load Profile Model
const Profile = require('../../models/Profile');
//Load User Model
const User = require('../../models/User');

//@route GET api/profile/test
//@desc  Test profile route
//@access  public

router.get('/test', (req, res) => res.json({
    msg: 'Profile Works'
}));

//@route GET api/profile
//@desc  Get current user profile
//@access  private
router.get('/', passport.authenticate('jwt', {session: false}), (req, res) => {

    const errors = {};
    Profile.findOne({ user: req.user.id})
    .then(profile => {
        if(!profile) {
            errors.noprofile = 'There is no profile for this user'
            return res.status(404).json(errors)
        }
        res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});


//@route GET api/profile/handle/:handle
//@desc  Get current user profile
//@access  public

router.get('/all', (req, res) => {
    Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
        if(!profiles){
            errors.noprofile = 'There is no profiles';
            return res.status(404).json(errors);
        }

        res.json(profiles);
    })
    .catch(err => res.status(404).json({profile: 'There are no profiles'}));
});


//@route GET api/profile/handle/:handle
//@desc  Get current user profile
//@access  public

router.get('/handle/:handle', (req, res) => {
    const errors = {};

    Profile.findOne({handle: req.params.handle}).populate('user', ['name', 'avatar'])
    .then(profile => {
        if(!profile) {
            errors.noprofile = 'There is no profile for this user';
            res.status(404).json(errors);
        }

        res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

//@route GET api/profile/user/:user_id
//@desc  Get profile by user ID
//@access  public

router.get('/user/:user_id', (req, res) => {
    const errors = {};

    Profile.findOne({user_id: req.params.user_id}).populate('user', ['name', 'avatar'])
    .then(profile => {
        if(!profile) {
            errors.noprofile = 'There is no profile for this user';
            res.status(404).json(errors);
        }

        res.json(profile);
    })
    .catch(err => res.status(404).json({profile: 'No profile for this user'}));
});


//@route POST api/profile
//@desc Create  or Edituser profile
//@access  private
router.post('/', passport.authenticate('jwt', {session: false}), (req, res) => {

    const {errors, isValid} = validateProfileInput(req.body);

    //Check validation
    if(!isValid) {
        //return any errors with 400 status
        return res.status(400).json(errors);
    }
    //Get Fields
    const profileFields = {}
    profileFields.user = req.user.id;
    if(req.body.handle) profileFields.handle = req.body.handle;
    if(req.body.company) profileFields.company = req.body.company;
    if(req.body.website) profileFields.website = req.body.website;
    if(req.body.location) profileFields.location = req.body.location;
    if(req.body.bio) profileFields.bio = req.body.bio;
    if(req.body.status) profileFields.status = req.body.status;
    if(req.body.githubusername) profileFields.githubusername = req.body.githubusername;

    // Skills - Split into an array
    if(typeof req.body.skills !== 'underfined') {
        profileFields.skills = req.body.skills.split(',');
    }

    //Social
    profileFields.social = {};
    if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if(req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if(req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id })
    .then(profile => {
        if(profile) {

            //Update the profile
            Profile.findOneAndUpdate(
                {user: req.user.id},
                {$set: profileFields },
                {new: true}
            ).then(profile => res.json(profile));
        } else {

            //create 

            //Check if handle exists
            Profile.findOne({ handle: profileFields.handle}).then (  profile => {
                if(profile) {
                    errors.handle = 'Thant handle already exists';
                    res.status(400).json(errors);
                }

                //Save Profile
                new Profile(profileFields).save().then(profile => res.json(profile));
            });
        }
    });

  
});

//@route POST api/profile/experince
//@desc add experience to profile
//@access  private

router.post('/experience', passport.authenticate('jwt', {session: false}), (req, res) => {

    const {errors, isValid} = validateExperienceInput(req.body);

    //Check Validation
    if(!isValid) {
        //return any errors with 400 status
        return res.status(400).json(errors);
    }
    Profile.findOne({user: req.user.id})
    .then(profile => {
        const newExp = {
            title: req.body.title,
            company: req.body.company,
            location: req.nody.location,
            from: req.body.from,
            to: req.body.to,
            current: req.body.current,
            description: req.body.description
        }

        //Add to experience array
        profile.experience.unshift(newExp);

        profile.save().then(profile => res.json(profile));
    })
});

//@route POST api/profile/education
//@desc add education to profile
//@access  private

router.post('/education', passport.authenticate('jwt', {session: false}), (req, res) => {

    const {errors, isValid} = validateEducationInput(req.body);

    //Check Validation
    if(!isValid) {
        //return any errors with 400 status
        return res.status(400).json(errors);
    }
    Profile.findOne({user: req.user.id})
    .then(profile => {
        const newEdu = {
            school: req.body.school,
            degree: req.body.degree,
            fieldofstudy: req.nody.fieldofstudy,
            from: req.body.from,
            to: req.body.to,
            current: req.body.current,
            description: req.body.description
        }

        //Add to experience array
        profile.education.unshift(newEdu);

        profile.save().then(profile => res.json(profile));
    })
});

//@route DELETE api/profile/experience/:exp_id
//@desc delete experience from profile
//@access  private

router.delete('/experience/:exp_id', passport.authenticate('jwt', {session: false}), (req, res) => {

 
    Profile.findOne({user: req.user.id})
    .then(profile => {
       
        // Get remove index
        const removeIndex = profile.experience
        .map(item => item.id)
        .indexOf(req.params.exp_id);

        //Splice out of array
        profile.experience.splice(removeIndex, 1);

        //save
        profile.save().then(profile => res.json(profile));
  
    }).catch(err => res.status(404).json(err));
});

//@route DELETE api/profile/education/:edu_id
//@desc delete education from profile
//@access  private

router.delete('/education/:edu_id', passport.authenticate('jwt', {session: false}), (req, res) => {

 
    Profile.findOne({user: req.user.id})
    .then(profile => {
       
        // Get remove index
        const removeIndex = profile.education
        .map(item => item.id)
        .indexOf(req.params.edu_id);

        //Splice out of array
        profile.education.splice(removeIndex, 1);

        //save
        profile.save().then(profile => res.json(profile));
  
    }).catch(err => res.status(404).json(err));
});

//@route DELETE api/profile
//@desc delete user and profile
//@access  private

router.delete('/', passport.authenticate('jwt', {session: false}), (req, res) => {
    Profile.findOneAndRemove({user: req.user.id})
    .then(() => {
        User.findOneAndRemove({_id: req.user.id}).then(() => 
        res.json({success: true}));
    });
});

module.exports = router; 