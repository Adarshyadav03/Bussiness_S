const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateSchema, loginSchema } = require('../validators');

router.post('/login', validateSchema(loginSchema), authController.login);

module.exports = router;
