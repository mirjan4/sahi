const Unit = require('../models/Unit');
const TeamStanding = require('../models/TeamStanding');
const Setting = require('../models/Setting');
const Result = require('../models/Result');
const Event = require('../models/Event');
const { logAction } = require('../utils/auditLogger');

// @desc    Get all units
// @route   GET /api/units
// @access  Public
const getUnits = async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex }
      ];
    }

    let sort = 'name';
    if (req.query.sortBy) {
      const direction = req.query.sortOrder === 'desc' ? -1 : 1;
      sort = { [req.query.sortBy]: direction };
    }

    if (req.query.page) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalRecords = await Unit.countDocuments(filter);
      const totalPages = Math.ceil(totalRecords / limit);
      const units = await Unit.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        units,
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      });
    } else {
      const units = await Unit.find(filter).sort(sort);
      res.json({ success: true, units });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get leaderboard / ranking
// @route   GET /api/units/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Unit.find().sort({ points: -1, name: 1 });
    
    // Fetch settings
    const settings = await Setting.find();
    const settingsObj = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    const dbTotalEvents = await Event.countDocuments();
    const totalEvents = Number(settingsObj['total_events']) || dbTotalEvents || 135;
    const publishedEvents = await Result.countDocuments({ isPublished: true });
    
    const finalStatusEnabled = settingsObj['final_status_override'] === 'true' || publishedEvents >= totalEvents;

    res.json({ 
      success: true, 
      leaderboard,
      totalEvents,
      publishedEvents,
      finalStatusEnabled
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single unit by ID
// @route   GET /api/units/:id
// @access  Public
const getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }
    res.json({ success: true, unit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a unit
// @route   POST /api/units
// @access  Private/Admin
const createUnit = async (req, res) => {
  const { name, code } = req.body;

  try {
    const codeExists = await Unit.findOne({ code: code.toUpperCase() });
    if (codeExists) {
      return res.status(400).json({ success: false, message: 'Unit code already exists' });
    }

    const unit = await Unit.create({ name, code: code.toUpperCase() });
    await logAction(req.user._id, 'CREATE_UNIT', `Created unit ${name} (${code.toUpperCase()})`, req);

    res.status(201).json({ success: true, unit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a unit
// @route   PUT /api/units/:id
// @access  Private/Admin
const updateUnit = async (req, res) => {
  const { name, code, points } = req.body;

  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    if (code && code.toUpperCase() !== unit.code) {
      const codeExists = await Unit.findOne({ code: code.toUpperCase() });
      if (codeExists) {
        return res.status(400).json({ success: false, message: 'Unit code already exists' });
      }
      unit.code = code.toUpperCase();
    }

    unit.name = name || unit.name;
    if (points !== undefined) {
      unit.points = Number(points);
    }
    
    const updatedUnit = await unit.save();
    await logAction(req.user._id, 'UPDATE_UNIT', `Updated unit to ${unit.name} (Points: ${unit.points})`, req);

    res.json({ success: true, unit: updatedCategory = updatedUnit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a unit
// @route   DELETE /api/units/:id
// @access  Private/Admin
const deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found' });
    }

    await Unit.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'DELETE_UNIT', `Deleted unit ${unit.name}`, req);

    res.json({ success: true, message: 'Unit deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update manual team standings
// @route   PUT /api/units/standings
// @access  Private/Admin
const updateStandings = async (req, res) => {
  const { standings } = req.body; // Expects array: [ { teamId: '...', totalPoints: 120 }, ... ]

  if (!standings || !Array.isArray(standings)) {
    return res.status(400).json({ success: false, message: 'Invalid standings data' });
  }

  try {
    const promises = standings.map(async (item) => {
      const { teamId, totalPoints } = item;
      
      // 1. Update points in Unit model (for scoreboards)
      await Unit.findByIdAndUpdate(teamId, { points: Number(totalPoints) });

      // 2. Upsert in TeamStanding model
      let standing = await TeamStanding.findOne({ teamId });
      if (standing) {
        standing.totalPoints = Number(totalPoints);
        standing.updatedBy = req.user._id;
        return standing.save();
      } else {
        return TeamStanding.create({
          teamId,
          totalPoints: Number(totalPoints),
          updatedBy: req.user._id
        });
      }
    });

    await Promise.all(promises);
    await logAction(req.user._id, 'UPDATE_TEAM_STANDINGS', 'Manually updated team total points standings', req);

    res.json({ success: true, message: 'Standings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUnits,
  getLeaderboard,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
  updateStandings,
};
