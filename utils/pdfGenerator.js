const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")

/**
 * Genera un PDF para un reporte de mantenimiento
 * @param {Object} report - Objeto de reporte completo
 * @returns {Promise<string>} - Ruta al archivo PDF generado
 */
exports.generateReportPDF = async (report) => {
  return new Promise((resolve, reject) => {
    try {
      // Crear un nuevo documento PDF
      const doc = new PDFDocument({ margin: 50 })

      // Definir la ruta de salida
      const outputDir = path.join(__dirname, "../public/uploads/reports")

      // Asegurarse de que el directorio existe
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      const outputPath = path.join(outputDir, `report-${report._id}.pdf`)

      // Pipe el PDF a un archivo de salida
      const stream = fs.createWriteStream(outputPath)
      doc.pipe(stream)

      // Agregar logo (asumiendo que existe)
      // doc.image(path.join(__dirname, '../public/uploads/logo.png'), 50, 45, { width: 150 });

      // Agregar título
      doc.fontSize(20).text("TESLA LIFT", { align: "center" })
      doc.fontSize(16).text("Reporte de Mantenimiento", { align: "center" })
      doc.moveDown()

      // Información del reporte
      doc.fontSize(12).text(`Edificio: ${report.buildingName}`)
      doc.text(`Fecha: ${new Date(report.date).toLocaleDateString()}`)
      doc.text(`Técnico: ${report.technicianName || "No especificado"}`)
      doc.text(`Marca de Ascensor: ${report.elevatorBrand}`)
      doc.text(`Cantidad de Ascensores: ${report.elevatorCount}`)
      doc.text(`Cantidad de Pisos: ${report.floorCount}`)
      doc.moveDown()

      // Secciones del reporte
      report.sections.forEach((section) => {
        doc.fontSize(14).text(section.title, { underline: true })
        doc.moveDown(0.5)

        section.items.forEach((item) => {
          let valueText = ""

          if (typeof item.value === "boolean") {
            valueText = item.value ? "✓" : "✗"
          } else {
            valueText = item.value.toString()
          }

          doc.fontSize(10).text(`${item.description}: ${valueText}`)
        })

        doc.moveDown()
      })

      // Observaciones
      if (report.observations) {
        doc.fontSize(14).text("Observaciones", { underline: true })
        doc.fontSize(10).text(report.observations)
        doc.moveDown()
      }

      // Firmas
      doc.fontSize(14).text("Firmas", { underline: true })
      doc.moveDown(0.5)

      doc.fontSize(10).text("Técnico:", { continued: true })
      doc.text("Cliente:", { align: "right" })

      // Si hay firmas, agregarlas
      if (report.technicianSignature) {
        // Convertir base64 a imagen
        const imgData = report.technicianSignature.replace(/^data:image\/\w+;base64,/, "")
        const buf = Buffer.from(imgData, "base64")
        const signaturePath = path.join(outputDir, `tech-signature-${report._id}.png`)
        fs.writeFileSync(signaturePath, buf)
        doc.image(signaturePath, 50, doc.y, { width: 100 })
        // Eliminar archivo temporal
        fs.unlinkSync(signaturePath)
      }

      if (report.clientSignature) {
        const imgData = report.clientSignature.replace(/^data:image\/\w+;base64,/, "")
        const buf = Buffer.from(imgData, "base64")
        const signaturePath = path.join(outputDir, `client-signature-${report._id}.png`)
        fs.writeFileSync(signaturePath, buf)
        doc.image(signaturePath, 350, doc.y - 50, { width: 100 })
        // Eliminar archivo temporal
        fs.unlinkSync(signaturePath)
      }

      // Finalizar el PDF
      doc.end()

      stream.on("finish", () => {
        resolve(`/uploads/reports/report-${report._id}.pdf`)
      })

      stream.on("error", (err) => {
        reject(err)
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Genera un PDF para una factura
 * @param {Object} invoice - Objeto de factura completo
 * @param {Object} client - Objeto de cliente
 * @returns {Promise<string>} - Ruta al archivo PDF generado
 */
exports.generateInvoicePDF = async (invoice, client) => {
  return new Promise((resolve, reject) => {
    try {
      // Crear un nuevo documento PDF
      const doc = new PDFDocument({ margin: 50 })

      // Definir la ruta de salida
      const outputDir = path.join(__dirname, "../public/uploads/invoices")

      // Asegurarse de que el directorio existe
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      const outputPath = path.join(outputDir, `invoice-${invoice._id}.pdf`)

      // Pipe el PDF a un archivo de salida
      const stream = fs.createWriteStream(outputPath)
      doc.pipe(stream)

      // Agregar logo (asumiendo que existe)
      // doc.image(path.join(__dirname, '../public/uploads/logo.png'), 50, 45, { width: 150 });

      // Agregar título
      doc.fontSize(20).text("TESLA LIFT", { align: "center" })
      doc.fontSize(16).text("FACTURA", { align: "center" })
      doc.moveDown()

      // Información de la factura
      doc.fontSize(12).text(`Factura #: ${invoice._id}`)
      doc.text(`Fecha: ${new Date(invoice.date).toLocaleDateString()}`)
      doc.text(`Fecha de Vencimiento: ${new Date(invoice.dueDate).toLocaleDateString()}`)
      doc.text(
        `Estado: ${invoice.status === "paid" ? "PAGADO" : invoice.status === "pending" ? "PENDIENTE" : "VENCIDO"}`,
      )
      doc.moveDown()

      // Información del cliente
      doc.fontSize(14).text("Información del Cliente", { underline: true })
      doc.fontSize(10).text(`Nombre: ${client.name}`)
      doc.text(`Email: ${client.email}`)
      if (client.address) doc.text(`Dirección: ${client.address}`)
      if (client.ruc) doc.text(`RUC: ${client.ruc}`)
      doc.moveDown()

      // Detalles de la factura
      doc.fontSize(14).text("Detalles", { underline: true })
      doc.moveDown(0.5)

      // Si hay items específicos
      if (invoice.items && invoice.items.length > 0) {
        // Crear tabla
        const tableTop = doc.y
        const itemX = 50
        const descriptionX = 150
        const quantityX = 350
        const priceX = 400
        const amountX = 480

        // Encabezados de tabla
        doc
          .fontSize(10)
          .text("Item", itemX, tableTop)
          .text("Descripción", descriptionX, tableTop)
          .text("Cant.", quantityX, tableTop)
          .text("Precio", priceX, tableTop)
          .text("Total", amountX, tableTop)

        doc.moveDown()
        const tableY = doc.y

        // Filas de la tabla
        invoice.items.forEach((item, i) => {
          const y = tableY + i * 20
          doc
            .fontSize(10)
            .text((i + 1).toString(), itemX, y)
            .text(item.description, descriptionX, y)
            .text(item.quantity.toString(), quantityX, y)
            .text(`$${item.price.toFixed(2)}`, priceX, y)
            .text(`$${(item.quantity * item.price).toFixed(2)}`, amountX, y)
        })

        doc.moveDown(invoice.items.length + 1)
      } else {
        // Si no hay items específicos, mostrar solo la descripción general
        doc.fontSize(10).text(`Descripción: ${invoice.description}`)
        doc.moveDown()
      }

      // Total
      doc.fontSize(12).text(`Total: $${invoice.amount.toFixed(2)}`, { align: "right" })
      doc.moveDown()

      // Términos y condiciones
      doc.fontSize(10).text("Términos y Condiciones", { underline: true })
      doc.fontSize(8).text("1. El pago debe realizarse antes de la fecha de vencimiento.")
      doc.text("2. Los pagos atrasados pueden estar sujetos a cargos adicionales.")
      doc.text("3. Para cualquier consulta sobre esta factura, contacte a nuestro departamento de facturación.")

      // Finalizar el PDF
      doc.end()

      stream.on("finish", () => {
        resolve(`/uploads/invoices/invoice-${invoice._id}.pdf`)
      })

      stream.on("error", (err) => {
        reject(err)
      })
    } catch (error) {
      reject(error)
    }
  })
}
