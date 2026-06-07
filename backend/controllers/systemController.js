const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Event = require('../models/Event');
const Unit = require('../models/Unit');
const Participant = require('../models/Participant');
const Result = require('../models/Result');
const PosterTemplate = require('../models/PosterTemplate');
const CertificateTemplate = require('../models/CertificateTemplate');
const Announcement = require('../models/Announcement');
const Gallery = require('../models/Gallery');
const Setting = require('../models/Setting');
const AuditLog = require('../models/AuditLog');
const { logAction } = require('../utils/auditLogger');
const fs = require('fs');

// Model Map for backup and restore
const modelsMap = {
  users: User,
  categories: Category,
  events: Event,
  units: Unit,
  participants: Participant,
  results: Result,
  postertemplates: PosterTemplate,
  certificatetemplates: CertificateTemplate,
  announcements: Announcement,
  gallery: Gallery,
  settings: Setting,
  auditlogs: AuditLog,
};

// @desc    Get dashboard metrics / counts
// @route   GET /api/system/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalParticipants = await Participant.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalUnits = await Unit.countDocuments();
    const totalResults = await Result.countDocuments();
    const publishedResults = await Result.countDocuments({ isPublished: true });

    // Latest 5 audit logs
    const latestLogs = await AuditLog.find().populate('user', 'name email').sort('-createdAt').limit(5);

    // Leaderboard preview (Top 3 units)
    const topUnits = await Unit.find().sort({ points: -1, name: 1 }).limit(5);

    res.json({
      success: true,
      stats: {
        totalParticipants,
        totalEvents,
        totalUnits,
        totalResults,
        publishedResults,
        completionPercentage: totalEvents > 0 ? Math.round((publishedResults / totalEvents) * 100) : 0,
      },
      latestLogs,
      topUnits,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get system audit logs
// @route   GET /api/system/audit-logs
// @access  Private/SuperAdmin
const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate('user', 'name email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      logs,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Backup all collections to a JSON file
// @route   GET /api/system/backup
// @access  Private/SuperAdmin
const backupDatabase = async (req, res) => {
  try {
    const backupData = {};

    // Retrieve documents from all collections
    for (const [key, Model] of Object.entries(modelsMap)) {
      // Don't backup audit logs to keep size reasonable, or do if needed. Let's include them.
      backupData[key] = await Model.find();
    }

    const backupJson = JSON.stringify(backupData, null, 2);
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=sahithyolsav_backup_${Date.now()}.json`);
    
    await logAction(req.user._id, 'BACKUP_DATABASE', 'Exported database backup JSON file', req);
    res.send(backupJson);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore database from an uploaded JSON backup file
// @route   POST /api/system/restore
// @access  Private/SuperAdmin
const restoreDatabase = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a backup JSON file' });
  }

  const filePath = req.file.path;

  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const backupData = JSON.parse(rawData);

    // Validate that this is a valid backup
    const keys = Object.keys(backupData);
    const validKeys = Object.keys(modelsMap);
    
    const isValid = keys.some((k) => validKeys.includes(k));
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid backup file structure' });
    }

    // Restore collections
    for (const key of validKeys) {
      if (backupData[key] && Array.isArray(backupData[key])) {
        const Model = modelsMap[key];
        
        // Delete current records
        await Model.deleteMany({});
        
        // Bulk insert if documents exist
        if (backupData[key].length > 0) {
          // Re-insert documents keeping their original IDs
          await Model.insertMany(backupData[key]);
        }
      }
    }

    // Clean up temporary upload file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Log this action. Note: since Users was overwritten, req.user might be stale or restored. 
    // We try to log it under the current user ID
    await logAction(req.user._id, 'RESTORE_DATABASE', 'Restored database from uploaded backup file', req);

    res.json({ success: true, message: 'Database restored successfully' });
  } catch (error) {
    // Clean up file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAuditLogs,
  backupDatabase,
  restoreDatabase,
};
