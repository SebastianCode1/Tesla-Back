const express = require("express")
const {
  getServiceRequests,
  getServiceRequest,
  createServiceRequest,
  updateServiceRequest,
  updateServiceRequestStatus,
  deleteServiceRequest,
} = require("../controllers/serviceRequestController")

const router = express.Router()
const { protect, authorize } = require("../middleware/auth")
const upload = require("../utils/fileUpload")

// Aplicar middleware de autenticación a todas las rutas
router.use(protect)

// Rutas para usuarios autenticados (cualquier rol)
router.get("/", getServiceRequests)
router.get("/:id", getServiceRequest)

// Rutas para clientes y administradores
router.post("/", upload.array("images", 5), createServiceRequest)

// Rutas solo para administradores
router.put("/:id", authorize("admin"), upload.array("images", 5), updateServiceRequest)
router.put("/:id/status", authorize("admin"), updateServiceRequestStatus)
router.delete("/:id", authorize("admin"), deleteServiceRequest)

module.exports = router
