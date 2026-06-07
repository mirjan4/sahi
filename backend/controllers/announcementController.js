const Announcement = require('../models/Announcement');
const { logAction } = require('../utils/auditLogger');
const fs = require('fs');
const path = require('path');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
const getAnnouncements = async (req, res) => {
  try {
    const filter = {};
    if (!req.query.all || req.query.all === 'false') {
      filter.isPublished = true;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { type: searchRegex }
      ];
    }

    let sort = '-createdAt';
    if (req.query.sortBy) {
      const direction = req.query.sortOrder === 'desc' ? -1 : 1;
      sort = { [req.query.sortBy]: direction };
    }

    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalRecords = await Announcement.countDocuments(filter);
      const totalPages = Math.ceil(totalRecords / limit);
      const announcements = await Announcement.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        announcements,
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      });
    } else {
      const announcements = await Announcement.find(filter).sort(sort);
      res.json({ success: true, announcements });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single announcement by ID
// @route   GET /api/announcements/:id
// @access  Public
const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private/Admin
const createAnnouncement = async (req, res) => {
  const { title, content, type, isPublished } = req.body;
  let attachment = '';

  if (req.file) {
    attachment = req.file.location; // set by uploadToStorage middleware (Cloudinary URL or static file path)
  }

  try {
    const announcement = await Announcement.create({
      title,
      content,
      type: type || 'news',
      attachment,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    await logAction(req.user._id, 'CREATE_ANNOUNCEMENT', `Created announcement: ${title}`, req);
    res.status(201).json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin
const updateAnnouncement = async (req, res) => {
  const { title, content, type, isPublished } = req.body;

  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (req.file) {
      // delete old local attachment if it exists
      if (announcement.attachment && announcement.attachment.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', announcement.attachment);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      announcement.attachment = req.file.location;
    }

    announcement.title = title || announcement.title;
    announcement.content = content || announcement.content;
    announcement.type = type || announcement.type;
    if (isPublished !== undefined) {
      announcement.isPublished = isPublished;
    }

    const updatedAnnouncement = await announcement.save();
    await logAction(req.user._id, 'UPDATE_ANNOUNCEMENT', `Updated announcement: ${announcement.title}`, req);

    res.json({ success: true, announcement: updatedAnnouncement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // Delete attachment from disk if local
    if (announcement.attachment && announcement.attachment.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', announcement.attachment);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Announcement.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'DELETE_ANNOUNCEMENT', `Deleted announcement: ${announcement.title}`, req);

    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
