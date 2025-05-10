const express = require('express');
const {
  getServiceRequests,
  getServiceRequest,
  createServiceRequest,
  updateServiceRequest,
  deleteServiceRequest
} = require('../controllers/serviceRequestController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getServiceRequests)
  .post(createServiceRequest);

router.route('/:id')
  .get(getServiceRequest)
  .put(updateServiceRequest)
  .delete(authorize('admin'), deleteServiceRequest);

module.exports = router;