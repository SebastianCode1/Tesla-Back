const Notification = require("../models/Notification")
const User = require("../models/User")

// @desc    Obtener todas las notificaciones de un usuario
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ timestamp: -1 })

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener notificaciones",
      error: error.message,
    })
  }
}

// @desc    Obtener una notificación específica
// @route   GET /api/notifications/:id
// @access  Private
exports.getNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificación no encontrada",
      })
    }

    // Verificar que la notificación pertenece al usuario
    if (notification.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No autorizado para acceder a esta notificación",
      })
    }

    res.status(200).json({
      success: true,
      data: notification,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener la notificación",
      error: error.message,
    })
  }
}

// @desc    Crear una nueva notificación
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body

    // Verificar que el usuario existe
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      })
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || "info",
      read: false,
      timestamp: Date.now(),
    })

    // Emitir evento de Socket.IO si está configurado
    if (req.io) {
      req.io.to(userId.toString()).emit("newNotification", notification)
    }

    res.status(201).json({
      success: true,
      data: notification,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear la notificación",
      error: error.message,
    })
  }
}

// @desc    Marcar notificación como leída
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificación no encontrada",
      })
    }

    // Verificar que la notificación pertenece al usuario
    if (notification.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No autorizado para modificar esta notificación",
      })
    }

    notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true })

    res.status(200).json({
      success: true,
      data: notification,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al marcar la notificación como leída",
      error: error.message,
    })
  }
}

// @desc    Marcar todas las notificaciones como leídas
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true })

    res.status(200).json({
      success: true,
      message: "Todas las notificaciones marcadas como leídas",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al marcar las notificaciones como leídas",
      error: error.message,
    })
  }
}

// @desc    Eliminar una notificación
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificación no encontrada",
      })
    }

    // Verificar que la notificación pertenece al usuario
    if (notification.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No autorizado para eliminar esta notificación",
      })
    }

    await notification.remove()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar la notificación",
      error: error.message,
    })
  }
}

// @desc    Crear notificación para múltiples usuarios
// @route   POST /api/notifications/bulk
// @access  Private/Admin
exports.createBulkNotifications = async (req, res) => {
  try {
    const { userIds, title, message, type } = req.body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un array de IDs de usuarios",
      })
    }

    // Verificar que los usuarios existen
    const users = await User.find({ _id: { $in: userIds } })
    if (users.length !== userIds.length) {
      return res.status(404).json({
        success: false,
        message: "Uno o más usuarios no encontrados",
      })
    }

    const notifications = []

    // Crear notificaciones para cada usuario
    for (const userId of userIds) {
      const notification = await Notification.create({
        userId,
        title,
        message,
        type: type || "info",
        read: false,
        timestamp: Date.now(),
      })

      notifications.push(notification)

      // Emitir evento de Socket.IO si está configurado
      if (req.io) {
        req.io.to(userId.toString()).emit("newNotification", notification)
      }
    }

    res.status(201).json({
      success: true,
      count: notifications.length,
      data: notifications,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear las notificaciones",
      error: error.message,
    })
  }
}
