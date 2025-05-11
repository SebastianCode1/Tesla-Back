const express = require("express")
const {
  getMaintenances,
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  updateMaintenanceStatus,
  deleteMaintenance,
  assignTechnician,
} = require("../controllers/maintenanceController")

const router = express.Router()
const { protect, authorize } = require("../middleware/auth")

// Aplicar middleware de autenticación a todas las rutas
router.use(protect)

// Rutas para usuarios autenticados (cualquier rol)
router.get("/", getMaintenances)
router.get("/:id", getMaintenance)

// Rutas para técnicos y administradores
router.put("/:id/status", authorize("technician", "admin"), updateMaintenanceStatus)

// Rutas solo para administradores
router.post("/", authorize("admin"), createMaintenance)
router.put("/:id", authorize("admin"), updateMaintenance)
router.delete("/:id", authorize("admin"), deleteMaintenance)
router.put("/:id/assign", authorize("admin"), assignTechnician)

module.exports = router
