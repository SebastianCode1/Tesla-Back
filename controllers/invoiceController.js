const Invoice = require("../models/Invoice")
const User = require("../models/User")
const PDFGenerator = require("../utils/pdfGenerator")

// @desc    Obtener todas las facturas
// @route   GET /api/invoices
// @access  Private/Admin
exports.getInvoices = async (req, res) => {
  try {
    const query = {}

    // Filtrar por cliente si se proporciona un ID
    if (req.query.clientId) {
      query.clientId = req.query.clientId
    }

    // Filtrar por estado si se proporciona
    if (req.query.status) {
      query.status = req.query.status
    }

    // Si el usuario es un cliente, solo mostrar sus facturas
    if (req.user.role === "client") {
      query.clientId = req.user.id
    }

    const invoices = await Invoice.find(query).populate("clientId", "name email").sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener facturas",
      error: error.message,
    })
  }
}

// @desc    Obtener una factura específica
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("clientId", "name email address ruc")

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      })
    }

    // Verificar que el usuario tiene acceso a esta factura
    if (req.user.role === "client" && invoice.clientId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No autorizado para acceder a esta factura",
      })
    }

    res.status(200).json({
      success: true,
      data: invoice,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener la factura",
      error: error.message,
    })
  }
}

// @desc    Crear una nueva factura
// @route   POST /api/invoices
// @access  Private/Admin
exports.createInvoice = async (req, res) => {
  try {
    const { clientId, amount, dueDate, description, items } = req.body

    // Verificar que el cliente existe
    const client = await User.findById(clientId)
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado",
      })
    }

    // Crear la factura
    const invoice = await Invoice.create({
      clientId,
      amount,
      dueDate,
      description,
      items,
      status: "pending",
      date: Date.now(),
    })

    // Generar PDF de la factura
    const pdfPath = await PDFGenerator.generateInvoicePDF(invoice, client)

    // Actualizar la factura con la ruta del PDF
    invoice.pdfUrl = pdfPath.replace("public/", "")
    await invoice.save()

    // Crear notificación para el cliente
    if (req.createNotification) {
      await req.createNotification({
        userId: clientId,
        title: "Nueva Factura",
        message: `Se ha generado una nueva factura por $${amount}`,
        type: "info",
      })
    }

    res.status(201).json({
      success: true,
      data: invoice,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear la factura",
      error: error.message,
    })
  }
}

// @desc    Actualizar una factura
// @route   PUT /api/invoices/:id
// @access  Private/Admin
exports.updateInvoice = async (req, res) => {
  try {
    let invoice = await Invoice.findById(req.params.id)

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      })
    }

    // Actualizar la factura
    invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    res.status(200).json({
      success: true,
      data: invoice,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar la factura",
      error: error.message,
    })
  }
}

// @desc    Actualizar el estado de una factura
// @route   PUT /api/invoices/:id/status
// @access  Private/Admin
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!status || !["paid", "pending", "overdue"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Estado de factura inválido",
      })
    }

    let invoice = await Invoice.findById(req.params.id)

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      })
    }

    // Actualizar solo el estado
    invoice = await Invoice.findByIdAndUpdate(req.params.id, { status }, { new: true })

    // Crear notificación para el cliente
    if (req.createNotification) {
      await req.createNotification({
        userId: invoice.clientId,
        title: "Estado de Factura Actualizado",
        message: `Su factura ha sido marcada como ${status === "paid" ? "pagada" : status === "pending" ? "pendiente" : "vencida"}`,
        type: status === "paid" ? "info" : status === "overdue" ? "emergency" : "info",
      })
    }

    res.status(200).json({
      success: true,
      data: invoice,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar el estado de la factura",
      error: error.message,
    })
  }
}

// @desc    Eliminar una factura
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      })
    }

    await invoice.remove()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar la factura",
      error: error.message,
    })
  }
}

// @desc    Generar PDF de una factura
// @route   GET /api/invoices/:id/pdf
// @access  Private
exports.generateInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("clientId", "name email address ruc")

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      })
    }

    // Verificar que el usuario tiene acceso a esta factura
    if (req.user.role === "client" && invoice.clientId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "No autorizado para acceder a esta factura",
      })
    }

    // Generar PDF
    const pdfPath = await PDFGenerator.generateInvoicePDF(invoice, invoice.clientId)

    // Actualizar la factura con la ruta del PDF si no existe
    if (!invoice.pdfUrl) {
      invoice.pdfUrl = pdfPath.replace("public/", "")
      await invoice.save()
    }

    res.status(200).json({
      success: true,
      data: {
        pdfUrl: invoice.pdfUrl,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al generar el PDF de la factura",
      error: error.message,
    })
  }
}
