const express = require("express")
const {
  getNotifications,
  getNotification,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createBulkNotifications,
} = require("../controllers/notificationController")

const router = express.Router()
const { protect, authorize } = require("../middleware/auth")

// Aplicar middleware de autenticación a todas las rutas
router.use(protect)

// Rutas para usuarios autenticados (cualquier rol)
router.get("/", getNotifications)
router.get("/:id", getNotification)
router.put("/:id/read", markAsRead)
router.put("/read-all", markAllAsRead)

// Rutas solo para administradores
router.post("/", authorize("admin"), createNotification)
router.post("/bulk", authorize("admin"), createBulkNotifications)
router.delete("/:id", authorize("admin"), deleteNotification)

module.exports = router
