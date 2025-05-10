const ReportTemplate = require('../models/ReportTemplate');

// @desc    Obtener todas las plantillas de reportes
// @route   GET /api/report-templates
// @access  Private
exports.getReportTemplates = async (req, res) => {
  try {
    let query = ReportTemplate.find();

    // Filtrar por tipo si se proporciona
    if (req.query.type) {
      query = query.find({ type: req.query.type });
    }

    // Ejecutar consulta
    const templates = await query;

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener una plantilla de reporte
// @route   GET /api/report-templates/:id
// @access  Private
exports.getReportTemplate = async (req, res) => {
  try {
    const template = await ReportTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `No se encontró una plantilla con el id ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Crear una plantilla de reporte
// @route   POST /api/report-templates
// @access  Private/Admin
exports.createReportTemplate = async (req, res) => {
  try {
    const template = await ReportTemplate.create(req.body);

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar una plantilla de reporte
// @route   PUT /api/report-templates/:id
// @access  Private/Admin
exports.updateReportTemplate = async (req, res) => {
  try {
    const template = await ReportTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `No se encontró una plantilla con el id ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Eliminar una plantilla de reporte
// @route   DELETE /api/report-templates/:id
// @access  Private/Admin
exports.deleteReportTemplate = async (req, res) => {
  try {
    const template = await ReportTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `No se encontró una plantilla con el id ${req.params.id}`
      });
    }

    await template.remove();

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