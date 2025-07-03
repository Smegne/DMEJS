const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/signup', (req, res) => res.render('auth/signup'));
router.post('/signup', authController.signup);
router.get('/signin', (req, res) => res.render('auth/signin'));
router.post('/signin', authController.signin);
router.get('/logout', authController.logout);

module.exports = router;