const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateSchema, loginSchema, signupSchema } = require('../validators');

router.post('/login', validateSchema(loginSchema), authController.login);
router.post('/signup', validateSchema(signupSchema), authController.signup);
router.post('/register', validateSchema(signupSchema), authController.signup);

module.exports = router;
