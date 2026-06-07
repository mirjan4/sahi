const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a participant name'],
      trim: true,
    },
    registerNo: {
      type: String,
      required: [true, 'Please add a registration number'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Participant', ParticipantSchema);
