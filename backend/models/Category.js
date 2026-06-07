const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please add a category code'],
      unique: true,
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Category', CategorySchema);
