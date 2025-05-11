const express = require("express")
const {
  getReportTemplates,
  getReportTemplate,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
} = require("../controllers/reportTemplateController")

const router = express.Router()
const { protect, authorize } = require("../middleware/auth")

// Aplicar middleware de autenticación a todas las rutas
router.use(protect)

// Rutas para usuarios autenticados (cualquier rol)
router.get("/", getReportTemplates)
router.get("/:id", getReportTemplate)

// Rutas solo para administradores
router.post("/", authorize("admin"), createReportTemplate)
router.put("/:id", authorize("admin"), updateReportTemplate)
router.delete("/:id", authorize("admin"), deleteReportTemplate)

module.exports = router
