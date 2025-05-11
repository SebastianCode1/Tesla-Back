const Report = require("../models/Report")
const ReportTemplate = require("../models/ReportTemplate")
const User = require("../models/User")
const PDFGenerator = require("../utils/pdfGenerator")

// @desc    Obtener todos los reportes
// @route   GET /api/reports
// @access  Private
exports.getReports = async (req, res) => {
  try {
    const query = {}

    // Filtrar por técnico si se proporciona un ID
    if (req.query.technicianId) {
      query.technicianId = req.query.technicianId
    }

    // Filtrar por tipo de plantilla si se proporciona
    if (req.query.templateType) {
      query.templateType = req.query.templateType
    }

    // Filtrar por estado si se proporciona
    if (req.query.status) {
      query.status = req.query.status
    }

    // Si el usuario es un técnico, solo mostrar sus reportes
    if (req.user.role === "technician") {
      query.technicianId = req.user.id
    }

    const reports = await Report.find(query)
      .populate("technicianId", "name")
      .populate("templateId", "name type")
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener reportes",
      error: error.message,
    })
  }
}

// @desc    Obtener un reporte específico
// @route   GET /api/reports/:id
// @access  Private
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("technicianId", "name")
      .populate("templateId", "name type")

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Reporte no encontrado",
      })
    }

    // Verificar que el usuario tiene acceso a este reporte
    if (req.user.role === "technician" && report.technicianId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No autorizado para acceder a este reporte",
      })
    }

    res.status(200).json({
      success: true,
      data: report,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener el reporte",
      error: error.message,
    })
  }
}

// @desc    Crear un nuevo reporte
// @route   POST /api/reports
// @access  Private/Technician
exports.createReport = async (req, res) => {
  try {
    // Si el usuario es un técnico, usar su ID
    if (req.user.role === "technician") {
      req.body.technicianId = req.user.id
      req.body.technicianName = req.user.name
    }

    const { templateId, templateType } = req.body

    // Verificar que la plantilla existe
    const template = await ReportTemplate.findById(templateId)
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Plantilla de reporte no encontrada",
      })
    }

    // Procesar firmas si se proporcionan
    if (req.files) {
      if (req.files.technicianSignature) {
        req.body.technicianSignature = req.files.technicianSignature[0].path.replace("public/", "")
      }
      if (req.files.clientSignature) {
        req.body.clientSignature = req.files.clientSignature[0].path.replace("public/", "")
      }
    }

    // Crear el reporte
    const report = await Report.create(req.body)

    res.status(201).json({
      success: true,
      data: report,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear el reporte",
      error: error.message,
    })
  }
}

// @desc    Actualizar un reporte
// @route   PUT /api/reports/:id
// @access  Private/Technician
exports.updateReport = async (req, res) => {
  try {
    let report = await Report.findById(req.params.id)

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Reporte no encontrado",
      })
    }

    // Verificar que el usuario tiene permiso para actualizar este reporte
    if (req.user.role === "technician" && report.technicianId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No autorizado para actualizar este reporte",
      })
    }

    // Procesar firmas si se proporcionan
    if (req.files) {
      if (req.files.technicianSignature) {
        req.body.technicianSignature = req.files.technicianSignature[0].path.replace("public/", "")
      }
      if (req.files.clientSignature) {
        req.body.clientSignature = req.files.clientSignature[0].path.replace("public/", "")
      }
    }

    // Actualizar el reporte
    report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    res.status(200).json({
      success: true,
      data: report,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el reporte",
      error: error.message,
    })
  }
}

// @desc    Actualizar el estado de un reporte
// @route   PUT /api/reports/:id/status
// @access  Private
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!status || !["draft", "submitted", "approved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Estado de reporte inválido",
      })
    }

    let report = await Report.findById(req.params.id)

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Reporte no encontrado",
      })
    }

    // Verificar permisos según el estado
    if (req.user.role === "technician") {
      // Los técnicos solo pueden cambiar de draft a submitted
      if (report.status === "approved" || (report.status === "submitted" && status === "draft")) {
        return res.status(403).json({
          success: false,
          message: "No autorizado para cambiar el estado del reporte",
        })
      }

      // Verificar que el reporte pertenece al técnico
      if (report.technicianId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "No autorizado para modificar este reporte",
        })
      }
    }

    // Actualizar solo el estado
    report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true })

    // Si el estado cambia a submitted o approved, generar PDF
    if ((status === "submitted" || status === "approved") && !report.pdfUrl) {
      const pdfPath = await PDFGenerator.generateReportPDF(report)
      report.pdfUrl = pdfPath
      await report.save()
    }

    // Crear notificación para el técnico si el admin aprueba el reporte
    if (status === "approved" && req.user.role === "admin" && req.createNotification) {
      await req.createNotification({
        userId: report.technicianId,
        title: "Reporte Aprobado",
        message: `Su reporte para ${report.buildingName} ha sido aprobado`,
        type: "info",
      })
    }

    res.status(200).json({
      success: true,
      data: report,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el estado del reporte",
      error: error.message,
    })
  }
}

// @desc    Eliminar un reporte
// @route   DELETE /api/reports/:id
// @access  Private/Admin
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Reporte no encontrado",
      })
    }

    // Solo los administradores pueden eliminar reportes
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No autorizado para eliminar reportes",
      })
    }

    await report.remove()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar el reporte",
      error: error.message,
    })
  }
}

// @desc    Generar PDF de un reporte
// @route   GET /api/reports/:id/pdf
// @access  Private
exports.generateReportPDF = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Reporte no encontrado",
      })
    }

    // Verificar que el usuario tiene acceso a este reporte
    if (req.user.role === "technician" && report.technicianId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No autorizado para acceder a este reporte",
      })
    }

    // Generar PDF
    const pdfPath = await PDFGenerator.generateReportPDF(report)

    // Actualizar el reporte con la ruta del PDF si no existe
    if (!report.pdfUrl) {
      report.pdfUrl = pdfPath
      await report.save()
    }

    res.status(200).json({
      success: true,
      data: {
        pdfUrl: report.pdfUrl,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al generar el PDF del reporte",
      error: error.message,
    })
  }
}
