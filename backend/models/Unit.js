const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a unit name'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please add a unit code'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    points: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Unit', UnitSchema);
