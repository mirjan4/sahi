const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    mediaUrl: {
      type: String,
      required: [true, 'Please add a media URL'],
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Gallery', GallerySchema);
