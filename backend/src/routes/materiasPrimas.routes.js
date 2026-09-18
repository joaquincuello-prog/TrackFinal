const express = require('express');
const router = express.Router();
const MateriasPrimasController = require('../controllers/materiasPrimas.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

router.get('/', MateriasPrimasController.getAll);
router.get('/lotes', MateriasPrimasController.getLotesDisponibles);

module.exports = router;
