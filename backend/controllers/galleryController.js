const Gallery = require('../models/Gallery');
const { logAction } = require('../utils/auditLogger');
const fs = require('fs');
const path = require('path');

// @desc    Get all gallery items
// @route   GET /api/gallery
// @access  Public
const getGallery = async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      filter.title = new RegExp(req.query.search.trim(), 'i');
    }
    if (req.query.mediaType) {
      filter.mediaType = req.query.mediaType;
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

      const totalRecords = await Gallery.countDocuments(filter);
      const totalPages = Math.ceil(totalRecords / limit);
      const galleryItems = await Gallery.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        gallery: galleryItems,
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      });
    } else {
      const galleryItems = await Gallery.find(filter).sort(sort);
      res.json({ success: true, gallery: galleryItems });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a gallery item
// @route   POST /api/gallery
// @access  Private/Admin
const createGalleryItem = async (req, res) => {
  const { title, mediaType } = req.body;
  let mediaUrl = '';

  if (req.file) {
    mediaUrl = req.file.location; // from upload middleware
  } else if (req.body.mediaUrl) {
    mediaUrl = req.body.mediaUrl; // support external embedding (e.g. YouTube videos)
  }

  if (!mediaUrl) {
    return res.status(400).json({ success: false, message: 'Please provide media file or URL' });
  }

  try {
    const galleryItem = await Gallery.create({
      title,
      mediaUrl,
      mediaType: mediaType || 'image',
    });

    await logAction(req.user._id, 'ADD_GALLERY_ITEM', `Added ${galleryItem.mediaType} item to gallery: ${title || 'Untitled'}`, req);
    res.status(201).json({ success: true, galleryItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a gallery item
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
const deleteGalleryItem = async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    // If local, delete the local file
    if (galleryItem.mediaUrl && galleryItem.mediaUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', galleryItem.mediaUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Gallery.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'DELETE_GALLERY_ITEM', `Deleted gallery item ${galleryItem.title || 'Untitled'}`, req);

    res.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGallery,
  createGalleryItem,
  deleteGalleryItem,
};
