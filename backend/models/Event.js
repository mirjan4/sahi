const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add an event name'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please add an event code'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    type: {
      type: String,
      enum: ['single', 'group'],
      default: 'single',
    },
    points: {
      first: { type: Number, default: 5 },
      second: { type: Number, default: 3 },
      third: { type: Number, default: 1 },
      gradeA: { type: Number, default: 5 },
      gradeB: { type: Number, default: 3 },
      gradeC: { type: Number, default: 1 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', EventSchema);
