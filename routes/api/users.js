const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

const router = express.Router();

//Load input validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');


//load User model
const User = require('../../models/User');
const { route } = require('./posts');

//@route GET api/users/test
//@desc  Test users route
//@access  public

router.get('/test', (req, res) => res.json({
    msg: 'User Works'
}));


//@route POST api/users/register
//@desc  Register User
//@access  public

router.post('/register', (req, res) => {

    const {errors, isValid} = validateRegisterInput(req.body);

    //Check Validation
    if(!isValid) {
        return res.status(400).json(errors);
    }



    User.findOne({email: req.body.email})
    .then(user => {
        if(user){
            errors.email = 'Email Already exist';
             return res.status(400).json(errors);
        } else{
            const avatar = gravatar.url(req.body.email, {
                s: '200', // Size
                r: 'pg', // Rating
                d: 'mm' //Default
            });
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                avatar,
                password: req.body.password
            });

            //encrypting the new password
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if(err) throw err;
                    newUser.password = hash;
                    newUser.save()
                    .then(user => res.json(user))
                    .catch(err => console.log(err));
                });
            });
        }
    });
});

//@route POST api/users/login
//@desc  Login User / Returning JWT token
//@access  public

router.post('/login', (req, res) => {
    const {errors, isValid} = validateLoginInput(req.body);

    //Check Validation
    if(!isValid) {
        //errors.email = 'User not found';
        return res.status(400).json(errors);
    }


    const email = req.body.email;
    const password = req.body.password;

    //Find user by email
    User.findOne({email})
    .then(user => {
        //Check for user
        if(!user){
            errors.email = 'User not found';
            return res.status(404).json(errors);
        }

        //Check Password
        bcrypt.compare(password, user.password)
        .then(isMatch => {
            if(isMatch){
                //User Match

                const payload = {id: user.id, name: user.name, avatar: user.avatar}; //Create JWT payload

                //Sign Token
                jwt.sign(
                    payload, 
                    keys.secretOrKey, 
                    {expiresIn: 3600},
                    (err, token) => {
                        res.json({
                            success: true,
                            token: 'Bearer' + token
                        });
                    });

            } 
            else {
                errors.password = 'Password Incorrect';
                return res.status(400).json(errors);
            }

        })


    })
})

//@route GET api/users/current
//@desc  Login User / Returning current user
//@access  private
router.get(
    '/current',
    passport.authenticate('jwt', {session: false}),
    (req, res) => {
        res.json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email
        });
    }
)



module.exports = router; 