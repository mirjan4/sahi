const mongoose = require('mongoose');

const WinnerSchema = new mongoose.Schema({
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true,
  },
  position: {
    type: Number,
    enum: [1, 2, 3, 0], // 0 indicates no position (grade only)
    default: 0,
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', ''],
    default: '',
  },
  points: {
    type: Number,
    default: 0,
  },
});

const ResultSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true, // One result record per event
    },
    winners: [WinnerSchema],
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Result', ResultSchema);
