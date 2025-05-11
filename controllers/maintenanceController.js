const Maintenance = require("../models/Maintenance")
const User = require("../models/User")

// @desc    Obtener todos los mantenimientos
// @route   GET /api/maintenances
// @access  Private
exports.getMaintenances = async (req, res) => {
  try {
    const query = {}

    // Filtrar por cliente si se proporciona un ID
    if (req.query.clientId) {
      query.clientId = req.query.clientId
    }

    // Filtrar por técnico si se proporciona un ID
    if (req.query.assignedTechId) {
      query.assignedTechId = req.query.assignedTechId
    }

    // Filtrar por estado si se proporciona
    if (req.query.status) {
      query.status = req.query.status
    }

    // Si el usuario es un cliente, solo mostrar sus mantenimientos
    if (req.user.role === "client") {
      query.clientId = req.user.id
    }

    // Si el usuario es un técnico, solo mostrar sus mantenimientos asignados
    if (req.user.role === "technician") {
      query.assignedTechId = req.user.id
    }

    const maintenances = await Maintenance.find(query)
      .populate("clientId", "name address")
      .populate("assignedTechId", "name")
      .sort({ scheduledDate: 1 })

    res.status(200).json({
      success: true,
      count: maintenances.length,
      data: maintenances,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener mantenimientos",
      error: error.message,
    })
  }
}

// @desc    Obtener un mantenimiento específico
// @route   GET /api/maintenances/:id
// @access  Private
exports.getMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate("clientId", "name address buildingName")
      .populate("assignedTechId", "name phone")

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Mantenimiento no encontrado",
      })
    }

    // Verificar que el usuario tiene acceso a este mantenimiento
    if (
      (req.user.role === "client" && maintenance.clientId._id.toString() !== req.user.id) ||
      (req.user.role === "technician" &&
        maintenance.assignedTechId &&
        maintenance.assignedTechId._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "No autorizado para acceder a este mantenimiento",
      })
    }

    res.status(200).json({
      success: true,
      data: maintenance,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener el mantenimiento",
      error: error.message,
    })
  }
}

// @desc    Crear un nuevo mantenimiento
// @route   POST /api/maintenances
// @access  Private/Admin
exports.createMaintenance = async (req, res) => {
  try {
    const { clientId, assignedTechId, scheduledDate, type } = req.body

    // Verificar que el cliente existe
    const client = await User.findById(clientId)
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      })
    }

    // Verificar que el técnico existe si se proporciona
    if (assignedTechId) {
      const technician = await User.findById(assignedTechId)
      if (!technician || technician.role !== "technician") {
        return res.status(404).json({
          success: false,
          message: "Técnico no encontrado",
        })
      }
    }

    // Crear el mantenimiento
    const maintenance = await Maintenance.create({
      ...req.body,
      clientName: client.name,
      technicianName: assignedTechId ? (await User.findById(assignedTechId)).name : null,
      status: "scheduled",
    })

    // Crear notificaciones
    if (req.createNotification) {
      // Notificar al cliente
      await req.createNotification({
        userId: clientId,
        title: "Mantenimiento Programado",
        message: `Se ha programado un mantenimiento para el ${new Date(scheduledDate).toLocaleDateString()}`,
        type: "info",
      })

      // Notificar al técnico si está asignado
      if (assignedTechId) {
        await req.createNotification({
          userId: assignedTechId,
          title: "Nuevo Mantenimiento Asignado",
          message: `Se le ha asignado un mantenimiento para ${client.name} el ${new Date(scheduledDate).toLocaleDateString()}`,
          type: "task",
        })
      }
    }

    res.status(201).json({
      success: true,
      data: maintenance,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear el mantenimiento",
      error: error.message,
    })
  }
}

// @desc    Actualizar un mantenimiento
// @route   PUT /api/maintenances/:id
// @access  Private/Admin
exports.updateMaintenance = async (req, res) => {
  try {
    let maintenance = await Maintenance.findById(req.params.id)

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Mantenimiento no encontrado",
      })
    }

    // Si se cambia el técnico asignado, actualizar el nombre del técnico
    if (req.body.assignedTechId && req.body.assignedTechId !== maintenance.assignedTechId.toString()) {
      const technician = await User.findById(req.body.assignedTechId)
      if (!technician || technician.role !== "technician") {
        return res.status(404).json({
          success: false,
          message: "Técnico no encontrado",
        })
      }
      req.body.technicianName = technician.name

      // Notificar al nuevo técnico
      if (req.createNotification) {
        await req.createNotification({
          userId: req.body.assignedTechId,
          title: "Nuevo Mantenimiento Asignado",
          message: `Se le ha asignado un mantenimiento para ${maintenance.clientName} el ${new Date(maintenance.scheduledDate).toLocaleDateString()}`,
          type: "task",
        })
      }
    }

    // Actualizar el mantenimiento
    maintenance = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    res.status(200).json({
      success: true,
      data: maintenance,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el mantenimiento",
      error: error.message,
    })
  }
}

