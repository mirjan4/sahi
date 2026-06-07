const mongoose = require('mongoose');

const TextConfigSchema = new mongoose.Schema({
  x: { type: Number, default: 50 },
  y: { type: Number, default: 50 },
  fontSize: { type: Number, default: 20 },
  color: { type: String, default: '#000000' },
  align: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
  fontWeight: { type: String, default: 'normal' },
});

const CertificateTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a template name'],
      trim: true,
    },
    backgroundImage: {
      type: String,
      required: [true, 'Please add a background image URL or path'],
    },
    config: {
      participantName: { type: TextConfigSchema, default: () => ({ x: 50, y: 45, fontSize: 28, color: '#1e3a8a', align: 'center', fontWeight: 'bold' }) },
      eventName: { type: TextConfigSchema, default: () => ({ x: 50, y: 55, fontSize: 20, color: '#111827', align: 'center' }) },
      categoryName: { type: TextConfigSchema, default: () => ({ x: 50, y: 60, fontSize: 18, color: '#374151', align: 'center' }) },
      positionText: { type: TextConfigSchema, default: () => ({ x: 35, y: 68, fontSize: 20, color: '#b45309', align: 'center', fontWeight: 'bold' }) },
      gradeText: { type: TextConfigSchema, default: () => ({ x: 65, y: 68, fontSize: 20, color: '#047857', align: 'center', fontWeight: 'bold' }) },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CertificateTemplate', CertificateTemplateSchema);
