const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  profileImage: {
    type: String,
    default: 'default-profile.jpg'
  },
  phone: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'on_leave'],
    default: 'active'
  },
  // Campos específicos para clientes
  ruc: String,
  address: String,
  buildingName: String,
  elevatorBrand: String,
  elevatorCount: Number,
  floorCount: Number,
  contractType: String,
  invoiceStatus: String,
  paymentStatus: {
    type: String,
    enum: ['paid', 'debt'],
  },
  duracionContratoMeses: Number,
  totalCuentaCliente: Number,
  abonosPago: [{
    monto: Number,
    fecha: Date,
    concepto: String
  }],
  // Campos específicos para técnicos
  specialization: [String],
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

// Firmar JWT y retornar
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Verificar si la contraseña ingresada coincide con la almacenada
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);