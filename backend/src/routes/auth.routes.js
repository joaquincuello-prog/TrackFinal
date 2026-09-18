const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Rutas públicas
router.post('/login', AuthController.login);

// Rutas protegidas
router.get('/me', authenticateToken, AuthController.getMe);

module.exports = router;
