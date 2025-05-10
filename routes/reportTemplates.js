const express = require('express');
const {
  getReportTemplates,
  getReportTemplate,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate
} = require('../controllers/reportTemplateController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getReportTemplates)
  .post(authorize('admin'), createReportTemplate);

router.route('/:id')
  .get(getReportTemplate)
  .put(authorize('admin'), updateReportTemplate)
  .delete(authorize('admin'), deleteReportTemplate);

module.exports = router;