// @desc    Actualizar el estado de un mantenimiento
// @route   PUT /api/maintenances/:id/status
// @access  Private
exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!status || !["scheduled", "in-progress", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Estado de mantenimiento inválido",
      })
    }

    let maintenance = await Maintenance.findById(req.params.id)

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Mantenimiento no encontrado",
      })
    }

    // Verificar permisos
    if (req.user.role === "technician") {
      // Verificar que el mantenimiento está asignado a este técnico
      if (!maintenance.assignedTechId || maintenance.assignedTechId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "No autorizado para modificar este mantenimiento",
        })
      }
    } else if (req.user.role === "client") {
      return res.status(403).json({
        success: false,
        message: "No autorizado para modificar el estado del mantenimiento",
      })
    }

    // Actualizar campos adicionales según el estado
    const updateData = { status }

    if (status === "in-progress") {
      // Si cambia a en progreso, registrar la hora de inicio
      updateData.startTime = Date.now()
    } else if (status === "completed") {
      // Si cambia a completado, registrar la hora de finalización
      updateData.completionDate = Date.now()

      // Calcular la duración si hay hora de inicio
      if (maintenance.startTime) {
        updateData.duration = Date.now() - new Date(maintenance.startTime).getTime()
      }
    }

    // Actualizar el mantenimiento
    maintenance = await Maintenance.findByIdAndUpdate(req.params.id, updateData, { new: true })

    // Crear notificaciones según el cambio de estado
    if (req.createNotification) {
      if (status === "in-progress") {
        // Notificar al cliente que el mantenimiento ha comenzado
        await req.createNotification({
          userId: maintenance.clientId,
          title: "Mantenimiento Iniciado",
          message: `El técnico ha comenzado el mantenimiento programado`,
          type: "info",
        })
      } else if (status === "completed") {
        // Notificar al cliente que el mantenimiento ha finalizado
        await req.createNotification({
          userId: maintenance.clientId,
          title: "Mantenimiento Completado",
          message: `El mantenimiento programado ha sido completado`,
          type: "info",
        })

        // Notificar al administrador
        const admins = await User.find({ role: "admin" })
        for (const admin of admins) {
          await req.createNotification({
            userId: admin._id,
            title: "Mantenimiento Completado",
            message: `El técnico ${maintenance.technicianName} ha completado el mantenimiento para ${maintenance.clientName}`,
            type: "info",
          })
        }
      }
    }

    res.status(200).json({
      success: true,
      data: maintenance,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el estado del mantenimiento",
      error: error.message,
    })
  }
}

// @desc    Eliminar un mantenimiento
// @route   DELETE /api/maintenances/:id
// @access  Private/Admin
exports.deleteMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Mantenimiento no encontrado",
      })
    }

    await maintenance.remove()

    // Notificar a los involucrados
    if (req.createNotification) {
      // Notificar al cliente
      await req.createNotification({
        userId: maintenance.clientId,
        title: "Mantenimiento Cancelado",
        message: `El mantenimiento programado para el ${new Date(maintenance.scheduledDate).toLocaleDateString()} ha sido cancelado`,
        type: "info",
      })

      // Notificar al técnico si estaba asignado
      if (maintenance.assignedTechId) {
        await req.createNotification({
          userId: maintenance.assignedTechId,
          title: "Mantenimiento Cancelado",
          message: `El mantenimiento para ${maintenance.clientName} programado para el ${new Date(maintenance.scheduledDate).toLocaleDateString()} ha sido cancelado`,
          type: "info",
        })
      }
    }

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar el mantenimiento",
      error: error.message,
    })
  }
}

// @desc    Asignar técnico a un mantenimiento
// @route   PUT /api/maintenances/:id/assign
// @access  Private/Admin
exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: "Por favor proporcione el ID del técnico",
      })
    }

    // Verificar si el técnico existe
    const technician = await User.findById(technicianId)
    if (!technician || technician.role !== "technician") {
      return res.status(404).json({
        success: false,
        message: "Técnico no encontrado",
      })
    }

    let maintenance = await Maintenance.findById(req.params.id)

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un mantenimiento con el id ${req.params.id}`,
      })
    }

    maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      {
        assignedTechId: technicianId,
        technicianName: technician.name,
      },
      {
        new: true,
        runValidators: true,
      },
    )

    // Notificar al técnico asignado
    if (req.createNotification) {
      await req.createNotification({
        userId: technicianId,
        title: "Nuevo Mantenimiento Asignado",
        message: `Se le ha asignado un mantenimiento para ${maintenance.clientName} el ${new Date(maintenance.scheduledDate).toLocaleDateString()}`,
        type: "task",
      })
    }

    res.status(200).json({
      success: true,
      data: maintenance,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al asignar técnico al mantenimiento",
      error: error.message,
    })
  }
}
