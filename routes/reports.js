const express = require('express');
const {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  generatePDF
} = require('../controllers/reportController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getReports)
  .post(authorize('admin', 'technician'), createReport);

router.route('/:id')
  .get(getReport)
  .put(authorize('admin', 'technician'), updateReport)
  .delete(authorize('admin', 'technician'), deleteReport);

router.route('/:id/pdf')
  .get(generatePDF);

module.exports = router;