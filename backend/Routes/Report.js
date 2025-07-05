const express = require('express');
const router = express.Router();
const { generateReport, getReports, downloadReport } = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');

router.get('/', getReports);
router.get('/:reportId/download', downloadReport);
router.post('/generate', generateReport);

module.exports = router; 