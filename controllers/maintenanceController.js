const Maintenance = require('../models/Maintenance');
const User = require('../models/User');

// @desc    Obtener todos los mantenimientos
// @route   GET /api/maintenances
// @access  Private
exports.getMaintenances = async (req, res) => {
  try {
    let query;

    // Filtrar por usuario según su rol
    if (req.user.role === 'client') {
      query = Maintenance.find({ clientId: req.user.id });
    } else if (req.user.role === 'technician') {
      query = Maintenance.find({ assignedTechId: req.user.id });
    } else {
      query = Maintenance.find();
    }

    // Agregar filtros adicionales
    if (req.query.status) {
      query = query.find({ status: req.query.status });
    }

    if (req.query.clientId) {
      query = query.find({ clientId: req.query.clientId });
    }

    // Filtrar por fechas
    if (req.query.from && req.query.to) {
      query = query.find({
        scheduledDate: {
          $gte: new Date(req.query.from),
          $lte: new Date(req.query.to)
        }
      });
    } else if (req.query.from) {
      query = query.find({
        scheduledDate: { $gte: new Date(req.query.from) }
      });
    } else if (req.query.to) {
      query = query.find({
        scheduledDate: { $lte: new Date(req.query.to) }
      });
    }

    // Ejecutar consulta
    const maintenances = await query;

    res.status(200).json({
      success: true,
      count: maintenances.length,
      data: maintenances
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener un mantenimiento
// @route   GET /api/maintenances/:id
// @access  Private
exports.getMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un mantenimiento con el id ${req.params.id}`
      });
    }

    // Verificar acceso
    if (req.user.role === 'client' && maintenance.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a este recurso'
      });
    }

    if (req.user.role === 'technician' && maintenance.assignedTechId && 
        maintenance.assignedTechId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a este recurso'
      });
    }

    res.status(200).json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Crear un mantenimiento
// @route   POST /api/maintenances
// @access  Private/Admin
exports.createMaintenance = async (req, res) => {
  try {
    // Verificar si el cliente existe
    const client = await User.findById(req.body.clientId);
    if (!client || client.role !== 'client') {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar si el técnico existe (si se proporciona)
    if (req.body.assignedTechId) {
      const technician = await User.findById(req.body.assignedTechId);
      if (!technician || technician.role !== 'technician') {
        return res.status(404).json({
          success: false,
          message: 'Técnico no encontrado'
        });
      }
      // Agregar nombre del técnico
      req.body.technicianName = technician.name;
    }

    // Agregar nombre del cliente
    req.body.clientName = client.name;

    const maintenance = await Maintenance.create(req.body);

    res.status(201).json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar un mantenimiento
// @route   PUT /api/maintenances/:id
// @access  Private
exports.updateMaintenance = async (req, res) => {
  try {
    let maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un mantenimiento con el id ${req.params.id}`
      });
    }

    // Verificar acceso
    if (req.user.role === 'technician' && maintenance.assignedTechId && 
        maintenance.assignedTechId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para actualizar este mantenimiento'
      });
    }

    // Actualizar
    maintenance = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Eliminar un mantenimiento
// @route   DELETE /api/maintenances/:id
// @access  Private/Admin
exports.deleteMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un mantenimiento con el id ${req.params.id}`
      });
    }

    await maintenance.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Asignar técnico a un mantenimiento
// @route   PUT /api/maintenances/:id/assign
// @access  Private/Admin
exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione el ID del técnico'
      });
    }

    // Verificar si el técnico existe
    const technician = await User.findById(technicianId);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({
        success: false,
        message: 'Técnico no encontrado'
      });
    }

    let maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un mantenimiento con el id ${req.params.id}`
      });
    }

    maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { 
        assignedTechId: technicianId,
        technicianName: technician.name
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};