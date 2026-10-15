const { Router } = require('express');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authRateLimit } = require('../../middleware/security');
const { registerSchema, loginSchema, refreshSchema } = require('./auth.validation');
const authController = require('./auth.controller');

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), authController.register);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);
router.post('/admin/login', authRateLimit, validate(loginSchema), authController.adminLogin);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.get('/me', authenticate, authController.me);

module.exports = router;
