const { body } = require("express-validator")

// Validadores para autenticación
exports.registerValidator = [
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("email").isEmail().withMessage("Ingrese un email válido"),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
  body("role").optional().isIn(["admin", "technician", "client"]).withMessage("Rol inválido"),
]

exports.loginValidator = [
  body("email").isEmail().withMessage("Ingrese un email válido"),
  body("password").notEmpty().withMessage("La contraseña es requerida"),
]

// Validadores para usuarios
exports.userValidator = [
  body("name").optional().notEmpty().withMessage("El nombre es requerido"),
  body("email").optional().isEmail().withMessage("Ingrese un email válido"),
  body("password").optional().isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
  body("role").optional().isIn(["admin", "technician", "client"]).withMessage("Rol inválido"),
  body("status").optional().isIn(["active", "inactive", "pending", "on_leave"]).withMessage("Estado inválido"),
]

// Validadores para reportes
exports.reportValidator = [
  body("technicianId").optional().isMongoId().withMessage("ID de técnico inválido"),
  body("templateId").notEmpty().isMongoId().withMessage("ID de plantilla inválido"),
  body("templateType").notEmpty().isIn(["type1", "type2", "type3"]).withMessage("Tipo de plantilla inválido"),
  body("sheetNumber").notEmpty().isInt({ min: 1 }).withMessage("Número de hoja inválido"),
  body("buildingName").notEmpty().withMessage("Nombre del edificio requerido"),
  body("elevatorBrand").notEmpty().withMessage("Marca del ascensor requerida"),
  body("elevatorCount").notEmpty().isInt({ min: 1 }).withMessage("Cantidad de ascensores inválida"),
  body("floorCount").notEmpty().isInt({ min: 1 }).withMessage("Cantidad de pisos inválida"),
  body("clockInTime").notEmpty().withMessage("Hora de entrada requerida"),
  body("date").notEmpty().withMessage("Fecha requerida"),
  body("sections").isArray().withMessage("Las secciones deben ser un array"),
  body("sections.*.sectionId").notEmpty().withMessage("ID de sección requerido"),
  body("sections.*.title").notEmpty().withMessage("Título de sección requerido"),
  body("sections.*.items").isArray().withMessage("Los items deben ser un array"),
  body("sections.*.items.*.itemId").notEmpty().withMessage("ID de item requerido"),
  body("sections.*.items.*.description").notEmpty().withMessage("Descripción de item requerida"),
  body("sections.*.items.*.value").notEmpty().withMessage("Valor de item requerido"),
]

// Validadores para plantillas de reportes
exports.reportTemplateValidator = [
  body("type").notEmpty().isIn(["type1", "type2", "type3"]).withMessage("Tipo de plantilla inválido"),
  body("name").notEmpty().withMessage("Nombre de plantilla requerido"),
  body("sheetNumber").notEmpty().isInt({ min: 1, max: 3 }).withMessage("Número de hoja inválido"),
  body("sections").isArray().withMessage("Las secciones deben ser un array"),
  body("sections.*.id").notEmpty().withMessage("ID de sección requerido"),
  body("sections.*.title").notEmpty().withMessage("Título de sección requerido"),
  body("sections.*.items").isArray().withMessage("Los items deben ser un array"),
  body("sections.*.items.*.id").notEmpty().withMessage("ID de item requerido"),
  body("sections.*.items.*.description").notEmpty().withMessage("Descripción de item requerida"),
  body("sections.*.items.*.type").optional().isIn(["checkbox", "text", "number"]).withMessage("Tipo de item inválido"),
]

// Validadores para mantenimientos
exports.maintenanceValidator = [
  body("clientId").notEmpty().isMongoId().withMessage("ID de cliente inválido"),
  body("address").notEmpty().withMessage("Dirección requerida"),
  body("scheduledDate").notEmpty().isISO8601().withMessage("Fecha programada inválida"),
  body("coordinates.latitude").notEmpty().isFloat({ min: -90, max: 90 }).withMessage("Latitud inválida"),
  body("coordinates.longitude").notEmpty().isFloat({ min: -180, max: 180 }).withMessage("Longitud inválida"),
  body("assignedTechId").optional().isMongoId().withMessage("ID de técnico inválido"),
  body("type").optional().notEmpty().withMessage("Tipo de mantenimiento requerido"),
  body("status").optional().isIn(["scheduled", "in-progress", "completed"]).withMessage("Estado inválido"),
]

// Validadores para solicitudes de servicio
exports.serviceRequestValidator = [
  body("clientId").optional().isMongoId().withMessage("ID de cliente inválido"),
  body("requestType")
    .notEmpty()
    .isIn(["maintenance", "installation", "consultation"])
    .withMessage("Tipo de solicitud inválido"),
  body("serviceType").notEmpty().withMessage("Tipo de servicio requerido"),
  body("urgencyLevel").optional().isIn(["low", "normal", "high"]).withMessage("Nivel de urgencia inválido"),
  body("description").notEmpty().withMessage("Descripción requerida"),
  body("preferredDate").notEmpty().isISO8601().withMessage("Fecha preferida inválida"),
  body("preferredTime").notEmpty().isISO8601().withMessage("Hora preferida inválida"),
  body("contactMethod").notEmpty().isIn(["phone", "email", "whatsapp"]).withMessage("Método de contacto inválido"),
]

// Validadores para facturas
exports.invoiceValidator = [
  body("clientId").notEmpty().isMongoId().withMessage("ID de cliente inválido"),
  body("amount").notEmpty().isFloat({ min: 0 }).withMessage("Monto inválido"),
  body("dueDate").notEmpty().isISO8601().withMessage("Fecha de vencimiento inválida"),
  body("description").notEmpty().withMessage("Descripción requerida"),
  body("status").optional().isIn(["paid", "pending", "overdue"]).withMessage("Estado inválido"),
]

// Validadores para notificaciones
exports.notificationValidator = [
  body("userId").notEmpty().isMongoId().withMessage("ID de usuario inválido"),
  body("title").notEmpty().withMessage("Título requerido"),
  body("message").notEmpty().withMessage("Mensaje requerido"),
  body("type").optional().isIn(["emergency", "task", "info"]).withMessage("Tipo de notificación inválido"),
]

// Validador para notificaciones masivas
exports.bulkNotificationValidator = [
  body("userIds").isArray().withMessage("IDs de usuarios debe ser un array"),
  body("userIds.*").isMongoId().withMessage("ID de usuario inválido"),
  body("title").notEmpty().withMessage("Título requerido"),
  body("message").notEmpty().withMessage("Mensaje requerido"),
  body("type").optional().isIn(["emergency", "task", "info"]).withMessage("Tipo de notificación inválido"),
]
