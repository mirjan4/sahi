const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Please add a key'],
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', SettingSchema);
