const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
    },
    type: {
      type: String,
      enum: ['news', 'circular', 'notification'],
      default: 'news',
    },
    attachment: {
      type: String, // URL/Path to PDF or image if any
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Announcement', AnnouncementSchema);
