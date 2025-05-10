const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let uploadPath = './uploads/';
    
    // Determinar la carpeta según el tipo de archivo
    if (file.fieldname === 'profileImage') {
      uploadPath += 'profiles/';
    } else if (file.fieldname === 'signature') {
      uploadPath += 'signatures/';
    } else if (file.fieldname === 'serviceImages') {
      uploadPath += 'services/';
    } else {
      uploadPath += 'others/';
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Crear un nombre de archivo único
    cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  // Permitir solo imágenes
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;