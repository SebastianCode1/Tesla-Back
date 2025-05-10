const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestType: {
    type: String,
    enum: ['maintenance', 'installation', 'consultation'],
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  description: {
    type: String,
    required: true
  },
  availableDays: [String],
  preferredTimeSlot: String,
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    type: Date,
    required: true
  },
  contactMethod: {
    type: String,
    enum: ['phone', 'email', 'whatsapp'],
    required: true
  },
  images: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Actualizar la fecha de actualización antes de guardar
ServiceRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);