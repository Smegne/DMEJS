const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');

router.get('/dashboard', workerController.getDashboard);
router.post('/upload-material', workerController.uploadMaterial);

module.exports = router;