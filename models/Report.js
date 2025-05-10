const mongoose = require('mongoose');

const ReportItemDataSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
});

const ReportSectionDataSchema = new mongoose.Schema({
  sectionId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  items: [ReportItemDataSchema]
});

const ReportSchema = new mongoose.Schema({
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReportTemplate',
    required: true
  },
  templateType: {
    type: String,
    enum: ['type1', 'type2', 'type3'],
    required: true
  },
  sheetNumber: {
    type: Number,
    required: true
  },
  buildingName: {
    type: String,
    required: true
  },
  elevatorBrand: {
    type: String,
    required: true
  },
  elevatorCount: {
    type: Number,
    required: true
  },
  floorCount: {
    type: Number,
    required: true
  },
  clockInTime: {
    type: String,
    required: true
  },
  clockOutTime: String,
  date: {
    type: String,
    required: true
  },
  sections: [ReportSectionDataSchema],
  observations: String,
  technicianSignature: String,
  clientSignature: String,
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved'],
    default: 'draft'
  },
  pdfUrl: String,
  technicianName: String,
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
ReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Report', ReportSchema);