const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User')
const Comment = require('../models/Comment');
const {check, validationResult} = require('express-validator/check');
const router = express.Router();
router.route('/api/register', [
    check('email')
        .not().isEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email  should be an email address')
        .not().isEmpty().withMessage('Email is required'),
    check('firstname')
        .not().isEmpty().withMessage('First name is required')
        .isLength({min: 2}).withMessage('Firstname should be at least 2 letters')
        .matches(/^([A-z]|\s)+$/).withMessage('Firstname cannot have numbers'),
    check('lastname')
        .not().isEmpty().withMessage('Last name is required')
        .isLength({min: 2}).withMessage('Lastname should be at least 2 letters')
        .matches(/^([A-z]|\s)+$/).withMessage('Lastname cannot have numbers'),
    check('password')
        .not().isEmpty().withMessage('Password is required')
        .isLength({min: 6}).withMessage('Password should be at least 6 characters'),
    check("passwordConfirmation", "Password confirmation  is required or should be the same as password")
        .custom(function (value, {req}) {
            if (value !== req.body.password) {
                throw new Error("Password don't match");
            }
            return value;
        }),
    check('email').custom(value => {
        return User.findOne({email: value})
            .then(function (user) {
                if (user) {
                    throw new Error('This email is already in use');
                }
            })
        //return value;
    }),
]).post((req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({errors: errors.mapped()});
    }
    User.create({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        password: req.body.password,
        passwordConfirmation: req.body.passwordConfirmation,
    })
        .then(function (user) {
            return res.send({status: 'success', message: 'User created in database'});
        })
        .catch(function (error) {
            return res.send({status: 'error', message: 'Something went wrong'});
        });
});
router.route('/api/login').post((req, res) => {
    User.findOne({
        email: req.body.email,
        password: req.body.password
    })
        .then(function (user) {
            if (!user) {
                let errors_value = {
                    login: {msg: 'Wrong email or password'}
                }
                return res.send({errors: errors_value})
            } else {
                req.session.user = {_id: user.id, email: user.email};
                return res.send({user: {_id: user.id, email: user.email}, message: 'You are signed in'});
            }
        })
        .catch(function (error) {
            console.log(error);
        })
})
router.route('/api/current_user').get((req, res) => {
    if (req.session.user) {
        User.findById(req.session.user._id)
            .then(function (user) {
                res.send({
                    _id: user._id,
                    username: user.username,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                })
            })
    } else {
        res.send({error: 'not logged in'})
    }
});
router.route('/api/post', [
    check('postMessage')
        .not().isEmpty().withMessage('Post field is required')
]).post((req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({errors: errors.mapped()});
    }
    Post.create({
        text: req.body.postMessage,
        user: req.body.userId
    })
        .then(function (post) {
            res.send(post);
        })
        .catch(function (error) {
            res.send({status: 'error', message: 'Could not create post in database'});
        });
});
router.route('/api/posts').get((req, res) => {
    Post.find({})
        .populate('user')
        .sort({createdAt: 'desc'})
        .then(function (posts) {
            res.send(posts);
        })
        .catch(function (error) {
            res.send({status: 'error', message: 'Cannot find posts'});
        })
});
router.route('/api/post/:id/like').put((req, res) => {
    Post.findById(req.params.id)
        .then(function (post) {
            let foundUser = false;
            if (post.userlikes) {
                foundUser = post.userlikes.indexOf(req.session.user._id) > -1 ? true : false;
                if (!foundUser)
                    post.userlikes.push(req.session.user._id);
            }
            else {
                post.userlikes = [req.session.user._id];
            }
            if (!foundUser) {
                post.likes = post.likes + 1
                post.save();
                res.send({likes: post.likes})
            }
            else
                res.send({likes: post.likes, message: 'Already Upoted'})
        }).catch(function (error) {
        res.send({status: 'error', message: 'Cannot like the post'});
    })
})
router.route('/api/logout').get((req, res) => {
    req.session = null;
    res.send({message: 'session destroyed'})
});
router.route('api/post/:id/like').get((req, res) => {
    Post.find({post: req.params.id})
})
router.route('/api/post/:id/update').post((req, res) => {
    Post.findById(req.params.id)
        .then(function (post) {
            post.text = req.body.text
            post.save()
                .then(function (post) {
                    res.send(post);
                });
        });
});
module.exports = router;
