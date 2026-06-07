const mongoose = require('mongoose');

const TeamStandingSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
      unique: true,
    },
    totalPoints: {
      type: Number,
      required: true,
      default: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TeamStanding', TeamStandingSchema);
