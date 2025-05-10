const mongoose = require('mongoose');

const ReportItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['checkbox', 'text', 'number'],
    default: 'checkbox'
  },
  required: {
    type: Boolean,
    default: true
  }
});

const ReportSectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  items: [ReportItemSchema]
});

const ReportTemplateSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['type1', 'type2', 'type3'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sheetNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  sections: [ReportSectionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ReportTemplate', ReportTemplateSchema);