const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, (req, res, next) => authController.register(req, res, next));
router.post('/register-admin', authLimiter, (req, res, next) => authController.registerAdmin(req, res, next));
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', optionalAuthenticate, (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));
router.get('/check-username', (req, res, next) => authController.checkUsername(req, res, next));
router.get('/check-mobile', (req, res, next) => authController.checkMobile(req, res, next));
router.post('/send-code', (req, res, next) => authController.sendVerificationCode(req, res, next));
router.post('/verify-code', (req, res, next) => authController.verifyCode(req, res, next));

module.exports = router;
