const ServiceRequest = require('../models/ServiceRequest');

// @desc    Obtener todas las solicitudes de servicio
// @route   GET /api/service-requests
// @access  Private
exports.getServiceRequests = async (req, res) => {
  try {
    let query;

    // Filtrar por cliente si es un cliente
    if (req.user.role === 'client') {
      query = ServiceRequest.find({ clientId: req.user.id });
    } else {
      query = ServiceRequest.find();
    }

    // Aplicar filtros adicionales
    if (req.query.status) {
      query = query.find({ status: req.query.status });
    }

    if (req.query.requestType) {
      query = query.find({ requestType: req.query.requestType });
    }

    const serviceRequests = await query;

    res.status(200).json({
      success: true,
      count: serviceRequests.length,
      data: serviceRequests
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener una solicitud de servicio
// @route   GET /api/service-requests/:id
// @access  Private
exports.getServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: `No se encontró una solicitud con el id ${req.params.id}`
      });
    }

    // Verificar acceso
    if (req.user.role === 'client' && serviceRequest.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a este recurso'
      });
    }

    res.status(200).json({
      success: true,
      data: serviceRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Crear una solicitud de servicio
// @route   POST /api/service-requests
// @access  Private
exports.createServiceRequest = async (req, res) => {
  try {
    // Si es un cliente, asignar su ID
    if (req.user.role === 'client') {
      req.body.clientId = req.user.id;
    }

    const serviceRequest = await ServiceRequest.create(req.body);

    res.status(201).json({
      success: true,
      data: serviceRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar una solicitud de servicio
// @route   PUT /api/service-requests/:id
// @access  Private
exports.updateServiceRequest = async (req, res) => {
  try {
    let serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: `No se encontró una solicitud con el id ${req.params.id}`
      });
    }

    // Verificar acceso
    if (req.user.role === 'client' && serviceRequest.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para actualizar este recurso'
      });
    }

    serviceRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: serviceRequest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de solicitud inválido'
      });
    }

    let serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud de servicio no encontrada'
      });
    }

    // Solo los administradores pueden cambiar el estado
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para cambiar el estado de solicitudes'
      });
    }

    // Actualizar solo el estado
    serviceRequest = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    // Notificar al cliente del cambio de estado
    if (req.createNotification) {
      let message = '';
      let type = 'info';

      switch (status) {
        case 'approved':
          message = 'Su solicitud de servicio ha sido aprobada';
          break;
        case 'in-progress':
          message = 'Su solicitud de servicio está siendo procesada';
          break;
        case 'completed':
          message = 'Su solicitud de servicio ha sido completada';
          break;
        case 'cancelled':
          message = 'Su solicitud de servicio ha sido cancelada';
          type = 'emergency';
          break;
        default:
          message = `El estado de su solicitud de servicio ha cambiado a: ${status}`;
      }

      await req.createNotification({
        userId: serviceRequest.clientId,
        title: 'Actualización de Solicitud',
        message,
        type
      });
    }

    res.status(200).json({
      success: true,
      data: serviceRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la solicitud',
      error: error.message
    });
  }
};

// @desc    Eliminar una solicitud de servicio
// @route   DELETE /api/service-requests/:id
// @access  Private
exports.deleteServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: `No se encontró una solicitud con el id ${req.params.id}`
      });
    }

    // Verificar acceso
    if (req.user.role === 'client' && serviceRequest.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar este recurso'
      });
    }

    await serviceRequest.remove();

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