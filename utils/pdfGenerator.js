const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Genera un PDF para un reporte de mantenimiento
 * @param {Object} report - Objeto de reporte completo
 * @returns {Promise<string>} - Ruta al archivo PDF generado
 */
exports.generateReportPDF = async (report) => {
  return new Promise((resolve, reject) => {
    try {
      // Crear un nuevo documento PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Definir la ruta de salida
      const outputDir = path.join(__dirname, '../uploads/reports');
      
      // Asegurarse de que el directorio existe
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, `report-${report._id}.pdf`);
      
      // Pipe el PDF a un archivo de salida
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Agregar título
      doc.fontSize(20).text('TESLA LIFT', { align: 'center' });
      doc.fontSize(16).text('Reporte de Mantenimiento', { align: 'center' });
      doc.moveDown();
      
      // Información del reporte
      doc.fontSize(12).text(`Edificio: ${report.buildingName}`);
      doc.text(`Fecha: ${new Date(report.date).toLocaleDateString()}`);
      doc.text(`Técnico: ${report.technicianName || 'No especificado'}`);
      doc.text(`Marca de Ascensor: ${report.elevatorBrand}`);
      doc.text(`Cantidad de Ascensores: ${report.elevatorCount}`);
      doc.text(`Cantidad de Pisos: ${report.floorCount}`);
      doc.moveDown();
      
      // Secciones del reporte
      report.sections.forEach(section => {
        doc.fontSize(14).text(section.title, { underline: true });
        doc.moveDown(0.5);
        
        section.items.forEach(item => {
          let valueText = '';
          
          if (typeof item.value === 'boolean') {
            valueText = item.value ? '✓' : '✗';
          } else {
            valueText = item.value.toString();
          }
          
          doc.fontSize(10).text(`${item.description}: ${valueText}`);
        });
        
        doc.moveDown();
      });
      
      // Observaciones
      if (report.observations) {
        doc.fontSize(14).text('Observaciones', { underline: true });
        doc.fontSize(10).text(report.observations);
        doc.moveDown();
      }
      
      // Firmas
      doc.fontSize(14).text('Firmas', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(10).text('Técnico:', { continued: true });
      doc.text('Cliente:', { align: 'right' });
      
      // Si hay firmas, agregarlas
      if (report.technicianSignature) {
        // Convertir base64 a imagen
        const imgData = report.technicianSignature.replace(/^data:image\/\w+;base64,/, '');
        const buf = Buffer.from(imgData, 'base64');
        const signaturePath = path.join(outputDir, `tech-signature-${report._id}.png`);
        fs.writeFileSync(signaturePath, buf);
        doc.image(signaturePath, 50, doc.y, { width: 100 });
        // Eliminar archivo temporal
        fs.unlinkSync(signaturePath);
      }
      
      if (report.clientSignature) {
        const imgData = report.clientSignature.replace(/^data:image\/\w+;base64,/, '');
        const buf = Buffer.from(imgData, 'base64');
        const signaturePath = path.join(outputDir, `client-signature-${report._id}.png`);
        fs.writeFileSync(signaturePath, buf);
        doc.image(signaturePath, 350, doc.y - 50, { width: 100 });
        // Eliminar archivo temporal
        fs.unlinkSync(signaturePath);
      }
      
      // Finalizar el PDF
      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};