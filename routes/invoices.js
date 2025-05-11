const express = require("express")
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  generateInvoicePDF,
} = require("../controllers/invoiceController")

const router = express.Router()
const { protect, authorize } = require("../middleware/auth")

// Aplicar middleware de autenticación a todas las rutas
router.use(protect)

// Rutas para usuarios autenticados (cualquier rol)
router.get("/", getInvoices)
router.get("/:id", getInvoice)
router.get("/:id/pdf", generateInvoicePDF)

// Rutas solo para administradores
router.post("/", authorize("admin"), createInvoice)
router.put("/:id", authorize("admin"), updateInvoice)
router.put("/:id/status", authorize("admin"), updateInvoiceStatus)
router.delete("/:id", authorize("admin"), deleteInvoice)

module.exports = router
