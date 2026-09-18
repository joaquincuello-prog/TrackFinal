const express = require('express');
const router = express.Router();
const DespachosController = require('../controllers/despachos.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/rbac.middleware');

router.use(authenticateToken);

// Consulta de clientes habilitados para expedición
router.get('/clientes', DespachosController.getClientes);

// Consulta de historial de despachos
router.get('/', DespachosController.getAll);

// Registro de remito y salida física (Solo Encargado/Supervisor de despacho y Administrador)
router.post(
  '/',
  authorizeRoles('SUPERVISOR', 'ADMIN'),
  DespachosController.create
);

module.exports = router;
