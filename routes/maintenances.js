const express = require('express');
const {
  getMaintenances,
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  assignTechnician
} = require('../controllers/maintenanceController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getMaintenances)
  .post(authorize('admin'), createMaintenance);

router.route('/:id')
  .get(getMaintenance)
  .put(updateMaintenance)
  .delete(authorize('admin'), deleteMaintenance);

router.route('/:id/assign')
  .put(authorize('admin'), assignTechnician);

module.exports = router;