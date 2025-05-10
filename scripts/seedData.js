const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Definir el esquema de usuario directamente en el script para evitar dependencias
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese un nombre'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Por favor ingrese un email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingrese un email válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Por favor ingrese una contraseña'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'technician', 'client'],
    default: 'client'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encriptar contraseña usando bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', UserSchema);

// Función para crear el administrador
const createAdmin = async () => {
  try {
    console.log('Conectando a MongoDB...');
    
    // Conectar a MongoDB con manejo explícito de eventos
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000 // Aumentar el timeout a 15 segundos
    });
    
    console.log('Conexión a MongoDB establecida correctamente');
    
    // Verificar si ya existe un administrador
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Ya existe un usuario administrador en la base de datos');
      console.log('Email:', adminExists.email);
    } else {
      // Crear el usuario administrador
      const adminUser = {
        name: 'Administrador',
        email: 'admin@teslalift.com',
        password: 'admin123',
        role: 'admin'
      };
      
      await User.create(adminUser);
      console.log('Usuario administrador creado exitosamente');
      console.log('Email:', adminUser.email);
      console.log('Contraseña:', 'admin123');
    }
    
    // Cerrar la conexión
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
    
    // Salir del proceso con éxito
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    
    // Intentar cerrar la conexión si está abierta
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Conexión a MongoDB cerrada después de error');
    }
    
    // Salir del proceso con error
    process.exit(1);
  }
};

// Manejar errores de conexión a nivel global
mongoose.connection.on('error', (err) => {
  console.error('Error de conexión a MongoDB:', err.message);
});

// Ejecutar la función principal
createAdmin();