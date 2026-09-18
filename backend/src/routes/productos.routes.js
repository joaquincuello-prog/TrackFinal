const express = require('express');
const router = express.Router();
const ProductosController = require('../controllers/productos.controller');
const authenticateToken = require('../middlewares/auth.middleware');

// Todas las consultas de catálogo requieren sesión activa
router.use(authenticateToken);

router.get('/', ProductosController.getAll);
router.get('/:id', ProductosController.getById);

module.exports = router;
