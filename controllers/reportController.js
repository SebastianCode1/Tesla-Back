const Report = require('../models/Report');
const ReportTemplate = require('../models/ReportTemplate');
const { generateReportPDF } = require('../utils/pdfGenerator');

// @desc    Obtener todos los reportes
// @route   GET /api/reports
// @access  Private
exports.getReports = async (req, res) => {
  try {
    let query;

    // Filtrar por técnico si se proporciona el ID
    if (req.user.role === 'technician') {
      query = Report.find({ technicianId: req.user.id });
    } else if (req.query.technicianId) {
      query = Report.find({ technicianId: req.query.technicianId });
    } else {
      query = Report.find();
    }

    // Agregar filtros adicionales
    if (req.query.templateType) {
      query = query.find({ templateType: req.query.templateType });
    }

    if (req.query.status) {
      query = query.find({ status: req.query.status });
    }

    // Ejecutar consulta
    const reports = await query;

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener un reporte
// @route   GET /api/reports/:id
// @access  Private
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un reporte con el id ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Crear un reporte
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res) => {
  try {
    // Verificar si la plantilla existe
    const template = await ReportTemplate.findById(req.body.templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla de reporte no encontrada'
      });
    }

    // Asignar el ID del técnico que crea el reporte
    if (req.user.role === 'technician') {
      req.body.technicianId = req.user.id;
      req.body.technicianName = req.user.name;
    }

    const report = await Report.create(req.body);

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar un reporte
// @route   PUT /api/reports/:id
// @access  Private
exports.updateReport = async (req, res) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un reporte con el id ${req.params.id}`
      });
    }

    // Verificar si el usuario puede modificar este reporte
    if (req.user.role === 'technician' && report.technicianId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para actualizar este reporte'
      });
    }

    report = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Eliminar un reporte
// @route   DELETE /api/reports/:id
// @access  Private
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un reporte con el id ${req.params.id}`
      });
    }

    // Verificar si el usuario puede eliminar este reporte
    if (req.user.role === 'technician' && report.technicianId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar este reporte'
      });
    }

    await report.remove();

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

// @desc    Generar PDF para un reporte
// @route   GET /api/reports/:id/pdf
// @access  Private
exports.generatePDF = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un reporte con el id ${req.params.id}`
      });
    }

    // Generar PDF
    const pdfPath = await generateReportPDF(report);

    // Actualizar el campo pdfUrl del reporte
    const pdfUrl = `/uploads/reports/report-${report._id}.pdf`;
    await Report.findByIdAndUpdate(req.params.id, { pdfUrl });

    res.status(200).json({
      success: true,
      data: { pdfUrl }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};