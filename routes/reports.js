const express = require("express")
const {
  getReports,
  getReport,
  createReport,
  updateReport,
  updateReportStatus,
  deleteReport,
  generateReportPDF,
} = require("../controllers/reportController")

const router = express.Router()
const { protect, authorize } = require("../middleware/auth")
const upload = require("../utils/fileUpload")

// Aplicar middleware de autenticación a todas las rutas
router.use(protect)

// Rutas para usuarios autenticados (cualquier rol)
router.get("/", getReports)
router.get("/:id", getReport)
router.get("/:id/pdf", generateReportPDF)

// Rutas para técnicos y administradores
router.post(
  "/",
  authorize("technician", "admin"),
  upload.fields([
    { name: "technicianSignature", maxCount: 1 },
    { name: "clientSignature", maxCount: 1 },
  ]),
  createReport,
)

router.put(
  "/:id",
  authorize("technician", "admin"),
  upload.fields([
    { name: "technicianSignature", maxCount: 1 },
    { name: "clientSignature", maxCount: 1 },
  ]),
  updateReport,
)

router.put("/:id/status", authorize("technician", "admin"), updateReportStatus)

// Rutas solo para administradores
router.delete("/:id", authorize("admin"), deleteReport)

module.exports = router
