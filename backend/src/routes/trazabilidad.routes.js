const express = require('express');
const router = express.Router();
const TrazabilidadController = require('../controllers/trazabilidad.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

// Consulta de trazabilidad hacia atrás (Backward Traceability)
router.get('/backward/:codigo', TrazabilidadController.getGenealogiaAtras);

// Consulta de trazabilidad hacia adelante (Forward Traceability / Recall)
router.get('/forward/:codigo', TrazabilidadController.getGenealogiaAdelante);

module.exports = router;
